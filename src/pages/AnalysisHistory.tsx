import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getDocumentTypeLabel, fetchDocuments } from '@/api/documents-wrapper';
import { formatDate } from '@/lib/formatters';
import {
  getAnalysisStatusConfig,
  isCompletedStatus,
  isFailedStatus,
  isFinishedStatus,
  processingUrl,
} from '@/lib/analysisStatus';
import { fetchDashboardAnalyses, type DashboardAnalysis } from '@/api/documentApi/documentApi';
import type { DocumentResponse } from '@/api/generated/model';

const MIN_REFRESH_SPIN_MS = 500;

function isViewDisabled(status: string): boolean {
  return status === 'cancelled' || status === 'cancelling';
}

function renderStatusBadge(status: string) {
  const config = getAnalysisStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function AnalysisHistory() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [isHardRefreshing, setIsHardRefreshing] = useState(false);

  const {
    data: allAnalysesRaw,
    isLoading,
    isError,
    refetch: refetchAnalyses,
  } = useQuery<DashboardAnalysis[]>({
    queryKey: ['analysis-history'],
    queryFn: () => fetchDashboardAnalyses(1000),
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
  });

  const allAnalyses: DashboardAnalysis[] = useMemo(
    () => (Array.isArray(allAnalysesRaw) ? allAnalysesRaw : []),
    [allAnalysesRaw],
  );

  const allDocuments: DocumentResponse[] = useMemo(
    () => (Array.isArray(allDocumentsRaw) ? allDocumentsRaw : []),
    [allDocumentsRaw],
  );

  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentResponse>();

    allDocuments.forEach((document) => {
      map.set(document.id, document);
    });

    return map;
  }, [allDocuments]);

  const filteredAnalyses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return allAnalyses;
    }

    return allAnalyses.filter((analysis) => {
      const document = documentMap.get(analysis.document_id);
      const shortId = analysis.id.slice(0, 8);
      const baseName = document?.original_filename ?? `Analysis ${shortId}`;
      const statusLabel = getAnalysisStatusConfig(analysis.status).label;

      const searchableText = [
        baseName,
        analysis.id,
        analysis.document_id,
        analysis.status,
        statusLabel,
      ].join(' ');

      return searchableText.toLowerCase().includes(query);
    });
  }, [allAnalyses, documentMap, search]);

  async function handleRefresh() {
    if (isHardRefreshing) {
      return;
    }

    setIsHardRefreshing(true);

    try {
      await Promise.all([
        refetchAnalyses(),
        refetchDocuments(),
        new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_SPIN_MS)),
      ]);
    } finally {
      setIsHardRefreshing(false);
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

  const showLoading = isLoading || isHardRefreshing;

  return (
    <div className="w-full max-w-full sm:px-2 lg:h-full lg:overflow-hidden lg:px-4">
      <div className="mx-auto flex w-full max-w-400 flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:h-full lg:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[#0A0A0A] sm:text-4xl">
            Analysis history
          </h1>

          <p className="text-sm text-[#6B7280]">Review of previously analyzed documents.</p>
        </div>

        <div className="mt-6 h-auto rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm sm:mt-10 sm:p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h2 className="whitespace-nowrap text-sm font-semibold text-[#111827]">
                All analyses
              </h2>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <div className="flex w-full min-w-0 items-center rounded-full border border-[#E5E5E5] bg-white px-3 py-2 sm:w-[280px]">
                  <input
                    type="text"
                    aria-label="Search analyses by document name, ID or status"
                    className="w-full bg-transparent text-xs text-[#111827] placeholder:text-[#6B7280] focus:outline-none sm:text-sm"
                    placeholder="Search by document name or ID..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-[#111827] enabled:hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Refresh list"
                  title="Refresh"
                  disabled={showLoading}
                >
                  <RefreshCw
                    aria-hidden
                    className={`h-4 w-4 ${isHardRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {isDocumentsError && (
              <p role="alert" className="text-xs text-amber-800 sm:text-sm">
                Could not load document details. Some document names or types may be unavailable.
              </p>
            )}

            <div className="mt-2 max-h-[515px] overflow-auto rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="min-w-[860px]">
                <div className="flex items-center rounded-t-2xl bg-[#F9FAFB] px-3 py-2 sm:px-4">
                  <div className="min-w-[150px] flex-1">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Document name</p>
                  </div>

                  <div className="w-40 shrink-0">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Analysis date</p>
                  </div>

                  <div className="w-40 shrink-0">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Document type</p>
                  </div>

                  <div className="w-48 shrink-0">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Status</p>
                  </div>

                  <div className="w-28 shrink-0 text-right" />
                </div>

                <div className="divide-y divide-[#E5E7EB]">
                  {isLoading ? (
                    <div
                      role="status"
                      className="px-3 py-3 text-xs text-[#737373] sm:px-4 sm:text-sm"
                    >
                      Loading...
                    </div>
                  ) : isError ? (
                    <div role="alert" className="px-3 py-3 text-xs text-red-600 sm:px-4 sm:text-sm">
                      Failed to load analyses. Refresh the list to try again.
                    </div>
                  ) : filteredAnalyses.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-[#737373] sm:px-4 sm:text-sm">
                      {search.trim()
                        ? 'No analyses match the current filters.'
                        : 'No analyses yet.'}
                    </div>
                  ) : (
                    filteredAnalyses.map((analysis) => {
                      const document = documentMap.get(analysis.document_id);
                      const statusConfig = getAnalysisStatusConfig(analysis.status);

                      const shortId = analysis.id.slice(0, 8);
                      const baseName = document?.original_filename ?? `Analysis ${shortId}`;
                      const title = `${baseName} (ID: ${shortId})`;

                      const documentType = document?.document_type;
                      const effectiveType =
                        documentType && documentType !== 'unknown'
                          ? documentType
                          : analysis.detected_document_type;

                      const cancelled = analysis.status === 'cancelled';
                      const cancelling = analysis.status === 'cancelling';
                      const completed = isCompletedStatus(analysis.status);
                      const viewDisabled = isViewDisabled(analysis.status);

                      const displayedDocumentType =
                        effectiveType && effectiveType !== 'unknown'
                          ? getDocumentTypeLabel(effectiveType)
                          : cancelled || isFailedStatus(analysis.status)
                            ? 'Not detected'
                            : 'Not detected yet';

                      const viewTitle = cancelled
                        ? 'Processing was cancelled. Results are unavailable.'
                        : cancelling
                          ? 'Processing is being cancelled.'
                          : completed
                            ? 'View results'
                            : 'View processing';

                      return (
                        <div
                          key={analysis.id}
                          className="flex items-center bg-[#F9FAFB] px-3 py-2 hover:bg-gray-50 sm:px-4"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p
                              title={title}
                              className="truncate text-xs font-medium text-[#111827] sm:text-sm"
                            >
                              {title}
                            </p>
                          </div>

                          <div className="w-40 shrink-0">
                            <p className="text-[11px] text-[#374151] sm:text-xs">
                              {formatDate(analysis.created_at)}
                            </p>
                          </div>

                          <div className="w-40 shrink-0 pr-3">
                            <p
                              title={displayedDocumentType}
                              className="truncate text-[11px] text-[#374151] sm:text-xs"
                            >
                              {displayedDocumentType}
                            </p>
                          </div>

                          <div className="w-48 shrink-0 pr-2" title={statusConfig.label}>
                            {renderStatusBadge(analysis.status)}
                          </div>

                          <div className="flex w-28 shrink-0 justify-end">
                            <span
                              title={viewTitle}
                              className={viewDisabled ? 'cursor-not-allowed' : ''}
                            >
                              <Button
                                type="button"
                                size="sm"
                                disabled={viewDisabled}
                                className="h-9 min-h-[36px] rounded-lg bg-[#171717] px-4 text-xs font-medium text-white enabled:hover:bg-[#2A2A2A] disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 sm:text-sm"
                                onClick={() => handleOpenAnalysis(analysis)}
                                aria-label={`${viewTitle}: ${title}`}
                              >
                                View
                              </Button>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}