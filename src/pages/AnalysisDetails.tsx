import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Trash2, FileText, Copy, CloudAlert, Brain, Download, ListChecks } from 'lucide-react';
import type {
  AnalysisReportResponse,
  DocumentAnalysisResponse,
  DocumentResponse,
} from '@/api/generated/model';
import { useGetReportApiV1ReportsAnalysisIdGet } from '@/api/generated/reports/reports';
import {
  deleteRedactionApiV1RedactionsAnalysisIdDelete,
  useGetRedactionApiV1RedactionsAnalysisIdGet,
} from '@/api/generated/redactions/redactions';
import {
  getDocumentTypeLabel,
  patchDocumentType,
  confirmDocumentType,
  triggerLegalAnalysis,
  fetchPagesManifest,
  getDocumentDownloadUrl,
  type PreviewVariant,
} from '@/api/documents-wrapper';
import { DocumentViewer } from '@/features/document-viewer/DocumentViewer';
import { IssueDetails } from '@/features/document-viewer/IssueDetails';
import { IssueList } from '@/features/document-viewer/IssueList';
import type { LegalIssue } from '@/features/document-viewer/types';
import { aiToViewerIssue, formalToViewerIssue } from '@/features/document-viewer/toViewerIssue';
import {
  useMediaQuery,
  DESKTOP_QUERY,
  HOVER_QUERY,
  REDUCED_MOTION_QUERY,
} from '@/hooks/useMediaQuery';

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
      <Brain size={13} strokeWidth={2} />
      Artificial Intelligence
    </span>
  );
}

export default function AnalysisDetails() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null);
  const [selectedErrorIndex, setSelectedErrorIndex] = useState<number | null>(null);
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [bubbleError, setBubbleError] = useState<string | null>(null);
  const [requestedVariant, setRequestedVariant] = useState<PreviewVariant>('redacted');
  const [isIssueSheetOpen, setIsIssueSheetOpen] = useState(false);

  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const canHover = useMediaQuery(HOVER_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const { data: analysisData, isLoading } = useGetRedactionApiV1RedactionsAnalysisIdGet(
    analysisId || '',
    {
      query: {
        enabled: !!analysisId,
      },
      fetch: {
        credentials: 'include',
      },
    },
  );
  const { data: reportData, isLoading: isReportLoading } = useGetReportApiV1ReportsAnalysisIdGet(
    analysisId || '',
    {
      query: {
        enabled: !!analysisId,
      },
      fetch: {
        credentials: 'include',
      },
    },
  );

  const analysis = analysisData?.data as DocumentAnalysisResponse | undefined;
  const formalReport =
    reportData?.status === 200 ? (reportData.data as AnalysisReportResponse) : undefined;
  const formalIssues = useMemo(
    () => [...(formalReport?.errors || []), ...(formalReport?.warnings || [])],
    [formalReport],
  );

  const [docInfo, setDocInfo] = useState<DocumentResponse | null>(null);

  useEffect(() => {
    if (!analysis?.document_id) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/v1/documents/${analysis.document_id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDocInfo(data);
      })
      .catch(() => { });
  }, [analysis?.document_id]);

  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  const documentType = docInfo?.document_type ?? 'unknown';
  const suggestedType =
    docInfo?.suggested_document_type ?? analysis?.detected_document_type ?? null;
  const confidence = analysis?.classification_confidence ?? null;

  const userSelectedType = documentType !== 'unknown';
  const effectiveType = userSelectedType ? documentType : (suggestedType ?? null);

  const showBubble =
    !bubbleDismissed &&
    userSelectedType &&
    !!suggestedType &&
    documentType !== suggestedType &&
    suggestedType !== 'unknown' &&
    suggestedType !== 'other' &&
    (confidence == null || confidence >= 0.45);

  const handleRunWithDetectedType = async () => {
    if (!analysis?.document_id || !suggestedType) return;
    setBubbleError(null);
    setIsRerunning(true);
    try {
      const updated = await patchDocumentType(analysis.document_id, suggestedType);
      setDocInfo(updated);
      const result = await triggerLegalAnalysis(analysis.document_id);
      navigate(`/document-analysis?resume=${result.analysis_id}`);
    } catch {
      setBubbleError('Failed to start re-analysis. Please try again.');
      setIsRerunning(false);
    }
  };

  const handleKeepMyType = async () => {
    if (!analysis?.document_id || !documentType) return;
    setBubbleDismissed(true);
    try {
      const updated = await confirmDocumentType(analysis.document_id, documentType);
      setDocInfo(updated);
    } catch {
      // dismiss locally even if backend call fails
    }
  };

  const errors = useMemo(
    () =>
      ((analysis?.legal_analysis_result as { errors?: LegalIssue[] } | null | undefined)?.errors ??
        []) as LegalIssue[],
    [analysis?.legal_analysis_result],
  );

  // AI issues first, then formal issues: one index space shared by the lists and the viewer
  const viewerIssues = useMemo(
    () => [...errors.map(aiToViewerIssue), ...formalIssues.map(formalToViewerIssue)],
    [errors, formalIssues],
  );

  const formalItems = useMemo(
    () =>
      formalIssues.map((_, i) => ({
        issue: viewerIssues[errors.length + i],
        index: errors.length + i,
      })),
    [formalIssues, viewerIssues, errors.length],
  );

  const availableSeverities = useMemo(() => {
    const severities = new Set(errors.map((e) => e.severity));
    return ['all', ...Array.from(severities).sort()];
  }, [errors]);

  const filteredItems = useMemo(
    () =>
      viewerIssues
        .slice(0, errors.length)
        .map((issue, index) => ({ issue, index }))
        .filter(({ issue }) => {
          const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
          const matchesSearch = issue.issue.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSeverity && matchesSearch;
        }),
    [viewerIssues, errors.length, filterSeverity, searchTerm],
  );

  const { data: pagesManifest, error: pagesError } = useQuery({
    queryKey: ['pagesManifest', analysisId, analysis?.status],
    queryFn: () => fetchPagesManifest(analysisId!),
    enabled: !!analysisId && !!analysis,
    staleTime: Infinity,
  });

  const variants = pagesManifest?.variants ?? [];
  const variant: PreviewVariant = variants.includes(requestedVariant)
    ? requestedVariant
    : (variants[0] ?? requestedVariant);

  // Esc closes the mobile issue card too (the desktop popover handles Esc itself)
  useEffect(() => {
    if (selectedErrorIndex == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedErrorIndex(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedErrorIndex]);

  const selectedIssue = selectedErrorIndex != null ? viewerIssues[selectedErrorIndex] : null;
  // Previous/Next stay within the list the selected issue belongs to
  const navigationItems = selectedIssue?.source === 'formal' ? formalItems : filteredItems;
  const selectedPosition = navigationItems.findIndex((item) => item.index === selectedErrorIndex);

  const selectRelative = (offset: number) => {
    if (navigationItems.length === 0) return;
    const current = selectedPosition === -1 ? 0 : selectedPosition;
    const next = (current + offset + navigationItems.length) % navigationItems.length;
    setSelectedErrorIndex(navigationItems[next].index);
  };

  const selectedIssueDetails = selectedIssue && (
    <IssueDetails
      issue={selectedIssue}
      position={selectedPosition + 1}
      total={navigationItems.length}
      onPrevious={() => selectRelative(-1)}
      onNext={() => selectRelative(1)}
      onClose={() => setSelectedErrorIndex(null)}
    />
  );

  const issueListProps = {
    hoveredIndex: hoveredErrorIndex,
    selectedIndex: selectedErrorIndex,
    canHover,
    reducedMotion,
    onHover: setHoveredErrorIndex,
    onSelect: (index: number | null) => {
      setSelectedErrorIndex(index);
      if (index != null) setIsIssueSheetOpen(false);
    },
  };
  const issueList = <IssueList items={filteredItems} {...issueListProps} />;
  const formalIssueList = <IssueList items={formalItems} {...issueListProps} />;

  const issueFilters = (
    <>
      <Input
        placeholder="Search alert"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 border-gray-300"
      />

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {availableSeverities.map((severity) => (
          <button
            key={severity}
            onClick={() => setFilterSeverity(severity)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${filterSeverity === severity
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </button>
        ))}
      </div>
    </>
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading analysis...</div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-0 py-3 shrink-0 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Document Analysis</h1>
            <p className="text-sm text-gray-600 mt-1">{getDocumentTypeLabel(effectiveType)}</p>

            {showBubble && !showRerunConfirm && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm">
                <CloudAlert size={15} className="text-blue-500 shrink-0" />
                <span className="text-blue-700">
                  Suggested type: <strong>{getDocumentTypeLabel(suggestedType)}</strong>
                  {confidence != null && (
                    <span className="text-blue-500 ml-1">({Math.round(confidence * 100)}%)</span>
                  )}
                </span>
                <button
                  onClick={() => setShowRerunConfirm(true)}
                  className="ml-1 rounded px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                >
                  Use detected
                </button>
                <button
                  onClick={handleKeepMyType}
                  className="rounded px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  Keep my type
                </button>
              </div>
            )}

            {showBubble && showRerunConfirm && (
              <div className="mt-2 inline-flex flex-col gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <CloudAlert size={15} className="text-blue-500 shrink-0" />
                  <span className="text-blue-700">
                    Re-run analysis as <strong>{getDocumentTypeLabel(suggestedType)}</strong>?
                  </span>
                  <button
                    onClick={handleRunWithDetectedType}
                    disabled={isRerunning}
                    className="ml-1 rounded px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isRerunning ? 'Starting...' : 'Run analysis'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRerunConfirm(false);
                      setBubbleError(null);
                    }}
                    disabled={isRerunning}
                    className="rounded px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {bubbleError && <p className="text-xs text-red-600 pl-5">{bubbleError}</p>}
              </div>
            )}

            {analysis && (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <div className="text-gray-600">
                  Created:{' '}
                  <span className="font-medium text-gray-900">
                    {new Date(analysis.created_at).toLocaleString('pl-PL')}
                  </span>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-gray-600">Document ID:</span>
                  <button
                    onClick={() => copyToClipboard(analysis.document_id)}
                    className="text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1.5 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
                    title="Click to copy"
                  >
                    <span className="font-mono text-xs text-gray-900">{analysis.document_id}</span>
                    <Copy size={14} className="shrink-0" />
                  </button>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-gray-600">Analysis ID:</span>
                  <button
                    onClick={() => copyToClipboard(analysis.id)}
                    className="text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1.5 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
                    title="Click to copy"
                  >
                    <span className="font-mono text-xs text-gray-900">{analysis.id}</span>
                    <Copy size={14} className="shrink-0" />
                  </button>
                </div>
                <div
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${analysis.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : analysis.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : analysis.status === 'ocr_failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {analysis.status.charAt(0).toUpperCase() +
                    analysis.status.slice(1).replace(/_/g, ' ')}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              disabled={isDeleting}
              onClick={async () => {
                if (!analysisId) return;
                if (!confirm('Are you sure you want to delete this analysis?')) return;

                try {
                  setIsDeleting(true);
                  await deleteRedactionApiV1RedactionsAnalysisIdDelete(analysisId, {
                    credentials: 'include',
                  });
                  await queryClient.invalidateQueries({ queryKey: ['recentAnalysis'] });
                  navigate('/dashboard');
                } catch (error) {
                  console.error('Delete error:', error);
                  alert('Failed to delete analysis');
                  setIsDeleting(false);
                }
              }}
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/analysis/${analysisId}/ocr`)}
            >
              <FileText size={16} />
              View Extracted Text
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/document-analysis')}>
              Analyze Another Document
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 py-3 sm:px-6 lg:flex-row">
        {/* Left Panel - sticks while the document scrolls (desktop) */}
        <div className="order-2 flex shrink-0 flex-col gap-6 lg:order-1 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-12rem)] lg:w-96 lg:self-start lg:overflow-y-auto">
          <Card className="border border-gray-200 bg-white shadow-none shrink-0 max-h-80">
            <CardContent className="p-6 flex flex-col max-h-80">
              <h2 className="mb-4 font-semibold text-gray-900">Formal Issues</h2>

              {isReportLoading && (
                <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  Loading formal issues...
                </div>
              )}

              {!isReportLoading && !formalReport && (
                <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  Formal issues are not available yet.
                </div>
              )}

              {!isReportLoading && formalReport && formalIssues.length === 0 && (
                <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  No formal issues detected.
                </div>
              )}

              {formalIssues.length > 0 && (
                <div className="overflow-y-auto p-0.5">{formalIssueList}</div>
              )}
            </CardContent>
          </Card>

          {/* Issues Found Card - on mobile the list lives in a bottom sheet */}
          <Card className="hidden shrink-0 flex-col border border-gray-200 bg-white shadow-none lg:flex">
            <CardContent className="flex flex-col p-6">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-semibold text-gray-900">Issues Found</h2>
                <AiBadge />
              </div>
              {issueFilters}
              <div className="max-h-[55dvh] overflow-y-auto p-0.5">{issueList}</div>
            </CardContent>
          </Card>

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {((analysis?.legal_analysis_result as any)?.applicable_laws as any[])?.length > 0 && (
            <Card className="border border-gray-200 shrink-0">
              <CardContent className="p-6 flex-1 flex flex-col min-h-0">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">Applicable Laws</h3>
                  <AiBadge />
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                  {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ((analysis?.legal_analysis_result as any)?.applicable_laws as any[]).map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (law: any, idx: number) => (
                        <div
                          key={idx}
                          className="border-l-4 border-blue-300 bg-blue-50 p-3 rounded"
                        >
                          <p className="font-medium text-sm text-gray-900">{law.law}</p>
                          <p className="text-xs text-gray-600 mt-1">{law.reference}</p>
                          <p className="text-sm text-gray-700 mt-2">{law.description}</p>
                        </div>
                      ),
                    )
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Summary & Document Preview */}
        <div className="order-1 flex min-w-0 flex-1 flex-col gap-6 lg:order-2">
          {/* Summary */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {((analysis?.legal_analysis_result as any)?.summary as string) && (
            <Card className="border border-gray-200 bg-gray-50 shrink-0 max-h-40 overflow-y-auto">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="font-semibold text-gray-900">Summary</h2>
                  <AiBadge />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(analysis?.legal_analysis_result as any)?.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Document Preview with Highlights */}
          {analysis?.document_id && (
            <Card className="border border-gray-200 shadow-none">
              <CardContent className="p-3 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">Document Preview</h3>
                  <div className="flex items-center gap-2">
                    {variants.length > 1 && (
                      <div
                        role="radiogroup"
                        aria-label="Document version"
                        className="inline-flex rounded-md bg-gray-100 p-0.5"
                      >
                        {(['redacted', 'original'] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={variant === option}
                            onClick={() => setRequestedVariant(option)}
                            className={`rounded px-3 py-1 text-xs font-medium transition ${variant === option
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                              }`}
                          >
                            {option === 'redacted' ? 'Redacted' : 'Original'}
                          </button>
                        ))}
                      </div>
                    )}
                    <a
                      href={getDocumentDownloadUrl(analysis.document_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">Download original</span>
                    </a>
                  </div>
                </div>

                {pagesError && (
                  <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Error loading document: {pagesError.message}
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 sm:p-4">
                  {pagesManifest ? (
                    <DocumentViewer
                      analysisId={analysis.id}
                      pages={pagesManifest.pages}
                      variant={variant}
                      issues={viewerIssues}
                      hoveredIndex={hoveredErrorIndex}
                      selectedIndex={selectedErrorIndex}
                      canHover={canHover}
                      reducedMotion={reducedMotion}
                      popoverContent={isDesktop ? selectedIssueDetails : null}
                      onHover={setHoveredErrorIndex}
                      onSelect={setSelectedErrorIndex}
                    />
                  ) : (
                    !pagesError && (
                      <div className="flex aspect-[1/1.414] w-full items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
                      </div>
                    )
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-red-600 bg-red-100"></div>
                    <span className="text-xs text-gray-600">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-orange-600 bg-orange-100"></div>
                    <span className="text-xs text-gray-600">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-yellow-600 bg-yellow-100"></div>
                    <span className="text-xs text-gray-600">Medium</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile: issues sheet and the card of the selected issue */}
      {!isDesktop && viewerIssues.length > 0 && (
        <>
          {selectedIssueDetails ? (
            <div
              role="dialog"
              aria-label="Selected issue"
              className="fixed inset-x-0 bottom-0 z-40 m-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              {selectedIssueDetails}
              <button
                type="button"
                onClick={() => setIsIssueSheetOpen(true)}
                className="mt-2 w-full rounded-md border border-gray-200 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                All issues
              </button>
            </div>
          ) : (
            <Button
              onClick={() => setIsIssueSheetOpen(true)}
              className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 gap-2 rounded-full shadow-lg"
            >
              <ListChecks size={16} />
              Issues ({viewerIssues.length})
            </Button>
          )}

          <Sheet open={isIssueSheetOpen} onOpenChange={setIsIssueSheetOpen}>
            <SheetContent side="bottom" className="flex max-h-[80dvh] flex-col gap-0 rounded-t-xl bg-white">
              <SheetHeader className="pb-2">
                <SheetTitle className="flex items-center gap-3">
                  Issues Found <AiBadge />
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Select an issue to highlight it on the document.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
                {formalIssues.length > 0 && (
                  <>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Formal Issues</h3>
                    <div className="mb-6">{formalIssueList}</div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">AI Issues</h3>
                  </>
                )}
                {issueFilters}
                {issueList}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
