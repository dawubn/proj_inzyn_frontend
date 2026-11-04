import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAnalysis } from '@/api/documents-wrapper';
import type { DocumentAnalysisResponse } from '@/api/generated/model';

export function useCancelAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<DocumentAnalysisResponse, Error, string>({
    mutationFn: cancelAnalysis,

    onSuccess: (_data, analysisId) => {
      void queryClient.invalidateQueries({ queryKey: ['analysis-status', analysisId] });
      void queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['recent-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['documents-last-7-days'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-analyses'] });
    },
  });
}
