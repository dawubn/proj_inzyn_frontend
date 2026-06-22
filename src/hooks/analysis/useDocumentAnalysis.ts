//src/hooks/analysis/useDocumentAnalysis.ts

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadDocument, startDocumentAnalysis } from '@/api/documents-wrapper';

export function useDocumentAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      const progressInterval = window.setInterval(() => {
        setProgress((current) => (current >= 85 ? current : current + 5));
      }, 300);

      try {
        for (const file of files) {
          const uploadedDocument = await uploadDocument(file);
          const result = await startDocumentAnalysis(uploadedDocument.id);
          window.clearInterval(progressInterval);
          return result; // Return analysis_id
        }
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
