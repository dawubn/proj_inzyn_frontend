import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

import { useFileSelection } from '@/hooks/analysis/useFileSelection';
import { useDocumentAnalysis } from '@/hooks/analysis/useDocumentAnalysis';
import { getTotalFileSize, fetchDocuments, triggerLegalAnalysis, getAnalysisStatus } from '@/api/documents-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DocumentAnalysis() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const lastDocumentRef = useRef<HTMLDivElement>(null);

  const {
    fileEntries,
    selectedFiles,
    errorMessage,
    setErrorMessage,
    handleInputChange,
    handleDrop,
    handleDragOver,
    handleRemoveFile,
  } = useFileSelection();

  const { isPending, startAnalysis, analysisId } = useDocumentAnalysis();

  // Fetch documents with infinite scroll
  const {
    data: documentsData,
    isLoading: docsLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['user-documents'],
    queryFn: ({ pageParam = 1 }) => fetchDocuments(pageParam, 20),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

  const documents = documentsData?.pages.flatMap((page) => page.items) || [];

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (lastDocumentRef.current) {
      observer.observe(lastDocumentRef.current);
    }

    return () => {
      if (lastDocumentRef.current) {
        observer.unobserve(lastDocumentRef.current);
      }
    };
  }, [hasNextPage, fetchNextPage]);

  // Current analysis ID (from either upload or button)
  const currentAnalysisId = analysisId || selectedAnalysisId;

  // Handle button-triggered analysis
  const handleSetAnalysisId = (id: string) => {
    setSelectedAnalysisId(id);
    setIsAnalyzing(true);
  };

  // Poll analysis status (for both button-triggered and file-upload-triggered analyses)
  const { data: analysisStatus } = useQuery({
    queryKey: ['analysis-status', currentAnalysisId],
    queryFn: () => getAnalysisStatus(currentAnalysisId!),
    enabled: !!currentAnalysisId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Update analyzing state based on analysis status
  useEffect(() => {
    if (analysisStatus) {
      if (analysisStatus.status === 'completed' || analysisStatus.status.includes('failed')) {
        setIsAnalyzing(false);
      }
    }
  }, [analysisStatus]);

  // Navigate to analysis details when completed
  useEffect(() => {
    if (analysisStatus?.status === 'completed' && currentAnalysisId) {
      navigate(`/analysis/${currentAnalysisId}`);
    }
  }, [analysisStatus?.status, currentAnalysisId, navigate]);

  function handleStartAnalysis() {
    if (selectedFiles.length === 0) {
      setErrorMessage('Select at least one document first.');
      return;
    }

    startAnalysis(selectedFiles);
  }

  async function handleTriggerLegalAnalysis() {
    if (!selectedDocId) {
      setAnalysisError('Please select a document.');
      return;
    }

    try {
      setAnalysisError('');
      const result = await triggerLegalAnalysis(selectedDocId);
      handleSetAnalysisId(result.analysis_id);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to trigger analysis');
      setIsAnalyzing(false);
    }
  }

  // Legal analysis processing screen (for both upload and button flows)
  if (currentAnalysisId && !analysisStatus?.status?.includes('completed')) {
    const progressPercent = analysisStatus?.processing_step ? Math.min((analysisStatus.processing_step / 4) * 100, 95) : 0;
    const stageLabel = analysisStatus?.processing_stage ? {
      pending: 'Starting analysis',
      local_ocr: 'Local OCR',
      redaction: 'Redaction',
      azure_ocr: 'Azure OCR',
      llm_analysis: 'Legal Analysis',
      completed: 'Completed',
    }[analysisStatus.processing_stage as string] || analysisStatus.processing_stage : 'Preparing...';

    return (
      <div className="flex w-full items-start justify-center px-3 pt-16 pb-6 sm:items-center sm:px-4 sm:pt-16 sm:pb-10">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Legal Analysis</h1>

          <div className="mx-auto mt-6 rounded-xl border border-[#E5E5E5] bg-white px-6 py-4 sm:mt-10 sm:px-8 sm:py-5">
            <p className="text-sm text-gray-600">Processing stage:</p>
            <p className="mt-2 text-base font-semibold">{stageLabel}</p>
          </div>

          <p className="mt-6 text-sm font-semibold sm:mt-8">{Math.round(progressPercent)}%</p>

          <Progress value={progressPercent} className="mt-3 h-3 bg-gray-200 [&>div]:bg-slate-950" />

          <p className="mt-5 text-sm text-gray-700">Analyzing document...</p>
        </div>
      </div>
    );
  }

  // Analysis failed screen
  if (analysisStatus && analysisStatus.status.includes('failed')) {
    return (
      <div className="flex w-full items-start justify-center px-3 pt-16 pb-6 sm:items-center sm:px-4 sm:pt-16 sm:pb-10">
        <div className="w-full max-w-2xl">
          <Card className="border border-red-300 bg-red-50 shadow-sm ring-0">
            <CardContent className="px-4 py-5 sm:px-8 sm:py-7">
              <h1 className="text-2xl font-bold text-red-900 sm:text-3xl">Analysis Failed</h1>

              <div className="mt-6 rounded-xl border border-red-300 bg-white p-6">
                <p className="text-red-700 text-sm mb-2"><strong>Stage:</strong> {analysisStatus.processing_stage}</p>
                <p className="text-red-700">{analysisStatus.error_message || 'Unknown error occurred'}</p>
              </div>

              <Button
                onClick={() => {
                  setSelectedAnalysisId(null);
                  setSelectedDocId('');
                }}
                className="mt-6 w-full bg-red-600 text-white hover:bg-red-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="flex w-full items-start justify-center px-2 pt-16 pb-4 sm:items-center sm:px-4 sm:pt-12 sm:pb-6">
      <Card className="w-full max-w-3xl border border-[#E5E5E5] bg-[#F5F5F5] shadow-sm ring-0">
        <CardContent className="px-4 py-5 sm:px-8 sm:py-7 lg:px-16 lg:py-9">
          <h1 className="text-center text-2xl font-bold text-[#111111] sm:text-3xl lg:text-4xl">
            Document Analysis
          </h1>

          {/* Upload section */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mx-auto mt-5 flex w-full max-w-sm flex-col items-center rounded-xl border border-dashed border-black bg-white px-6 py-6 text-center sm:mt-8 sm:px-10 sm:py-10 lg:mt-10"
          >
            <svg className="mb-3 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm font-semibold text-[#111111] sm:text-base">
              Click to browse or drag files here
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleInputChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 rounded-lg bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Select Files
            </button>
          </div>

          {errorMessage && (
            <div className="mx-auto mt-4 w-full max-w-sm rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {fileEntries.length > 0 && (
            <>
              <div className="mx-auto mt-6 w-full max-w-sm">
                <p className="text-sm font-semibold text-[#111111]">
                  {fileEntries.length} file{fileEntries.length !== 1 ? 's' : ''} selected
                </p>
                <p className="mt-1 text-sm text-gray-600">{getTotalFileSize(selectedFiles)}</p>

                <div className="mt-4 space-y-2">
                  {fileEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-[#E5E5E5] bg-white p-3"
                    >
                      <span className="text-sm text-gray-700">{entry.file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(entry.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleStartAnalysis}
                  disabled={isPending}
                  className="mt-6 w-full max-w-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isPending ? 'Processing...' : 'Analyze Documents'}
                </Button>
              </div>
            </>
          )}

          {/* Document select section - only show if documents available */}
          {documents.length > 0 && (
            <div className="mx-auto mt-12 w-full max-w-sm">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-full h-px bg-[#E5E5E5]"></div>
                <div className="relative bg-[#F5F5F5] px-4 py-2">
                  <span className="text-sm font-semibold text-gray-500">or</span>
                </div>
              </div>

              <div className="mt-6"></div>

              <label className="block text-sm font-semibold text-[#111111] mb-2">
                Select Document
              </label>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger className="w-full border border-[#333] bg-white text-[#111111]">
                  <SelectValue placeholder={docsLoading ? 'Loading documents...' : 'Choose a document'} />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-72 overflow-y-auto">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      ref={index === documents.length - 1 ? lastDocumentRef : null}
                    >
                      <SelectItem
                        value={doc.id}
                        className="hover:bg-gray-100 cursor-pointer"
                      >
                        {doc.original_filename}
                      </SelectItem>
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {analysisError && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {analysisError}
                </div>
              )}

              <Button
                onClick={handleTriggerLegalAnalysis}
                disabled={!selectedDocId || isAnalyzing}
                className="mt-4 w-full bg-black text-white enabled:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Legal Analysis'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
