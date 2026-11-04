import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/auth/useMe';
import { fetchDocuments } from '@/api/documents-wrapper';
import type { DocumentResponse } from '@/api/generated/model';
import { formatDate } from '@/lib/formatters';
import {
  getAnalysisStatusConfig,
  isCompletedStatus,
  isFinishedStatus,
  processingUrl,
} from '@/lib/analysisStatus';
import { fetchDashboardAnalyses, type DashboardAnalysis } from '@/api/documentApi/documentApi';

const MAX_ANALYSES_FOR_STATS = 50;
const MAX_ANALYSES_IN_LIST = 10;

function isViewDisabled(status: string): boolean {
  return status === 'cancelled' || status === 'cancelling';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user } = useMe();

  const [isLastAnalysisRefreshing, setIsLastAnalysisRefreshing] = useState(false);

  const userName = user?.full_name?.trim() || user?.email || '';

  const {
    data: allAnalysesRaw,
    isLoading: isRedactionsLoading,
    isError: isAnalysesError,
    refetch: refetchAnalyses,
  } = useQuery<DashboardAnalysis[]>({
    queryKey: ['dashboard-analyses'],
    queryFn: () => fetchDashboardAnalyses(MAX_ANALYSES_FOR_STATS),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const analyses = query.state.data;

      if (!Array.isArray(analyses)) {
        return false;
      }

      const hasUnfinishedProcessing = analyses.some(
        (analysis) => !isFinishedStatus(analysis.status),
      );

      return hasUnfinishedProcessing ? 3000 : false;
    },
  });

  const {
    data: allDocumentsRaw,
    isLoading: isDocumentsLoading,
    isError: isDocumentsError,
    refetch: refetchDocuments,
  } = useQuery<DocumentResponse[]>({
    queryKey: ['user-documents-all'],
    queryFn: async () => {
      let page = 1;
      const items: DocumentResponse[] = [];

      while (true) {
        const response = await fetchDocuments(page, 100);

        items.push(...response.items);

        if (page >= response.pages) {
          break;
        }

        page += 1;
      }

      return items;
    },
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const allAnalyses: DashboardAnalysis[] = Array.isArray(allAnalysesRaw) ? allAnalysesRaw : [];

  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentResponse>();

    if (Array.isArray(allDocumentsRaw)) {
      allDocumentsRaw.forEach((document) => {
        map.set(document.id, document);
      });
    }

    return map;
  }, [allDocumentsRaw]);

  const analyses = allAnalyses.slice(0, MAX_ANALYSES_IN_LIST);

  const completedProcessing = allAnalyses.filter((analysis) => isCompletedStatus(analysis.status));

  const documentsRequiringAttention = completedProcessing.filter(
    (analysis) =>
      analysis.irregularities_count &&
      (analysis.irregularities_count.critical ||
        analysis.irregularities_count.high ||
        analysis.irregularities_count.medium),
  ).length;

  const irregularitiesDetected = completedProcessing.reduce((sum, analysis) => {
    if (!analysis.irregularities_count) {
      return sum;
    }

    return (
      sum +
      (analysis.irregularities_count.critical || 0) +
      (analysis.irregularities_count.high || 0) +
      (analysis.irregularities_count.medium || 0)
    );
  }, 0);

  const totalAnalyses = allAnalyses.length;
  const completedAnalyses = completedProcessing.length;

  async function handleRefreshLastAnalysis() {
    if (isLastAnalysisRefreshing) {
      return;
    }

    setIsLastAnalysisRefreshing(true);

    try {
      await Promise.all([refetchAnalyses(), refetchDocuments()]);
    } finally {
      setIsLastAnalysisRefreshing(false);
    }
  }

  function handleOpenAnalysis(analysis: DashboardAnalysis) {
    if (isViewDisabled(analysis.status)) {
      return;
    }

    if (isCompletedStatus(analysis.status)) {
      navigate(`/analysis/${analysis.id}`);
      return;
    }

    navigate(processingUrl([analysis.id]));
  }

  const lastAnalysisLoading = isRedactionsLoading || isDocumentsLoading || isLastAnalysisRefreshing;

  return (
    <div className="w-full max-w-full px-1 sm:px-2 lg:px-4">
      <div className="mx-auto flex w-full max-w-400 flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-full overflow-hidden sm:max-w-[70%]">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-[#111111] sm:text-[32px]">
                Hi, {userName}
              </h1>
            </div>

            <Button
              onClick={() => navigate('/document-analysis')}
              className="h-10 w-full rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A] sm:w-auto sm:min-w-[190px]"
            >
              New Document Analysis
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-12 lg:grid-cols-[1.22fr_1fr]">
          <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm sm:p-4 lg:flex lg:h-full lg:flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#111111] sm:text-lg">Last analysis</h2>

              <button
                type="button"
                onClick={() => void handleRefreshLastAnalysis()}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-[#111827] hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh last analyses"
                disabled={lastAnalysisLoading}
              >
                <span
                  aria-hidden
                  className={`inline-block text-sm font-bold ${
                    isLastAnalysisRefreshing ? 'animate-spin' : ''
                  }`}
                >
                  ⟳
                </span>
              </button>
            </div>

            {isAnalysesError && (
              <p role="alert" className="mt-3 text-xs text-red-700 sm:text-sm">
                Could not refresh analyses. Please try again.
              </p>
            )}

            {isDocumentsError && (
              <p role="alert" className="mt-3 text-xs text-amber-800 sm:text-sm">
                Could not load document names. Refresh the list to try again.
              </p>
            )}

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              {lastAnalysisLoading ? (
                <p role="status" className="text-xs text-[#737373] sm:text-sm">
                  Loading...
                </p>
              ) : analyses.length === 0 ? (
                !isAnalysesError && (
                  <p className="text-xs text-[#737373] sm:text-sm">No analysis yet.</p>
                )
              ) : (
                <div className="space-y-2">
                  {analyses.map((analysis) => {
                    const cfg = getAnalysisStatusConfig(analysis.status);
                    const document = documentMap.get(analysis.document_id);

                    const shortId = analysis.id.slice(0, 8);
                    const fileName = document?.original_filename || 'Document name unavailable';
                    const title = `${fileName} (ID: ${shortId})`;

                    const viewDisabled = isViewDisabled(analysis.status);
                    const completed = isCompletedStatus(analysis.status);

                    const viewTitle =
                      analysis.status === 'cancelled'
                        ? 'Processing was cancelled. Results are unavailable.'
                        : analysis.status === 'cancelling'
                          ? 'Processing is being cancelled.'
                          : completed
                            ? 'View results'
                            : 'View processing';

                    return (
                      <div
                        key={analysis.id}
                        className={`flex w-full min-w-0 items-center gap-3 rounded-md px-2 py-1.5 ${
                          viewDisabled ? 'bg-gray-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            title={`${fileName} (ID: ${analysis.id})`}
                            className={`truncate text-xs font-medium leading-tight sm:text-sm ${
                              viewDisabled ? 'text-gray-500' : 'text-[#111827]'
                            }`}
                          >
                            {title}
                          </p>

                          <p
                            className={`mt-1 text-[10px] font-semibold leading-tight sm:text-xs ${cfg.color}`}
                          >
                            {cfg.label}
                            <span className="text-gray-500">
                              {' '}
                              • {formatDate(analysis.created_at)}
                            </span>
                          </p>
                        </div>

                        {completed && analysis.irregularities_count && (
                          <div className="flex shrink-0 gap-1">
                            {analysis.irregularities_count.critical ? (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 sm:text-xs">
                                {analysis.irregularities_count.critical}
                              </span>
                            ) : null}

                            {analysis.irregularities_count.high ? (
                              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800 sm:text-xs">
                                {analysis.irregularities_count.high}
                              </span>
                            ) : null}

                            {analysis.irregularities_count.medium ? (
                              <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800 sm:text-xs">
                                {analysis.irregularities_count.medium}
                              </span>
                            ) : null}
                          </div>
                        )}

                        <span
                          title={viewTitle}
                          className={`shrink-0 ${viewDisabled ? 'cursor-not-allowed' : ''}`}
                        >
                          <Button
                            type="button"
                            size="sm"
                            disabled={viewDisabled}
                            onClick={() => handleOpenAnalysis(analysis)}
                            aria-label={`${viewTitle}: ${title}`}
                            className="h-9 min-h-[36px] rounded-lg bg-[#171717] px-3 text-xs font-medium text-white enabled:hover:bg-[#2A2A2A] disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100"
                          >
                            View
                          </Button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <div className="flex min-w-0 flex-col gap-4">
            <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold leading-tight text-[#111111]">
                Documents requiring attention
              </h2>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-4xl font-semibold tracking-tight text-black tabular-nums">
                  {documentsRequiringAttention}
                </span>

                <Button
                  onClick={() => navigate('/history')}
                  className="h-10 rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A]"
                >
                  Check your analysis history
                </Button>
              </div>
            </section>

            <section className="min-w-0 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold text-[#111111]">Analysis Statistics</h2>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  {
                    label: 'Total analyses',
                    value: totalAnalyses,
                  },
                  {
                    label: 'Irregularities detected',
                    value: irregularitiesDetected,
                  },
                  {
                    label: 'Completed',
                    value: completedAnalyses,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="min-w-0 rounded-xl bg-[#F9FAFB] px-4 py-3">
                    <p className="wrap-break-word text-xs font-semibold leading-4 text-[#6B7280]">
                      {stat.label}
                    </p>

                    <p className="mt-2 wrap-break-word text-lg font-bold text-[#111827] tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
