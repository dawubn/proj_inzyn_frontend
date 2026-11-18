export const STAGE_LABELS: Record<string, string> = {
  pending: 'Starting analysis',
  local_ocr: 'Local OCR',
  redaction: 'Redaction',
  azure_ocr: 'Azure OCR',
  llm_analysis: 'Legal Analysis',
  completed: 'Completed',
};

export const WAITING_LABEL = 'Waiting for analysis';
export const CANCELLED_LABEL = 'Cancelled';

const TOTAL_STEPS = 4;
const MAX_RUNNING_PERCENT = 95;

export const isFailedStatus = (status?: string | null): boolean =>
  !!status && status.toLowerCase().includes('failed');

export const isCompletedStatus = (status?: string | null): boolean => status === 'completed';

export const isQueuedStatus = (status?: string | null): boolean => status === 'queued';

export const isCancelledStatus = (status?: string | null): boolean => status === 'cancelled';

// Terminal state = completed / failed / cancelled
export const isFinishedStatus = (status?: string | null): boolean =>
  isFailedStatus(status) || isCompletedStatus(status) || isCancelledStatus(status);

// In progress = everything except terminal states
// (queued, pending, in_progress, ocr_in_progress, ocr_completed, classifying, validating).
export const isActiveStatus = (status?: string | null): boolean =>
  !!status && !isFinishedStatus(status);

// An analysis that can be cancelled (waiting or in progress).
export const isCancellableStatus = (status?: string | null): boolean => isActiveStatus(status);

export const getStageLabel = (stage?: string | null): string =>
  stage ? (STAGE_LABELS[stage] ?? stage) : 'Preparing...';

// User-facing label that takes the status into account (queued / cancelled take precedence over the stage).
export const getStatusLabel = (status?: string | null, stage?: string | null): string => {
  if (isQueuedStatus(status)) return WAITING_LABEL;
  if (isCancelledStatus(status)) return CANCELLED_LABEL;
  return getStageLabel(stage);
};

export interface AnalysisStatusConfig {
  label: string;
  // Text color class (Dashboard, Processing queue list)
  color: string;
  // Badge classes (History)
  className: string;
}

// Single source of truth for the status shown in Dashboard, History and the Processing queue list.
// Any non-terminal status that is not queued / cancelling is shown as "Processing",
// so new backend statuses never end up as "Unknown status".
export const getAnalysisStatusConfig = (status?: string | null): AnalysisStatusConfig => {
  if (!status) {
    return {
      label: 'Loading...',
      color: 'text-gray-500',
      className: 'bg-gray-200 text-gray-600',
    };
  }

  if (status === 'cancelling') {
    return {
      label: 'Cancelling processing...',
      color: 'text-amber-700',
      className: 'bg-amber-100 text-amber-800',
    };
  }

  if (isCancelledStatus(status)) {
    return {
      label: 'Processing cancelled',
      color: 'text-gray-500',
      className: 'bg-gray-200 text-gray-600',
    };
  }

  if (isQueuedStatus(status) || status === 'pending') {
    return {
      label: WAITING_LABEL,
      color: 'text-amber-700',
      className: 'bg-amber-100 text-amber-800',
    };
  }

  if (isFailedStatus(status)) {
    return {
      label: 'Processing failed',
      color: 'text-red-700',
      className: 'bg-red-100 text-red-800',
    };
  }

  if (isCompletedStatus(status)) {
    return {
      label: 'Completed',
      color: 'text-lime-700',
      className: 'bg-lime-600 text-white',
    };
  }

  return {
    label: 'Processing',
    color: 'text-sky-700',
    className: 'bg-sky-600 text-white',
  };
};

export const getProgressPercent = (
  analysis?: { status?: string | null; processing_step?: number | null } | null,
): number => {
  if (!analysis) return 0;
  if (isCompletedStatus(analysis.status)) return 100;
  if (isQueuedStatus(analysis.status) || isCancelledStatus(analysis.status)) return 0;
  if (!analysis.processing_step) return 0;
  return Math.min(Math.round((analysis.processing_step / TOTAL_STEPS) * 100), MAX_RUNNING_PERCENT);
};

export const PROCESSING_ROUTE = '/document-analysis/processing';

export const processingUrl = (ids: string[]): string =>
  `${PROCESSING_ROUTE}?ids=${ids.map(encodeURIComponent).join(',')}`;

export const parseProcessingIds = (raw: string | null): string[] =>
  (raw ?? '').split(',').map(decodeURIComponent).filter(Boolean);
