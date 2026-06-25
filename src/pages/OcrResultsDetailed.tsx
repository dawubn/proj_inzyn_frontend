import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useGetRedactionApiV1RedactionsAnalysisIdGet } from '@/api/generated/redactions/redactions';
import type { DocumentAnalysisResponse } from '@/api/generated/model';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OcrResultsDetailed() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ocrResult = (analysis?.ocr_raw_result as any) || null;

  const extractFullText = (): string => {
    if (!ocrResult) return '';

    // Azure Document Intelligence v4 format - build from paragraphs grouped by page
    if (Array.isArray(ocrResult.paragraphs)) {
      const textByPage: string[] = [];

      for (let pageIdx = 0; pageIdx < getPageCount(); pageIdx++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageParagraphs = ocrResult.paragraphs.filter((para: any) =>
          para.boundingRegions?.[0]?.pageNumber === pageIdx + 1
        );

        const pageText = pageParagraphs
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((para: any) => para.content)
          .join('\n');

        if (pageText) {
          textByPage.push(pageText);
        }
      }

      return textByPage.join('\n\n--- PAGE BREAK ---\n\n');
    }

    // Fallback to direct content property
    if (typeof ocrResult.content === 'string') {
      return ocrResult.content;
    }

    // Azure Form Recognizer v3 format (analyzeResult.readResults)
    if (ocrResult.analyzeResult?.readResults) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ocrResult.analyzeResult.readResults.flatMap((page: any) => page.lines?.map((line: any) => line.text) || [])
        .join('\n');
    }

    // Alternative: array of pages with lines
    if (Array.isArray(ocrResult)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ocrResult.flatMap((page: any) => page.lines?.map((line: any) => line.text) || [])
        .join('\n');
    }

    // Check if has readResults directly
    if (Array.isArray(ocrResult.readResults)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ocrResult.readResults.flatMap((page: any) => page.lines?.map((line: any) => line.text) || [])
        .join('\n');
    }

    return '';
  };

  const getPageCount = (): number => {
    if (!ocrResult) return 0;

    // Azure Document Intelligence v4 - has pages array
    if (Array.isArray(ocrResult.pages)) {
      return ocrResult.pages.length;
    }

    // Azure Form Recognizer v3 - has analyzeResult.readResults
    const pages = ocrResult.analyzeResult?.readResults || ocrResult.readResults || (Array.isArray(ocrResult) ? ocrResult : null);
    return pages?.length || 0;
  };

  const getWordCount = (): number => {
    if (!ocrResult) return 0;

    // Azure Document Intelligence v4 - count words from content
    if (typeof ocrResult.content === 'string') {
      return ocrResult.content.split(/\s+/).filter((w: string) => w.length > 0).length;
    }

    // Azure Form Recognizer v3 - count from pages
    const pages = ocrResult.analyzeResult?.readResults || ocrResult.readResults || (Array.isArray(ocrResult) ? ocrResult : null);
    if (!pages) return 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return pages.reduce((count: number, page: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return count + (page.lines?.reduce((lineCount: number, line: any) => {
        return lineCount + (line.words?.length || 0);
      }, 0) || 0);
    }, 0);
  };

  const fullText = extractFullText();
  const pageCount = getPageCount();
  const wordCount = getWordCount();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading OCR results...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/analysis/${analysisId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Extracted Text</h1>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-gray-200 px-6 py-3 flex-shrink-0 bg-gray-50">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">Pages:</span>
            <span className="font-semibold text-gray-900 ml-2">{pageCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Words:</span>
            <span className="font-semibold text-gray-900 ml-2">{wordCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Provider:</span>
            <span className="font-semibold text-gray-900 ml-2">
              {analysis?.ocr_provider
                ? analysis.ocr_provider.charAt(0).toUpperCase() + analysis.ocr_provider.slice(1)
                : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          {/* Full Text Card */}
          <Card className="border border-gray-200 bg-white shadow-none mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={20} />
                  Full Document Text
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(fullText);
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="bg-gray-50 p-6 rounded border border-gray-300 max-h-96 overflow-y-auto">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                  {fullText || 'No text extracted'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          {ocrResult && (
            <Card className="border border-gray-200 bg-white shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  {Array.isArray(ocrResult.pages) ? 'Page Breakdown' : 'Content Breakdown'}
                </h2>
                <div className="space-y-6">
                  {/* Azure Document Intelligence v4 - paragraphs based, grouped by page */}
                  {Array.isArray(ocrResult.paragraphs) && !Array.isArray(ocrResult.analyzeResult?.readResults) && (
                    <>
                      {Array.from({ length: getPageCount() }, (_, pageIdx) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const pageParagraphs = ocrResult.paragraphs.filter((para: any) =>
                          para.boundingRegions?.[0]?.pageNumber === pageIdx + 1
                        );

                        if (pageParagraphs.length === 0) return null;

                        return (
                          <div key={pageIdx} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900">Page {pageIdx + 1}</h3>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {pageParagraphs.length} paragraphs
                              </span>
                            </div>

                            <div className="space-y-3">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {pageParagraphs.map((para: any, paraIdx: number) => (
                                <div
                                  key={paraIdx}
                                  className="bg-gray-50 p-3 rounded border-l-4 border-blue-300"
                                >
                                  <p className="text-gray-900 text-sm leading-relaxed">{para.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Azure Document Intelligence v4 & Form Recognizer v3 - pages with lines & words */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {((ocrResult.pages || ocrResult.analyzeResult?.readResults || ocrResult.readResults || (Array.isArray(ocrResult) ? ocrResult : null)) as any[])?.map((page: any, pageIdx: number) => (
                    <div key={pageIdx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Page {pageIdx + 1}</h3>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {page.lines?.length || 0} lines
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {page.lines?.map((line: any, lineIdx: number) => (
                          <div
                            key={lineIdx}
                            className="bg-gray-50 p-3 rounded border-l-4 border-blue-300"
                          >
                            <p className="text-gray-900 text-sm leading-relaxed">{line.text}</p>
                            {line.words && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-600 mb-1 font-medium">
                                  Confidence:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {line.words.map((word: any, wordIdx: number) => (
                                    <span
                                      key={wordIdx}
                                      className={`text-xs px-1.5 py-0.5 rounded ${
                                        word.confidence >= 0.9
                                          ? 'bg-green-100 text-green-800'
                                          : word.confidence >= 0.7
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {word.text} ({Math.round(word.confidence * 100)}%)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
