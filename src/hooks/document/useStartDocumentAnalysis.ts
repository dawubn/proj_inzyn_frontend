// src/hooks/documents/useStartDocumentAnalysis.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AnalysisResponse } from '@/api/documentApi/documentApi.types';
import { startDocumentAnalysis } from '@/api/documentApi/documentApi';

export function useStartDocumentAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<AnalysisResponse, Error, string>({
    mutationFn: (documentId) => startDocumentAnalysis(documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['documents-last-7-days'] });
    },
  });
}
