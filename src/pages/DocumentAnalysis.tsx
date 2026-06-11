import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadDocument, startDocumentAnalysis } from '@/api/documentApi/documentApi';
import {
  formatFileSize,
  getTotalFileSize,
  validateFiles,
} from '@/api/documentApi/documentApi.Service';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('automatic');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleFiles(files: File[]) {
    const validationError = validateFiles(files);
    setErrorMessage('');

    if (validationError) {
      setSelectedFiles([]);
      setErrorMessage(validationError);
      return;
    }

    setSelectedFiles(files);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      handleFiles(files);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) {
      handleFiles(files);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  const startAnalysisMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const progressInterval = window.setInterval(() => {
        setProgress((current) => (current >= 85 ? current : current + 5));
      }, 300);

      try {
        for (const file of files) {
          const uploadedDocument = await uploadDocument(file);
          await startDocumentAnalysis(uploadedDocument.id);
        }
      } finally {
        window.clearInterval(progressInterval);
      }
    },
    onMutate: () => {
      setIsProcessing(true);
      setProgress(0);
      setErrorMessage('');
    },
    onSuccess: async () => {
      setProgress(100);
      await queryClient.invalidateQueries({ queryKey: ['recentDocuments'] });
      await queryClient.invalidateQueries({ queryKey: ['documentsFromLast7Days'] });
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error(error);
      setErrorMessage('Something went wrong while processing the documents.');
      setIsProcessing(false);
      setProgress(0);
    },
  });

  function handleStartAnalysis() {
    if (selectedFiles.length === 0) {
      setErrorMessage('Select at least one document first.');
      return;
    }

    startAnalysisMutation.mutate(selectedFiles);
  }

  if (isProcessing && selectedFiles.length > 0) {
    return (
      <div className="flex w-full items-start justify-center px-3 pt-16 pb-6 sm:items-center sm:px-4 sm:pt-16 sm:pb-10">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">Document Processing</h1>

          <div className="mx-auto mt-6 rounded-xl border border-[#E5E5E5] bg-white px-6 py-4 sm:mt-10 sm:px-8 sm:py-5">
            <p className="text-base font-bold sm:text-xl">{selectedFiles.length} selected files</p>
            <p className="text-base font-bold sm:text-xl">{getTotalFileSize(selectedFiles)}</p>
          </div>

          <p className="mt-6 text-sm font-semibold sm:mt-8">{progress}%</p>

          <Progress value={progress} className="mt-3 h-3 bg-gray-200 [&>div]:bg-slate-950" />

          <p className="mt-5 text-sm text-gray-700">Your documents are being analyzed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-center px-2 pt-16 pb-4 sm:items-center sm:px-4 sm:pt-12 sm:pb-6">
      <Card className="w-full max-w-3xl border border-[#E5E5E5] bg-[#F5F5F5] shadow-sm ring-0">
        <CardContent className="px-4 py-5 sm:px-8 sm:py-7 lg:px-16 lg:py-9">
          <h1 className="text-center text-2xl font-bold text-[#111111] sm:text-3xl lg:text-4xl">
            Upload Documents
          </h1>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mx-auto mt-5 flex w-full max-w-sm flex-col items-center rounded-xl border border-dashed border-black bg-white px-6 py-6 text-center sm:mt-8 sm:px-10 sm:py-10 lg:mt-10"
          >
            <p className="text-base font-bold sm:text-lg">
              Drag the files here
              <br />
              or
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-40 cursor-pointer bg-slate-950 text-white hover:bg-slate-900"
              >
                [Select files]
              </Button>
            </div>
          </div>

          <p className="mt-2 text-center text-xs text-gray-600 sm:text-sm">
            Supported formats: PDF, JPG, PNG
          </p>

          {selectedFiles.length > 0 && (
            <div className="mx-auto mt-4 w-full max-w-sm rounded-lg border border-[#E5E5E5] bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  Selected files ({selectedFiles.length})
                </p>
                <p className="text-xs text-gray-500">{getTotalFileSize(selectedFiles)}</p>
              </div>

              <div className="mt-2 max-h-32 space-y-1.5 overflow-y-auto pr-1 sm:max-h-40">
                {selectedFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between gap-3 text-sm text-gray-600"
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="mt-3 text-center text-sm font-medium text-red-600">{errorMessage}</p>
          )}

          <div className="mx-auto mt-5 w-full max-w-sm sm:mt-8 lg:mt-10">
            <label className="text-sm font-medium">Select a Documents profile:</label>

            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger className="mt-2 w-full border border-[#E5E5E5] bg-white ring-0 focus:ring-0 [&_svg]:text-gray-400">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>

              <SelectContent
                className="border border-[#E5E5E5] bg-white shadow-lg ring-0"
                position="popper"
              >
                <SelectItem value="automatic" className="cursor-pointer focus:bg-gray-100">
                  Automatic Recognition
                </SelectItem>
                <SelectItem value="invoice" className="cursor-pointer focus:bg-gray-100">
                  Invoice
                </SelectItem>
                <SelectItem value="contract" className="cursor-pointer focus:bg-gray-100">
                  Contract
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            disabled={selectedFiles.length === 0 || startAnalysisMutation.isPending}
            onClick={handleStartAnalysis}
            className="mx-auto mt-6 flex h-11 w-full max-w-sm cursor-pointer bg-slate-950 text-sm font-bold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-10 sm:h-12 sm:text-base lg:mt-12"
          >
            Start your analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
