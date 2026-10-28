import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAnalysis } from '@/api/documents-wrapper';

/** Lists that show analyses and must drop a deleted one. */
const ANALYSIS_LIST_QUERY_KEYS = [['dashboard-analyses'], ['analysis-history']];

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (analysisId) => deleteAnalysis(analysisId),
    onSuccess: async () => {
      await Promise.all(
        ANALYSIS_LIST_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });
}
