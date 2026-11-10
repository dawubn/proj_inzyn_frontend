//src/hooks/analysis/useDocumentAnalysis.ts

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadDocument, startDocumentAnalysis } from '@/api/documents-wrapper';

import { createDocumentSubmission } from '@/lib/analysisSubmission';

export function useDocumentAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [submit] = useState(() =>
    createDocumentSubmission({ upload: uploadDocument, start: startDocumentAnalysis }),
  );

  const mutation = useMutation({
    mutationFn: async ({ files, documentType }: { files: File[]; documentType: string }) => {
      const progressInterval = window.setInterval(() => {
        setProgress((current) => (current >= 85 ? current : current + 5));
      }, 300);

      try {
        return await submit(files, documentType);
      } finally {
        window.clearInterval(progressInterval);
      }
    },
    onMutate: () => {
      setIsProcessing(true);
      setProgress(0);
    },
    onSuccess: () => {
      setProgress(100);
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
      setProgress(0);
    },
  });

  return {
    isProcessing,
    progress,
    isPending: mutation.isPending,
    startAnalysis: mutation.mutate,
    analysisId: mutation.data?.id || null,
  };
}
