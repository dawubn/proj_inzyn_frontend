import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetRedactionApiV1RedactionsAnalysisIdGet } from '@/api/generated/redactions/redactions';
import type { DocumentAnalysisResponse } from '@/api/generated/model';
import { Card, CardContent } from '@/components/ui/card';

export default function OcrResults() {
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

  const renderAzureOcrStructure = () => {
    if (!ocrResult) {
      return <div className="text-gray-600">No OCR result available</div>;
    }

    // Azure Form Recognizer returns readResults with pages, lines, words
    if (ocrResult.analyzeResult?.readResults) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ocrResult.analyzeResult.readResults.map((page: any, pageIdx: number) => (
        <div key={pageIdx} className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Page {pageIdx + 1}</h3>
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {page.lines?.map((line: any, lineIdx: number) => (
              <div key={lineIdx} className="bg-gray-50 p-4 rounded border border-gray-200">
                <div className="mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Line {lineIdx + 1}
                  </span>
                </div>
                <p className="text-gray-900 font-medium">{line.text}</p>
                {line.words && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Word-by-word:</div>
                    <div className="flex flex-wrap gap-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {line.words.map((word: any, wordIdx: number) => (
                        <span
                          key={wordIdx}
                          className="bg-white border border-gray-300 px-2 py-1 rounded text-xs text-gray-700"
                        >
                          {word.text}
                          {word.confidence !== undefined && (
                            <span className="text-gray-500 ml-1">
                              ({Math.round(word.confidence * 100)}%)
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ));
    }

    // Fallback: just display raw JSON structure
    return (
      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <pre className="text-xs text-gray-700 overflow-auto max-h-96">
          {JSON.stringify(ocrResult, null, 2)}
        </pre>
      </div>
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">OCR Results</h1>
          </div>
          <button
            onClick={() => navigate(`/analysis/${analysisId}/ocr-detailed`)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
          >
            View Detailed Text
          </button>
        </div>
        {analysis && (
          <div className="mt-3 text-sm text-gray-600">
            Analysis ID: <span className="font-mono font-medium">{analysis.id}</span> •
            OCR Provider: <span className="font-medium">{analysis.ocr_provider || 'Unknown'}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <Card className="border border-gray-200 bg-white shadow-none">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-gray-900">Extracted Text Structure</h2>
            {renderAzureOcrStructure()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
