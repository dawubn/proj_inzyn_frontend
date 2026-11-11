import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useGetRedactionApiV1RedactionsAnalysisIdGet } from '@/api/generated/redactions/redactions';
import type { DocumentAnalysisResponse } from '@/api/generated/model';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OcrResultsDetailed() {
  const { analysisId } = useParams<{ analysisId: string }>();

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

  const analysis =
    analysisData?.status === 200 ? (analysisData.data as DocumentAnalysisResponse) : undefined;

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
      <div className="w-full max-w-full sm:px-2 lg:px-4">
        <div className="mx-auto w-full max-w-400 rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:p-6">
          <p role="status" className="text-sm text-[#737373]">
            Loading OCR results...
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
            Failed to load the extracted text. Refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full sm:px-2 lg:px-4">
      <div className="mx-auto flex w-full max-w-400 flex-col rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] p-3 shadow-sm sm:p-4 lg:p-6">
        <div className="shrink-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[#0A0A0A] sm:text-4xl">
            Extracted Text
          </h1>
        </div>

        <div className="mt-6 rounded-lg border border-[#E5E5E5] bg-white px-3 py-3 shadow-sm sm:px-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
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

        <div className="mt-6">
          <div className="space-y-6">
            {/* Full Text Card */}
            <Card className="rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0">
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 sm:text-lg">
                    <FileText size={20} />
                    Full Document Text
                  </h2>
                  <Button
                    variant="outline"
                    className="h-9 rounded-lg border-gray-300 bg-white px-3 text-sm text-gray-900 hover:bg-gray-50"
                    onClick={() => {
                      navigator.clipboard.writeText(fullText);
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-[#E5E5E5] max-h-96 overflow-y-auto sm:p-6">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {fullText || 'No text extracted'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {ocrResult && Array.isArray(ocrResult.paragraphs) && (
              <Card className="rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0">
                <CardContent className="p-3 sm:p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-6 sm:text-lg">
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
                            <div key={pageIdx} className="rounded-lg border border-[#E5E5E5] p-3 sm:p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Page {pageIdx + 1}</h3>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                  {pageParagraphs.length} paragraphs
                                </span>
                              </div>

                              <div className="space-y-3">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {pageParagraphs.map((para: any, paraIdx: number) => (
                                  <div
                                    key={paraIdx}
                                    className="rounded-lg border border-[#E5E5E5] bg-gray-50 p-3"
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
              <Card className="rounded-lg border border-[#E5E5E5] bg-white py-0 shadow-sm ring-0">
                <CardContent className="p-3 sm:p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 sm:text-lg">Raw OCR</h2>
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
    </div>
  );
}
