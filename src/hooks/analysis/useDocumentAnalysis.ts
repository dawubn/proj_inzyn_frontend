//src/hooks/analysis/useDocumentAnalysis.ts

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument, startDocumentAnalysis } from '@/api/documents-wrapper';

export function useDocumentAnalysis() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      // Fake progress capped at 85% — real completion is set to 100% in onSuccess
      // after query invalidation confirms backend processed the documents.
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
    },
    onSuccess: async () => {
      setProgress(100);
      await queryClient.invalidateQueries({ queryKey: ['recentDocuments'] });
      await queryClient.invalidateQueries({ queryKey: ['documentsFromLast7Days'] });
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error(error);
      setIsProcessing(false);
      setProgress(0);
    },
  });

  return {
    isProcessing,
    progress,
    isPending: mutation.isPending,
    startAnalysis: mutation.mutate,
  };
}
