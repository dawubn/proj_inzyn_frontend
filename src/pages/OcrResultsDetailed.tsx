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

    if (typeof ocrResult.content === 'string') {
      return ocrResult.content;
    }

    if (ocrResult.analyzeResult?.readResults) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ocrResult.analyzeResult.readResults.flatMap((page: any) => page.lines?.map((line: any) => line.text) || [])
        .join('\n');
    }

    if (Array.isArray(ocrResult)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ocrResult.flatMap((page: any) => page.lines?.map((line: any) => line.text) || [])
        .join('\n');
    }

    if (Array.isArray(ocrResult.readResults)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ocrResult.readResults.flatMap((page: any) => page.lines?.map((line: any) => line.text) || [])
        .join('\n');
    }

    return '';
  };

  const getPageCount = (): number => {
    if (!ocrResult) return 0;

    if (Array.isArray(ocrResult.pages)) {
      return ocrResult.pages.length;
    }

    const pages = ocrResult.analyzeResult?.readResults || ocrResult.readResults || (Array.isArray(ocrResult) ? ocrResult : null);
    return pages?.length || 0;
  };

  const getWordCount = (): number => {
    if (!ocrResult) return 0;

    if (typeof ocrResult.content === 'string') {
      return ocrResult.content.split(/\s+/).filter((w: string) => w.length > 0).length;
    }

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
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 shrink-0">
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

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 pb-12">
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

          {ocrResult && (
            <Card className="border border-gray-200 bg-white shadow-none mb-6">
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
                </div>
              </CardContent>
            </Card>
          )}

          {ocrResult && (
            <Card className="border border-gray-200 bg-white shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw OCR</h2>
                <div className="bg-gray-900 p-4 rounded border border-gray-700 max-h-96 overflow-auto">
                  <pre className="text-xs text-gray-100 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(ocrResult, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
