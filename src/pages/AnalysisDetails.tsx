import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Trash2,
  FileText,
  Copy,
  CloudAlert,
  Brain,
  Download,
  ListChecks,
  Loader2,
} from 'lucide-react';
import type {
  AnalysisReportResponse,
  DocumentAnalysisResponse,
  DocumentResponse,
} from '@/api/generated/model';
import { useGetReportApiV1ReportsAnalysisIdGet } from '@/api/generated/reports/reports';
import { useGetRedactionApiV1RedactionsAnalysisIdGet } from '@/api/generated/redactions/redactions';
import {
  getDocumentTypeLabel,
  patchDocumentType,
  confirmDocumentType,
  triggerLegalAnalysis,
  fetchPagesManifest,
  getDocumentDownloadUrl,
  type PreviewVariant,
} from '@/api/documents-wrapper';
import { FormalValidationCard } from '@/components/analysis/FormalValidationCard';
import { DocumentViewer } from '@/features/document-viewer/DocumentViewer';
import { IssueDetails } from '@/features/document-viewer/IssueDetails';
import { IssueList } from '@/features/document-viewer/IssueList';
import type { LegalIssue } from '@/features/document-viewer/types';
import { aiToViewerIssue, formalToViewerIssue } from '@/features/document-viewer/toViewerIssue';
import {
  DeleteAnalysisDialog,
  type AnalysisToDelete,
} from '@/features/analysis/DeleteAnalysisDialog';
import { useDownloadReport } from '@/hooks/analysis/useDownloadReport';
import { getAnalysisStatusConfig } from '@/lib/analysisStatus';
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
  const [analysisToDelete, setAnalysisToDelete] = useState<AnalysisToDelete | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null);
  const [selectedErrorIndex, setSelectedErrorIndex] = useState<number | null>(null);
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [bubbleError, setBubbleError] = useState<string | null>(null);
  const [requestedVariant, setRequestedVariant] = useState<PreviewVariant>('redacted');
  const [isIssueSheetOpen, setIsIssueSheetOpen] = useState(false);

  const downloadReport = useDownloadReport();

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

  const analysis =
    analysisData?.status === 200 ? (analysisData.data as DocumentAnalysisResponse) : undefined;
  const formalReport =
    reportData?.status === 200 ? (reportData.data as AnalysisReportResponse) : undefined;

  const [docInfo, setDocInfo] = useState<DocumentResponse | null>(null);

  useEffect(() => {
    if (!analysis?.document_id) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/v1/documents/${analysis.document_id}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDocInfo(data);
      })
      .catch(() => {});
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

  const formalIssues = useMemo(
    () => [...(formalReport?.errors ?? []), ...(formalReport?.warnings ?? [])],
    [formalReport],
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
    const order = ['critical', 'high', 'medium', 'low', 'info'];
    return ['all', ...Array.from(severities).sort((a, b) => order.indexOf(a) - order.indexOf(b))];
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
  const issueList =
    filteredItems.length === 0 ? (
      <p className="text-sm text-[#737373]">
        {errors.length ? 'No issues match your search.' : 'No issues found.'}
      </p>
    ) : (
      <IssueList items={filteredItems} {...issueListProps} />
    );
  const formalCardProps = {
    selectedIssueIndex:
      selectedErrorIndex != null && selectedErrorIndex >= errors.length
        ? selectedErrorIndex - errors.length
        : null,
    hoveredIssueIndex:
      hoveredErrorIndex != null && hoveredErrorIndex >= errors.length
        ? hoveredErrorIndex - errors.length
        : null,
    onSelectIssue: (index: number | null) =>
      issueListProps.onSelect(index == null ? null : errors.length + index),
    onHoverIssue: canHover
      ? (index: number | null) => setHoveredErrorIndex(index == null ? null : errors.length + index)
      : undefined,
    reducedMotion,
  };

  const issueFilters = (
    <>
      <Input
        placeholder="Search issues..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 h-9 rounded-full border-[#E5E5E5] bg-white px-3 text-sm focus-visible:border-gray-400 focus-visible:ring-0"
      />

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {availableSeverities.map((severity) => (
          <button
            key={severity}
            onClick={() => setFilterSeverity(severity)}
            className={`min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:min-h-0 sm:py-1 ${
              filterSeverity === severity
                ? 'bg-[#171717] text-white'
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
      <div className="w-full max-w-full sm:px-2 lg:px-4">
        <div className="mx-auto w-full max-w-400 rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:p-6">
          <p role="status" className="text-sm text-[#737373]">
            Loading analysis...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="w-full max-w-full sm:px-2 lg:px-4">
        <div className="mx-auto w-full max-w-400 rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:p-6">
          <p role="alert" className="text-sm text-red-600">
            Failed to load the analysis. Refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full pb-16 sm:px-2 lg:px-4 lg:pb-0">
      <div className="mx-auto flex w-full max-w-400 flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:p-6">
        {/* Header */}
        <div className="shrink-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[#0A0A0A] sm:text-4xl">
                Analysis details
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">{getDocumentTypeLabel(effectiveType)}</p>

              {showBubble && !showRerunConfirm && (
                <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm">
                  <CloudAlert size={15} className="text-blue-500 shrink-0" />
                  <span className="text-blue-700">
                    Suggested type: <strong>{getDocumentTypeLabel(suggestedType)}</strong>
                    {confidence != null && (
                      <span className="text-blue-500 ml-1">({Math.round(confidence * 100)}%)</span>
                    )}
                  </span>
                  <button
                    onClick={() => setShowRerunConfirm(true)}
                    className="ml-1 min-h-9 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-100 sm:min-h-0 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    Use detected
                  </button>
                  <button
                    onClick={handleKeepMyType}
                    className="min-h-9 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors sm:min-h-0"
                  >
                    Keep my type
                  </button>
                </div>
              )}

              {showBubble && showRerunConfirm && (
                <div className="mt-2 inline-flex flex-col gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <CloudAlert size={15} className="text-blue-500 shrink-0" />
                    <span className="text-blue-700">
                      Re-run analysis as <strong>{getDocumentTypeLabel(suggestedType)}</strong>?
                    </span>
                    <button
                      onClick={handleRunWithDetectedType}
                      disabled={isRerunning}
                      className="ml-1 min-h-9 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-600 sm:min-h-0 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isRerunning ? 'Starting...' : 'Run analysis'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRerunConfirm(false);
                        setBubbleError(null);
                      }}
                      disabled={isRerunning}
                      className="min-h-9 whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors sm:min-h-0"
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
                      {new Date(analysis.created_at).toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-gray-600">Document ID:</span>
                    <button
                      onClick={() => copyToClipboard(analysis.document_id)}
                      className="text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1.5 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
                      title="Click to copy"
                    >
                      <span className="font-mono text-xs text-gray-900">
                        {analysis.document_id}
                      </span>
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
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getAnalysisStatusConfig(analysis.status).className}`}
                  >
                    {getAnalysisStatusConfig(analysis.status).label}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-lg border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50 disabled:pointer-events-auto disabled:cursor-not-allowed"
                disabled={analysis?.status !== 'completed' || downloadReport.isPending}
                title={
                  analysis?.status !== 'completed'
                    ? 'The report will be available once the analysis is completed'
                    : undefined
                }
                onClick={() => analysisId && downloadReport.mutate(analysisId)}
              >
                {downloadReport.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Download Report
              </Button>
              <Button
                variant="destructive"
                className="h-10 gap-2 rounded-lg border-[#e7caca] bg-white px-4 text-sm text-[#a33636] hover:bg-[#fff3f3]"
                onClick={() => {
                  if (!analysisId) return;
                  setAnalysisToDelete({
                    id: analysisId,
                    name: `Analysis ${analysisId.slice(0, 8)}`,
                  });
                }}
              >
                <Trash2 size={16} />
                Delete
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-lg border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50"
                onClick={() => navigate(`/analysis/${analysisId}/ocr`)}
              >
                <FileText size={16} />
                View Extracted Text
              </Button>
              <Button
                className="h-10 rounded-lg bg-[#171717] px-4 text-sm text-white hover:bg-[#2A2A2A]"
                onClick={() => navigate('/document-analysis')}
              >
                New Document Analysis
              </Button>
              {downloadReport.error && (
                <p className="basis-full text-xs text-red-600 lg:text-right">
                  {downloadReport.error.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Left Panel - sticks while the document scrolls (desktop) */}
          <div className="order-2 flex shrink-0 flex-col gap-6 lg:order-1 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-12rem)] lg:w-96 lg:self-start lg:overflow-y-auto">
            <FormalValidationCard
              report={formalReport}
              isLoading={isReportLoading}
              {...formalCardProps}
            />

            {/* Issues Found Card - on mobile the list lives in a bottom sheet */}
            <Card className="hidden shrink-0 flex-col rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0 lg:flex">
              <CardContent className="flex flex-col p-3 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Issues Found</h2>
                  <AiBadge />
                </div>
                {errors.length > 0 && issueFilters}
                <div className="max-h-[55dvh] overflow-y-auto p-0.5">{issueList}</div>
              </CardContent>
            </Card>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((analysis?.legal_analysis_result as any)?.applicable_laws as any[])?.length > 0 && (
              <Card className="rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0 shrink-0">
                <CardContent className="p-3 sm:p-5 flex-1 flex flex-col min-h-0">
                  <div className="mb-4 flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                      Applicable Laws
                    </h3>
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
                            className="rounded-lg border border-[#E5E5E5] bg-gray-50 p-3"
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
              <Card className="rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0 shrink-0 max-h-40 overflow-y-auto">
                <CardContent className="p-3 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Summary</h2>
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
              <Card className="rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0">
                <CardContent className="p-3 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                      Document Preview
                    </h3>
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
                              className={`min-h-9 rounded px-3 py-1.5 text-xs font-medium transition sm:min-h-0 sm:py-1 ${
                                variant === option
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
                        aria-label="Download original"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 sm:min-h-0 sm:min-w-0"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Download original</span>
                      </a>
                    </div>
                  </div>

                  {pagesError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Error loading document: {pagesError.message}
                    </div>
                  )}

                  {!pagesError && (
                    <>
                      <div className="rounded-lg border border-[#E5E5E5] bg-gray-50 p-2 sm:p-4">
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
                          <div className="h-4 w-4 rounded-sm border-2 border-red-600 bg-red-100"></div>
                          <span className="text-xs text-gray-600">Critical</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-sm border-2 border-orange-600 bg-orange-100"></div>
                          <span className="text-xs text-gray-600">High</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-sm border-2 border-yellow-600 bg-yellow-100"></div>
                          <span className="text-xs text-gray-600">Medium</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile: issues sheet and the card of the selected issue */}
        {!isDesktop && (
          <>
            {selectedIssueDetails ? (
              <div
                role="dialog"
                aria-label="Selected issue"
                className="fixed inset-x-0 bottom-0 z-40 m-3 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-lg pb-[max(1rem,env(safe-area-inset-bottom))]"
              >
                {selectedIssueDetails}
                <button
                  type="button"
                  onClick={() => setIsIssueSheetOpen(true)}
                  className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  All issues
                </button>
              </div>
            ) : (
              <Button
                onClick={() => setIsIssueSheetOpen(true)}
                className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 h-10 gap-2 rounded-full bg-[#171717] px-4 text-white shadow-lg hover:bg-[#2A2A2A]"
              >
                <ListChecks size={16} />
                {viewerIssues.length ? `Issues (${viewerIssues.length})` : 'Results'}
              </Button>
            )}

            <Sheet open={isIssueSheetOpen} onOpenChange={setIsIssueSheetOpen}>
              <SheetContent
                side="bottom"
                className="flex max-h-[80dvh] flex-col gap-0 rounded-t-xl border-[#E5E5E5] bg-white"
              >
                <SheetHeader className="pb-2">
                  <SheetTitle className="flex items-center gap-3 font-semibold text-gray-900">
                    Issues Found <AiBadge />
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Select an issue to highlight it on the document.
                  </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
                  <div className="mb-6">
                    <FormalValidationCard
                      report={formalReport}
                      isLoading={isReportLoading}
                      {...formalCardProps}
                    />
                  </div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">AI Issues</h3>
                  {errors.length > 0 && issueFilters}
                  {issueList}
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
        <DeleteAnalysisDialog
          analysis={analysisToDelete}
          onClose={() => setAnalysisToDelete(null)}
          onDeleted={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
}
