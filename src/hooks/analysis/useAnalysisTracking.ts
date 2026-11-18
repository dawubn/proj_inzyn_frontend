import { useQueries, type UseQueryOptions } from '@tanstack/react-query';

import { getAnalysisStatus } from '@/api/documents-wrapper';
import {
  isActiveStatus,
  isCancelledStatus,
  isCompletedStatus,
  isFailedStatus,
  isFinishedStatus,
  isQueuedStatus,
} from '@/lib/analysisStatus';

type AnalysisData = Awaited<ReturnType<typeof getAnalysisStatus>>;

type AnalysisQueryKey = readonly ['analysis-status', string];

type AnalysisQueryOptions = UseQueryOptions<AnalysisData, Error, AnalysisData, AnalysisQueryKey>;

export interface TrackedAnalysis {
  id: string;
  data: AnalysisData | undefined;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

const POLLING_INTERVAL_MS = 3000;

export function useAnalysisTracking(ids: readonly string[]) {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  const queryOptions: AnalysisQueryOptions[] = uniqueIds.map(
    (id): AnalysisQueryOptions => ({
      queryKey: ['analysis-status', id],
      queryFn: () => getAnalysisStatus(id),

      refetchInterval: (query) => {
        const analysis = query.state.data;

        if (isFinishedStatus(analysis?.status)) {
          return false;
        }

        return POLLING_INTERVAL_MS;
      },

      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      retry: 1,
    }),
  );

  const queries = useQueries({
    queries: queryOptions,
  });

  const items: TrackedAnalysis[] = queries.map((query, index) => ({
    id: uniqueIds[index]!,
    data: query.data,
    error: query.error,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
  }));

  const completedCount = items.filter((item) => isCompletedStatus(item.data?.status)).length;

  const failedCount = items.filter((item) => isFailedStatus(item.data?.status)).length;

  const cancelledCount = items.filter((item) => isCancelledStatus(item.data?.status)).length;

  const queuedCount = items.filter((item) => isQueuedStatus(item.data?.status)).length;

  // Aktywne = wszystko poza stanami końcowymi (wlicza queued).
  const activeCount = items.filter((item) => isActiveStatus(item.data?.status)).length;

  const allFinished =
    items.length > 0 && items.every((item) => isFinishedStatus(item.data?.status));

  const anyFailed = failedCount > 0;
  const anyCancelled = cancelledCount > 0;

  // Wszystkie ukończone pomyślnie (anulowane nie liczą się jako sukces).
  const allCompleted = allFinished && completedCount === items.length;

  const hasQueryErrors = items.some((item) => item.isError);
  const isLoading = items.some((item) => item.isLoading);
  const isFetching = items.some((item) => item.isFetching);

  async function refetchAll(): Promise<void> {
    await Promise.all(queries.map((query) => query.refetch()));
  }

  return {
    items,
    totalCount: items.length,
    completedCount,
    failedCount,
    cancelledCount,
    queuedCount,
    activeCount,
    allFinished,
    allCompleted,
    anyFailed,
    anyCancelled,
    hasQueryErrors,
    isLoading,
    isFetching,
    refetchAll,
  };
}
