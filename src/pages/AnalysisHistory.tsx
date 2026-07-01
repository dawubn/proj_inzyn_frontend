import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getStatusConfig, getDocumentTypeLabel, fetchDocuments } from '@/api/documents-wrapper';
import { formatDate } from '@/lib/formatters';
import { fetchDashboardAnalyses, type DashboardAnalysis } from '@/api/documentApi/documentApi';
import type { DocumentResponse } from '@/api/generated/model';

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
    queryFn: () => fetchDashboardAnalyses(1000) as Promise<DashboardAnalysis[]>,
    staleTime: 60_000,
  });

  const { data: allDocumentsRaw, refetch: refetchDocuments } = useQuery<DocumentResponse[]>({
    queryKey: ['user-documents-all'],
    queryFn: async () => {
      let page = 1;
      const items: DocumentResponse[] = [];
      while (true) {
        const resp = await fetchDocuments(page, 100);
        items.push(...resp.items);
        if (page >= resp.pages) break;
        page++;
      }
      return items;
    },
    staleTime: 30_000,
  });

  const allAnalyses: DashboardAnalysis[] = useMemo(
    () =>
      isHardRefreshing || !Array.isArray(allAnalysesRaw)
        ? []
        : (allAnalysesRaw as DashboardAnalysis[]),
    [isHardRefreshing, allAnalysesRaw],
  );

  const allDocuments: DocumentResponse[] = useMemo(
    () =>
      isHardRefreshing || !Array.isArray(allDocumentsRaw)
        ? []
        : (allDocumentsRaw as DocumentResponse[]),
    [isHardRefreshing, allDocumentsRaw],
  );

  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentResponse>();
    allDocuments.forEach((doc) => map.set(doc.id, doc));
    return map;
  }, [allDocuments]);

  const filteredAnalyses = useMemo(() => {
    if (!search.trim()) {
      return allAnalyses;
    }

    const q = search.toLowerCase();

    return allAnalyses.filter((analysis) => {
      const doc = documentMap.get(analysis.document_id);
      const shortId = analysis.id.slice(0, 8);
      const baseName = doc?.original_filename ?? `Analysis ${shortId}`;
      const title = `${baseName} (ID: ${shortId})`;
      return title.toLowerCase().includes(q);
    });
  }, [allAnalyses, documentMap, search]);

  const renderStatusBadge = (label: string) => {
    const normalized = label.toLowerCase();

    if (normalized.includes('failed') || normalized.includes('error')) {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white">
          Requires attention
        </span>
      );
    }

    if (normalized.includes('completed')) {
      return (
        <span className="inline-flex items-center rounded-full bg-lime-600 px-2.5 py-1 text-xs font-semibold text-white">
          Completed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white">
        In progress
      </span>
    );
  };

  const handleRefresh = async () => {
    setIsHardRefreshing(true);
    await Promise.all([refetchAnalyses(), refetchDocuments()]);
    setIsHardRefreshing(false);
  };

  const showLoading = isLoading || isHardRefreshing;

  return (
    <div className="w-full max-w-full px-1 sm:px-2 lg:h-full lg:overflow-hidden lg:px-4">
      <div className="mx-auto flex w-full max-w-400 flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:h-full lg:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-4xl font-semibold leading-tight tracking-tight text-[#0A0A0A]">
            Analysis history
          </h1>
          <p className="text-sm text-[#6B7280]">Review of previously analyzed documents.</p>
        </div>

        <div className="mt-10 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] p-4 shadow-sm h-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-[#111827] whitespace-nowrap">
                All analyses
              </h2>

              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="flex w-[220px] sm:w-[280px] items-center rounded-full border border-[#E5E5E5] bg-white px-3 py-2">
                  <input
                    type="text"
                    className="w-full bg-transparent text-xs sm:text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none"
                    placeholder="Search by document name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-[#111827] hover:bg-[#F3F4F6]"
                  aria-label="Refresh list"
                  disabled={isHardRefreshing}
                >
                  <span
                    className={`text-sm font-bold ${isHardRefreshing ? 'animate-spin' : ''}`}
                    style={{ display: 'inline-block' }}
                  >
                    ⟳
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-2 max-h-[515px] overflow-y-auto rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="min-w-full">
                <div className="flex items-center bg-[#F9FAFB] px-3 sm:px-4 py-2 rounded-t-2xl">
                  <div className="flex-1 min-w-[150px]">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Document name</p>
                  </div>
                  <div className="w-40">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Analysis date</p>
                  </div>
                  <div className="w-40">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Document type</p>
                  </div>
                  <div className="w-40">
                    <p className="text-[11px] font-semibold text-[#6B7280]">Status</p>
                  </div>
                  <div className="w-28 text-right" />
                </div>

                <div className="divide-y divide-[#E5E7EB]">
                  {showLoading ? (
                    <div className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#737373]">
                      Loading...
                    </div>
                  ) : isError ? (
                    <div className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-red-600">
                      Failed to load analyses.
                    </div>
                  ) : filteredAnalyses.length === 0 ? (
                    <div className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#737373]">
                      No analyses match the current filters.
                    </div>
                  ) : (
                    filteredAnalyses.map((analysis) => {
                      const cfg = getStatusConfig(analysis.status);
                      const doc = documentMap.get(analysis.document_id);

                      const shortId = analysis.id.slice(0, 8);
                      const baseName = doc?.original_filename ?? `Analysis ${shortId}`;
                      const title = `${baseName} (ID: ${shortId})`;

                      const formattedDate = formatDate(analysis.created_at);

                      const docType = doc?.document_type;
                      const displayedDocType = getDocumentTypeLabel(
                        docType && docType !== 'unknown'
                          ? docType
                          : analysis.detected_document_type,
                      );

                      return (
                        <div
                          key={analysis.id}
                          className="flex items-center bg-[#F9FAFB] px-3 sm:px-4 py-2 hover:bg-gray-50"
                        >
                          <div className="flex-1 min-w-[150px]">
                            <p className="truncate text-xs sm:text-sm font-medium text-[#111827]">
                              {title}
                            </p>
                          </div>

                          <div className="w-40">
                            <p className="text-[11px] sm:text-xs text-[#374151]">{formattedDate}</p>
                          </div>

                          <div className="w-40">
                            <p className="text-[11px] sm:text-xs text-[#374151]">
                              {displayedDocType}
                            </p>
                          </div>

                          <div className="w-40">{renderStatusBadge(cfg.label)}</div>

                          <div className="w-28 flex justify-end">
                            <Button
                              size="sm"
                              className="h-9 min-h-[36px] px-4 rounded-lg bg-[#171717] text-xs sm:text-sm font-medium text-white hover:bg-[#2A2A2A]"
                              onClick={() => navigate(`/analysis/${analysis.id}`)}
                            >
                              View
                            </Button>
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
