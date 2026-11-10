import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchAllDocuments, getDocumentTypeLabel } from '@/api/documents-wrapper';
import { fetchDashboardAnalyses, type DashboardAnalysis } from '@/api/documentApi/documentApi';
import type { DocumentResponse } from '@/api/generated/model';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAnalysisTracking } from '@/hooks/analysis/useAnalysisTracking';
import { useCancelAnalysis } from '@/hooks/analysis/useCancelAnalysis';
import {
  getAnalysisStatusConfig,
  getProgressPercent,
  getStageLabel,
  getStatusLabel,
  isCancellableStatus,
  isCancelledStatus,
  isCompletedStatus,
  isFailedStatus,
  isFinishedStatus,
  isQueuedStatus,
  parseProcessingIds,
} from '@/lib/analysisStatus';

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

  const activeId =
    selectedParam && knownIds.includes(selectedParam) ? selectedParam : (ids[0] ?? null);
  const selectedItem = items.find((item) => item.id === activeId) ?? null;

  // The selected analysis lives in the URL so the breadcrumb can show its file name
  function selectItem(id: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('selected', id);
        return next;
      },
      { replace: true },
    );
  }

  function getTitle(documentId: string | undefined, analysisId: string) {
    const fileName = documentId
      ? (documentMap.get(documentId)?.original_filename ?? 'Document name unavailable')
      : 'Document name unavailable';
    return { fileName, shortId: analysisId.slice(0, 8) };
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

  const analysis = selectedItem?.data;
  const failed = isFailedStatus(analysis?.status);
  const completed = isCompletedStatus(analysis?.status);
  const queued = isQueuedStatus(analysis?.status);
  const cancelled = isCancelledStatus(analysis?.status);
  const cancellable = !!analysis && isCancellableStatus(analysis.status);
  const isCancelling =
    !!selectedItem && cancelMutation.isPending && cancelMutation.variables === selectedItem.id;
  const percent = getProgressPercent(analysis);

  const stageLabel = getStatusLabel(analysis?.status, analysis?.processing_stage);
  const failedStageLabel = getStageLabel(analysis?.processing_stage);
  const detectedType = analysis?.detected_document_type;
  const confidence = analysis?.classification_confidence;
  const showDetectedType = !!detectedType && detectedType !== 'unknown';

  // A failed analysis (anything interrupted by an error, except a manual cancel)
  // is shown on its own, without the queue list.
  const showQueueList = items.length > 1 && !failed;

  const selectedTitle = selectedItem
    ? getTitle(analysis?.document_id, selectedItem.id)
    : { fileName: '', shortId: '' };

  const cardStyle = failed
    ? 'border-red-300 bg-red-50'
    : completed
      ? 'border-lime-300 bg-white'
      : cancelled
        ? 'border-gray-300 bg-gray-50'
        : queued
          ? 'border-amber-300 bg-white'
          : 'border-[#dedede] bg-white';

  const currentStage = failed
    ? `Failed at: ${failedStageLabel}`
    : completed
      ? 'Completed'
      : !analysis && selectedItem?.isError
        ? 'Status unavailable'
        : !analysis
          ? 'Loading current status...'
          : stageLabel;

  const stageColor = failed
    ? 'text-red-800'
    : completed
      ? 'text-lime-700'
      : cancelled
        ? 'text-gray-600'
        : queued
          ? 'text-amber-700'
          : 'text-gray-900';

  return (
    <div className="flex w-full items-start justify-center px-3 pb-6 pt-8 sm:px-4 sm:pb-10 sm:pt-12">
      <section
        aria-labelledby="processing-title"
        className="w-full max-w-2xl rounded-2xl border border-[#e0dfdc] bg-[#f5f4f1] px-3 py-6 shadow-sm sm:px-8 sm:py-7"
      >
        <h1
          id="processing-title"
          className={`text-center text-2xl font-bold tracking-tight sm:text-3xl ${
            failed ? 'text-red-800' : 'text-[#171717]'
          }`}
        >
          {failed ? 'Processing failed' : 'Processing'}
        </h1>

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
              className="mt-3 min-h-10 bg-white"
            >
              {isFetching ? 'Refreshing...' : 'Refresh statuses'}
            </Button>
          </div>
        )}

        {selectedItem && (
          <article
            aria-label={`${selectedTitle.fileName} ID ${selectedTitle.shortId}`}
            className={`mt-6 rounded-2xl border px-4 py-4 sm:px-5 ${cardStyle}`}
          >
            <div className="mb-3 min-w-0">
              <h2
                title={`${selectedTitle.fileName} ID ${selectedItem.id}`}
                className="truncate text-sm font-semibold text-gray-900"
              >
                {selectedTitle.fileName}
              </h2>
              <p className="text-xs text-gray-500">ID {selectedTitle.shortId}</p>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Processing stage</p>
                <p className={`mt-1 break-words text-base font-semibold ${stageColor}`}>
                  {currentStage}
                </p>
              </div>

              {analysis && !queued && !cancelled && (
                <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                  {percent}%
                </span>
              )}
            </div>

            {selectedItem.isError && (
              <p className="mt-3 break-words text-sm text-amber-800">
                Could not retrieve the latest status.
                {analysis ? ' The last available status is shown.' : ''}
              </p>
            )}

            {failed ? (
              <div
                role="alert"
                className="mt-3 whitespace-pre-line break-words text-sm text-red-700 [overflow-wrap:anywhere]"
              >
                {analysis?.error_message || 'Unknown error occurred.'}
              </div>
            ) : cancelled ? (
              <p className="mt-3 text-sm text-gray-600">This analysis was cancelled.</p>
            ) : queued ? null : (
              <>
                {showDetectedType && (
                  <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm sm:px-4">
                    <span className="text-gray-500">Detected type: </span>
                    <span className="font-semibold text-gray-900">
                      {getDocumentTypeLabel(detectedType)}
                    </span>
                    {confidence != null && Number.isFinite(confidence) && (
                      <span className="ml-1 text-gray-500">({Math.round(confidence * 100)}%)</span>
                    )}
                  </div>
                )}

                {!showDetectedType && !completed && analysis && (
                  <p className="mt-3 text-sm text-gray-500">
                    Document type has not been detected yet.
                  </p>
                )}

                <Progress
                  value={percent}
                  aria-label={`${selectedTitle.fileName}: processing progress`}
                  className={`mt-3 h-2.5 bg-gray-200 ${
                    completed ? '[&>div]:bg-lime-600' : '[&>div]:bg-slate-950'
                  }`}
                />
              </>
            )}

            {cancellable && (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCancelling}
                  onClick={() => handleCancel(selectedItem.id)}
                  className="min-h-10 border-[#e7caca] bg-white text-[#a33636] hover:bg-[#fff3f3]"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel'}
                </Button>
              </div>
            )}

            {completed && (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => navigate(`/analysis/${selectedItem.id}`)}
                  className="min-h-10 bg-slate-950 text-white hover:bg-slate-800"
                >
                  See result
                </Button>
              </div>
            )}
          </article>
        )}

        {showQueueList && (
          <div
            role="list"
            aria-label="Analysis queue"
            className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1"
          >
            {items.map((item, index) => {
              const rowAnalysis = item.data;
              const { fileName, shortId } = getTitle(rowAnalysis?.document_id, item.id);
              const isSelected = item.id === activeId;
              const rowStatus = getAnalysisStatusConfig(rowAnalysis?.status);

              return (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  aria-current={isSelected}
                  onClick={() => selectItem(item.id)}
                  className={`flex w-full min-w-0 items-center gap-3 rounded-xl border-2 bg-white px-3 py-2 text-left transition-colors ${
                    isSelected ? 'border-black' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <span className="w-6 shrink-0 text-sm font-semibold text-gray-500 tabular-nums">
                    {index + 1}.
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      title={`${fileName} ID ${item.id}`}
                      className="truncate text-sm font-medium text-gray-900"
                    >
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500">ID {shortId}</p>
                  </div>

                  <span className={`shrink-0 text-xs font-semibold ${rowStatus.color}`}>
                    {rowStatus.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="min-h-11 bg-white"
          >
            Back to dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
