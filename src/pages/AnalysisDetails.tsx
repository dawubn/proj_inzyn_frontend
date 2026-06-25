import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, FileText, Copy } from 'lucide-react';
import type { DocumentAnalysisResponse } from '@/api/generated/model';
import { deleteRedactionApiV1RedactionsAnalysisIdDelete, useGetRedactionApiV1RedactionsAnalysisIdGet } from '@/api/generated/redactions/redactions';
import 'tiff.js';

const severityConfig: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  error: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  high: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  info: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  low: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' },
};

export default function AnalysisDetails() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState<number | null>(null);
  const [selectedErrorIndex, setSelectedErrorIndex] = useState<number | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const tiffRef = useRef<unknown>(null);

  const { data: analysisData, isLoading } = useGetRedactionApiV1RedactionsAnalysisIdGet(
    analysisId || '',
    {
      query: {
        enabled: !!analysisId,
      },
      fetch: {
        credentials: 'include',
      },
    }
  );

  const analysis = analysisData?.data as DocumentAnalysisResponse | undefined;

  const errors = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => ((analysis?.legal_analysis_result as any)?.errors as any[]) || [],
    [analysis?.legal_analysis_result]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findBboxForError = useCallback((error: any): { x: number; y: number; width: number; height: number } | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const words = (analysis?.tesseract_words as any[]) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textRef = (error as any).text_reference.toLowerCase().trim();
    const refWords = textRef.split(/[\s\n()/-]+/).filter((w: string) => w.length > 2);

    if (refWords.length === 0) {
      return null;
    }

    // Find ALL words from tesseract_words that match any of the refWords
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchedWords: any[] = [];
    const cleanedRefWords = refWords.map((w: string) => w.replace(/[^\p{L}\p{N}]/gu, ''));

    for (const word of words) {
      const wordText = word.text.toLowerCase();
      const cleanedWord = wordText.replace(/[^\p{L}\p{N}]/gu, '');

      for (const cleanedRefWord of cleanedRefWords) {
        if (cleanedWord.includes(cleanedRefWord) || cleanedRefWord.includes(cleanedWord)) {
          matchedWords.push(word);
          break;
        }
      }
    }

    if (matchedWords.length === 0) {
      return null;
    }

    // Calculate bounding box for ALL matched words
    const bboxes = matchedWords.map(w => w.bbox);
    const minX = Math.min(...bboxes.map(b => b.x));
    const minY = Math.min(...bboxes.map(b => b.y));
    const maxX = Math.max(...bboxes.map(b => b.x + b.width));
    const maxY = Math.max(...bboxes.map(b => b.y + b.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [analysis?.tesseract_words]);

  const enrichedErrors = useMemo(() => {
    return errors.map((error) => ({
      ...error,
      bbox: findBboxForError(error)
    }));
  }, [errors, findBboxForError]);

  const availableSeverities = useMemo(() => {
    const severities = new Set(enrichedErrors.map(e => e.severity));
    return ['all', ...Array.from(severities).sort()];
  }, [enrichedErrors]);

  const filteredErrors = enrichedErrors.filter((error) => {
    const matchesSeverity = filterSeverity === 'all' || error.severity === filterSeverity;
    const matchesSearch = error.issue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  // Load TIFF document
  useEffect(() => {
    if (!analysis?.document_id || !canvasRef.current) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const loadTiff = async () => {
      try {
        setIsLoadingImage(true);
        setImageError(null);

        const response = await fetch(
          `${apiUrl}/api/v1/documents/${analysis.document_id}/download`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Tiff = (window as any).Tiff;
        if (!Tiff) {
          throw new Error('Tiff library not loaded');
        }
        const tiff = new Tiff({ buffer: arrayBuffer });

        // Get total pages
        const pages = tiff.countDirectory();
        setTotalPages(pages);
        setCurrentPage(0);

        // Store TIFF for page changes
        tiffRef.current = tiff;

        // Render first page
        const canvas = tiff.toCanvas();

        if (!canvas) {
          throw new Error('Failed to render TIFF');
        }

        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        // Copy TIFF canvas to our canvas
        canvasElement.width = canvas.width;
        canvasElement.height = canvas.height;

        const ctx = canvasElement.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(canvas, 0, 0);
        imageRef.current = canvas;
        setIsLoadingImage(false);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Error loading TIFF:', errMsg);
        setImageError(`Error: ${errMsg}`);
        setIsLoadingImage(false);
      }
    };

    loadTiff();
  }, [analysis?.document_id, errors]);

  // Handle page changes
  useEffect(() => {
    if (!tiffRef.current || !canvasRef.current || totalPages === 0) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tiff = tiffRef.current as any;
      tiff.setDirectory(currentPage);
      const canvas = tiff.toCanvas();

      if (!canvas) return;

      const canvasElement = canvasRef.current;
      canvasElement.width = canvas.width;
      canvasElement.height = canvas.height;

      const ctx = canvasElement.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(canvas, 0, 0);
      imageRef.current = canvas;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [currentPage, totalPages]);

  // Redraw highlights
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw TIFF image
    if (imageRef.current instanceof HTMLCanvasElement) {
      ctx.drawImage(imageRef.current, 0, 0);
    }

    // TODO: Fix highlight positioning - temporarily disabled
    /*
    enrichedErrors.forEach((error: any, idx: number) => {
      const isHovered = hoveredErrorIndex === idx;
      const isSelected = selectedErrorIndex === idx;

      if (!error.bbox) {
        console.log(`Error ${idx} (${error.issue.substring(0, 40)}) has no bbox`);
        return;
      }

      if (idx === 0) {
        console.log('Drawing highlights. Canvas:', { width: canvas.width, height: canvas.height });
        console.log('First error bbox:', error.bbox);
      }

      const severity = error.severity as keyof typeof severityConfig;
      const baseOpacity = isHovered || isSelected ? 0.4 : 0.15;
      const strokeWidth = isHovered || isSelected ? 3 : 2;

      const colors = {
        critical: {
          fill: `rgba(239, 68, 68, ${baseOpacity})`,
          stroke: isHovered || isSelected ? '#991b1b' : '#dc2626'
        },
        high: {
          fill: `rgba(249, 115, 22, ${baseOpacity})`,
          stroke: isHovered || isSelected ? '#92400e' : '#ea580c'
        },
        medium: {
          fill: `rgba(234, 179, 8, ${baseOpacity})`,
          stroke: isHovered || isSelected ? '#854d0e' : '#ca8a04'
        },
      };

      const color = colors[severity];
      const { x, y, width, height } = error.bbox;

      if (ctx) {
        ctx.fillStyle = color.fill;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = color.stroke;
        ctx.lineWidth = strokeWidth;
        ctx.strokeRect(x, y, width, height);
      }
    });
    */
  }, [hoveredErrorIndex, selectedErrorIndex, enrichedErrors]);

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
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-3 flex-shrink-0">

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Document Analysis</h1>
            <p className="text-sm text-gray-600 mt-1">Legal Analysis Report</p>
            {analysis && (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <div className="text-gray-600">
                  Created: <span className="font-medium text-gray-900">{new Date(analysis.created_at).toLocaleString('pl-PL')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Document ID:</span>
                  <button
                    onClick={() => copyToClipboard(analysis.document_id)}
                    className="text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1.5 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
                    title="Click to copy"
                  >
                    <span className="font-mono text-xs text-gray-900">{analysis.document_id}</span>
                    <Copy size={14} className="flex-shrink-0" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Analysis ID:</span>
                  <button
                    onClick={() => copyToClipboard(analysis.id)}
                    className="text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1.5 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
                    title="Click to copy"
                  >
                    <span className="font-mono text-xs text-gray-900">{analysis.id}</span>
                    <Copy size={14} className="flex-shrink-0" />
                  </button>
                </div>
                <div className={`px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                  analysis.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    analysis.status === 'ocr_failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1).replace(/_/g, ' ')}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/document-analysis')}
            >
              Analyze Another Document
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 px-6 py-3 flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Issues List & Applicable Laws */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-6 min-h-0 overflow-hidden">
          {/* Issues Found Card */}
          <Card className="border border-gray-200 bg-white shadow-none flex-1 flex flex-col min-h-0">
            <CardContent className="p-6 flex-1 flex flex-col min-h-0">
              <h2 className="font-semibold text-gray-900 mb-4">Issues Found</h2>

              {/* Search */}
              <Input
                placeholder="Search alert"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4 border-gray-300"
              />

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {availableSeverities.map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setFilterSeverity(severity)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition ${filterSeverity === severity
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                ))}
              </div>

              {/* Issues List */}
              <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {filteredErrors.map((error: any, filteredIdx) => {
                  const originalIdx = enrichedErrors.indexOf(error);
                  const config = severityConfig[error.severity] ?? severityConfig['low'];
                  const isHovered = hoveredErrorIndex === originalIdx;
                  const isSelected = selectedErrorIndex === originalIdx;
                  return (
                    <div
                      key={filteredIdx}
                      onMouseEnter={() => setHoveredErrorIndex(originalIdx)}
                      onMouseLeave={() => setHoveredErrorIndex(null)}
                      onClick={() => setSelectedErrorIndex(isSelected ? null : originalIdx)}
                      className={`border-l-4 ${config.border} ${config.bg} p-3 rounded transition cursor-pointer ${isSelected ? 'ring-2 ring-gray-900 bg-opacity-80' : isHovered ? 'bg-opacity-80' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${config.text} text-sm`}>{error.issue}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{error.text_reference}</p>
                        </div>
                        <span className={`${config.badge} px-2 py-1 rounded text-xs font-medium whitespace-nowrap`}>
                          {error.severity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Applicable Laws Card */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {((analysis?.legal_analysis_result as any)?.applicable_laws as any[])?.length > 0 && (
            <Card className="border border-gray-200 flex-1 flex flex-col min-h-0">
              <CardContent className="p-6 flex-1 flex flex-col min-h-0">
                <h3 className="font-semibold text-gray-900 mb-4">Applicable Laws</h3>
                <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                  {(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ((analysis?.legal_analysis_result as any)?.applicable_laws as any[]).map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (law: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-blue-300 bg-blue-50 p-3 rounded">
                          <p className="font-medium text-sm text-gray-900">{law.law}</p>
                          <p className="text-xs text-gray-600 mt-1">{law.reference}</p>
                          <p className="text-sm text-gray-700 mt-2">{law.description}</p>
                        </div>
                      )
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Document Preview & Summary */}
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">
          {/* Summary */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {((analysis?.legal_analysis_result as any)?.summary as string) && (
            <Card className="border border-gray-200 bg-gray-50 flex-shrink-0 max-h-32 overflow-y-auto">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(analysis?.legal_analysis_result as any)?.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Document Preview with Highlights */}
          {analysis?.document_id && (
            <Card className="border border-gray-200 flex-1 flex flex-col min-h-0">
              <CardContent className="p-6 flex flex-col flex-1 min-h-0">
                <h3 className="font-semibold text-gray-900 mb-3">Document Preview</h3>
                {imageError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">
                    Error loading document: {imageError}
                  </div>
                )}

                {/* Page Navigation */}
                {totalPages > 1 && (
                  <div className="mb-4 flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-600 min-w-max">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm"
                    >
                      Next →
                    </button>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto flex-1 min-h-0 relative">
                  {isLoadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded z-10">
                      <div className="text-center">
                        <div className="inline-block">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                        </div>
                        <p className="mt-3 text-sm text-gray-700 font-medium">Loading document...</p>
                      </div>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    className="mx-auto border border-gray-300 rounded"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-600"></div>
                    <span className="text-xs text-gray-600">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-100 border-2 border-orange-600"></div>
                    <span className="text-xs text-gray-600">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-600"></div>
                    <span className="text-xs text-gray-600">Medium</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
