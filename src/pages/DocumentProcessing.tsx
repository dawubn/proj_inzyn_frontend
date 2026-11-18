import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchAllDocuments } from '@/api/documents-wrapper';
import { fetchDashboardAnalyses, type DashboardAnalysis } from '@/api/documentApi/documentApi';
import type { DocumentResponse } from '@/api/generated/model';
import { Button } from '@/components/ui/button';
import { ProcessingHero } from '@/features/processing/ProcessingHero';
import { QueueCard } from '@/features/processing/QueueCard';
import { pickHeroId } from '@/features/processing/processingModel';
import { useAnalysisTracking } from '@/hooks/analysis/useAnalysisTracking';
import { useCancelAnalysis } from '@/hooks/analysis/useCancelAnalysis';
import { useMediaQuery, REDUCED_MOTION_QUERY } from '@/hooks/useMediaQuery';
import {
  isActiveStatus,
  isCancellableStatus,
  isCompletedStatus,
  isFinishedStatus,
  isQueuedStatus,
  parseProcessingIds,
} from '@/lib/analysisStatus';

// How long a finished analysis stays on top before the next one moves up or results open
const FINISHED_HOLD_MS = 1600;

const transitionName = (analysisId: string) => `processing-${analysisId}`;

type ListAnalysis = DashboardAnalysis & { queue_position?: number | null };
type OrderKey = [number, number, number];

function getNavigationWarning(state: unknown): string | null {
  if (
    typeof state === 'object' &&
    state !== null &&
    'warning' in state &&
    typeof state.warning === 'string'
  ) {
    return state.warning;
  }

  return null;
}

export default function DocumentProcessing() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const cancelMutation = useCancelAnalysis();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const rawIds = searchParams.get('ids');
  const selectedParam = searchParams.get('selected');

  const ids = useMemo(() => {
    try {
      return [
        ...new Set(
          parseProcessingIds(rawIds)
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      ];
    } catch {
      return [];
    }
  }, [rawIds]);

  const warning = getNavigationWarning(location.state);

  // Keep refetching the document list while any file name is still missing
  const missingDocsRef = useRef(false);

  const { data: allDocumentsRaw } = useQuery<DocumentResponse[]>({
    queryKey: ['user-documents-all'],
    queryFn: fetchAllDocuments,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: () => (missingDocsRef.current ? 2000 : false),
  });

  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentResponse>();
    (allDocumentsRaw ?? []).forEach((doc) => map.set(doc.id, doc));
    return map;
  }, [allDocumentsRaw]);

  const { data: allAnalysesRaw } = useQuery<DashboardAnalysis[]>({
    queryKey: ['dashboard-analyses'],
    queryFn: () => fetchDashboardAnalyses(50),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (query) => {
      const list = query.state.data;
      if (!Array.isArray(list)) return 3000;
      return list.some((a) => !isFinishedStatus(a.status)) ? 3000 : false;
    },
  });

  const listMap = useMemo(() => {
    const map = new Map<string, ListAnalysis>();
    (Array.isArray(allAnalysesRaw) ? allAnalysesRaw : []).forEach((a) => map.set(a.id, a));
    return map;
  }, [allAnalysesRaw]);

  // Order key assigned once, the first time an analysis is seen
  const orderRef = useRef(new Map<string, OrderKey>());

  // Unfinished analyses that are not in the URL (queued, pending, processing, ...)
  const extraActiveIds = useMemo(() => {
    const current = new Set(ids);
    return (Array.isArray(allAnalysesRaw) ? allAnalysesRaw : [])
      .filter((a) => !current.has(a.id) && !isFinishedStatus(a.status))
      .map((a) => a.id);
  }, [allAnalysesRaw, ids]);

  // Known ids are only ever appended, so nothing disappears from the list when its status changes
  const [knownIds, setKnownIds] = useState<string[]>(ids);

  useEffect(() => {
    setKnownIds(ids);
    orderRef.current = new Map();
  }, [rawIds]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setKnownIds((prev) => {
      const merged = [...prev];
      [...ids, ...extraActiveIds].forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });
      return merged.length === prev.length ? prev : merged;
    });
  }, [ids, extraActiveIds]);

  const {
    items: trackedItems,
    allFinished,
    hasQueryErrors,
    isFetching,
    refetchAll,
  } = useAnalysisTracking(knownIds);

  // Order: finished (from URL) -> processing -> waiting by queue position.
  // The key is assigned once, so a number never changes when the status changes.
  const items = useMemo(() => {
    trackedItems.forEach((item) => {
      if (orderRef.current.has(item.id)) return;

      const src = listMap.get(item.id) ?? item.data;
      if (!src) return;

      const status = src.status;
      const group = isFinishedStatus(status)
        ? -1
        : isQueuedStatus(status) || status === 'pending'
          ? 1
          : 0;
      const queuePosition =
        (src as { queue_position?: number | null }).queue_position ?? Number.MAX_SAFE_INTEGER;
      const time = new Date(src.created_at).getTime();

      orderRef.current.set(item.id, [group, queuePosition, time]);
    });

    const fallback: OrderKey = [2, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];

    return trackedItems
      .map((item, index) => ({ item, index, key: orderRef.current.get(item.id) ?? fallback }))
      .sort(
        (a, b) =>
          a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2] || a.index - b.index,
      )
      .map((entry) => entry.item);
  }, [trackedItems, listMap]);

  missingDocsRef.current = items.some(
    (item) => !!item.data?.document_id && !documentMap.has(item.data.document_id),
  );

  const statusOf = (id: string | null) =>
    id
      ? (items.find((item) => item.id === id)?.data?.status ?? listMap.get(id)?.status)
      : undefined;

  // Analysis shown on top: starts with the one opened, then follows the processing order
  const [heroId, setHeroId] = useState<string | null>(() => selectedParam || ids[0] || null);
  // Set when the user clicks a queue card; that analysis then stays on top
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  // The analysis leaving the top during a transition: it fades out instead of flying across the list
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const candidates = items.map((item) => ({
    id: item.id,
    status: item.data?.status ?? listMap.get(item.id)?.status,
  }));
  const nextHeroId = pickHeroId(candidates, heroId, pinnedId);

  // Analyses seen while still unfinished: their completion is worth a moment on screen
  const seenActiveRef = useRef(new Set<string>());
  useEffect(() => {
    candidates.forEach((item) => {
      if (isActiveStatus(item.status)) seenActiveRef.current.add(item.id);
    });
  });

  /** Changes the analysis on top; the cards morph into each other where supported. */
  function showOnTop(id: string) {
    if (!heroId || reducedMotion || typeof document.startViewTransition !== 'function') {
      setHeroId(id);
      return;
    }
    const transition = document.startViewTransition(() =>
      flushSync(() => {
        setLeavingId(heroId);
        setHeroId(id);
      }),
    );
    void transition.finished.finally(() => setLeavingId(null));
  }

  const heroJustFinished =
    !!heroId && seenActiveRef.current.has(heroId) && isFinishedStatus(statusOf(heroId));

  // Depends only on what changes the decision, so status polling does not restart the wait
  useEffect(() => {
    if (!nextHeroId || nextHeroId === heroId) return;
    const timer = window.setTimeout(
      () => showOnTop(nextHeroId),
      heroJustFinished ? FINISHED_HOLD_MS : 0,
    );
    return () => window.clearTimeout(timer);
  }, [nextHeroId, heroId, heroJustFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  // The analysis on top lives in the URL so the breadcrumb can show its file name
  useEffect(() => {
    if (!heroId || heroId === selectedParam) return;
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('selected', heroId);
        return next;
      },
      { replace: true },
    );
  }, [heroId, selectedParam, setSearchParams]);

  function selectFromQueue(id: string) {
    setPinnedId(id);
    showOnTop(id);
  }

  // A single analysis opens its results once it completes, as before
  const onlyAnalysis = knownIds.length === 1 ? knownIds[0] : null;
  const openingResults =
    !!onlyAnalysis &&
    onlyAnalysis === heroId &&
    isCompletedStatus(statusOf(onlyAnalysis)) &&
    seenActiveRef.current.has(onlyAnalysis);

  useEffect(() => {
    if (!openingResults || !onlyAnalysis) return;
    const timer = window.setTimeout(
      () => navigate(`/analysis/${onlyAnalysis}`, { replace: true }),
      FINISHED_HOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, [openingResults, onlyAnalysis, navigate]);

  function getFileName(documentId: string | undefined) {
    return documentId
      ? (documentMap.get(documentId)?.original_filename ?? 'Document name unavailable')
      : 'Document name unavailable';
  }

  function getQueuePosition(id: string, data: unknown): number | null {
    const fromList = listMap.get(id)?.queue_position;
    const fromDetail = (data as { queue_position?: number | null } | undefined)?.queue_position;
    return fromList ?? fromDetail ?? null;
  }

  useEffect(() => {
    if (ids.length === 0) {
      navigate('/document-analysis', { replace: true });
    }
  }, [ids.length, navigate]);

  useEffect(() => {
    if (!allFinished) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['dashboard-analyses'] });
    void queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    void queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
    void queryClient.invalidateQueries({ queryKey: ['documents-last-7-days'] });
    void queryClient.invalidateQueries({ queryKey: ['user-documents'] });
  }, [allFinished, queryClient]);

  function handleCancel(analysisId: string) {
    if (!window.confirm('Are you sure you want to cancel this analysis?')) {
      return;
    }

    setCancelError(null);
    cancelMutation.mutate(analysisId, {
      onError: (error) => setCancelError(error.message),
    });
  }

  if (ids.length === 0) {
    return null;
  }

  const hero = items.find((item) => item.id === heroId) ?? null;
  const others = items.filter((item) => item.id !== heroId);
  const upNext = others.filter((item) => !isFinishedStatus(statusOf(item.id)));
  const finished = others.filter((item) => isFinishedStatus(statusOf(item.id)));

  const renderCards = (list: typeof items) => (
    <ul className="space-y-2">
      {list.map((item) => (
        <QueueCard
          key={item.id}
          analysis={item.data}
          analysisId={item.id}
          fileName={getFileName(item.data?.document_id)}
          queuePosition={getQueuePosition(item.id, item.data)}
          onSelect={() => selectFromQueue(item.id)}
          transitionName={item.id === leavingId ? 'none' : transitionName(item.id)}
        />
      ))}
    </ul>
  );

  return (
    <div className="flex w-full items-start justify-center px-3 pt-8 pb-10 sm:px-4 sm:pt-14">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-2xl font-bold sm:text-3xl lg:text-4xl">Legal Analysis</h1>

        {warning && (
          <div
            role="alert"
            className="mt-5 whitespace-pre-line break-words rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {warning}
          </div>
        )}

        {cancelError && (
          <div
            role="alert"
            className="mt-5 break-words rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700"
          >
            {cancelError}
          </div>
        )}

        {hasQueryErrors && (
          <div role="alert" className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              Some processing statuses could not be refreshed. This does not necessarily mean the
              analyses failed.
            </p>

            <Button
              type="button"
              variant="outline"
              disabled={isFetching}
              onClick={() => void refetchAll()}
              className="mt-3 h-10 rounded-lg border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50"
            >
              {isFetching ? 'Refreshing...' : 'Refresh statuses'}
            </Button>
          </div>
        )}

        {hero && (
          <div className="mt-6 sm:mt-10">
            <ProcessingHero
              analysis={hero.data}
              analysisId={hero.id}
              fileName={getFileName(hero.data?.document_id)}
              queuePosition={getQueuePosition(hero.id, hero.data)}
              statusError={hero.isError}
              openingResults={openingResults}
              cancelling={cancelMutation.isPending && cancelMutation.variables === hero.id}
              onCancel={
                hero.data && isCancellableStatus(hero.data.status)
                  ? () => handleCancel(hero.id)
                  : null
              }
              onViewResults={() => navigate(`/analysis/${hero.id}`)}
              onTryAgain={() => navigate('/document-analysis')}
              transitionName={transitionName(hero.id)}
            />
          </div>
        )}

        {upNext.length > 0 && (
          <section
            aria-labelledby="processing-up-next"
            className="mt-10"
            style={{ viewTransitionName: 'processing-up-next' }}
          >
            <h2
              id="processing-up-next"
              className="mb-2 flex items-center justify-between text-xs font-semibold tracking-wide text-gray-500 uppercase"
            >
              Up next
              <span className="font-medium normal-case">
                {upNext.filter((item) => isQueuedStatus(statusOf(item.id))).length} in queue
              </span>
            </h2>
            {renderCards(upNext)}
          </section>
        )}

        {finished.length > 0 && (
          <section
            aria-labelledby="processing-finished"
            className="mt-8"
            style={{ viewTransitionName: 'processing-finished' }}
          >
            <h2
              id="processing-finished"
              className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase"
            >
              Finished
            </h2>
            {renderCards(finished)}
          </section>
        )}

        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="h-10 rounded-lg border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50"
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
