// Pure logic of the processing page: which analysis is shown on top, its steps and progress.
import type { AnalysisOptions } from '@/api/generated/model';

import {
  isActiveStatus,
  isCompletedStatus,
  isFailedStatus,
  isFinishedStatus,
  isQueuedStatus,
} from '../../lib/analysisStatus.ts';

export type StepState = 'done' | 'active' | 'upcoming' | 'skipped' | 'failed';

export interface ProcessingStep {
  key: string;
  label: string;
  state: StepState;
}

export interface StepSource {
  status?: string | null;
  processing_step?: number | null;
  options?: AnalysisOptions | null;
}

const STEPS = [
  { key: 'local_ocr', label: 'Local OCR' },
  // Soft hyphen: breaks as Anonymi-zation only when the column is too narrow
  { key: 'redaction', label: 'Anonymi\u00ADzation' },
  { key: 'azure_ocr', label: 'Azure OCR' },
  { key: 'llm_analysis', label: 'Legal analysis' },
] as const;

const STAGE_TITLES: Record<string, string> = {
  pending: 'Starting analysis',
  local_ocr: 'Local OCR',
  redaction: 'Anonymization',
  azure_ocr: 'Azure OCR',
  llm_analysis: 'Legal analysis',
  completed: 'Completed',
};

/** Name of a processing stage, the same as in the step tracker. */
export const getStageTitle = (stage?: string | null): string =>
  stage ? (STAGE_TITLES[stage] ?? stage) : 'Preparing';

const STEP_PERCENT = 100 / STEPS.length;
const MAX_RUNNING_PERCENT = 95;

/** Waiting for a worker: queued behind other analyses or just picked up. */
export const isWaitingStatus = (status?: string | null): boolean =>
  isQueuedStatus(status) || status === 'pending';

/** Actually being processed right now. */
export const isRunningStatus = (status?: string | null): boolean =>
  isActiveStatus(status) && !isWaitingStatus(status);

function isSkipped(index: number, options?: AnalysisOptions | null): boolean {
  if (!options) return false;
  if (STEPS[index].key === 'redaction') return options.anonymization_enabled === false;
  if (STEPS[index].key === 'llm_analysis') return options.ai_analysis_enabled === false;
  return false;
}

/** The four pipeline steps with their state for the given analysis. */
export function getProcessingSteps(analysis: StepSource | undefined): ProcessingStep[] {
  const status = analysis?.status;
  const completed = isCompletedStatus(status);
  const failed = isFailedStatus(status);
  const waiting = !status || isWaitingStatus(status);
  // processing_step is 1-based: step n means stage n is in progress
  const current = waiting ? -1 : Math.max((analysis?.processing_step ?? 0) - 1, 0);

  return STEPS.map((step, index) => {
    let state: StepState;
    if (isSkipped(index, analysis?.options)) state = 'skipped';
    else if (completed || index < current) state = 'done';
    else if (index === current && failed) state = 'failed';
    else if (index === current && isActiveStatus(status)) state = 'active';
    else state = 'upcoming';
    return { key: step.key, label: step.label, state };
  });
}

/**
 * Progress range of the current step. The page fills the bar from `from` towards `to`
 * while the step runs, so a long step does not look frozen.
 */
export function getProgressRange(analysis: StepSource | undefined): { from: number; to: number } {
  const status = analysis?.status;
  if (isCompletedStatus(status)) return { from: 100, to: 100 };
  if (!status || isWaitingStatus(status)) return { from: 0, to: status === 'pending' ? 4 : 0 };

  const step = Math.min(Math.max(analysis?.processing_step ?? 0, 0), STEPS.length);
  const from = Math.max(step - 1, 0) * STEP_PERCENT;
  if (isFinishedStatus(status)) return { from, to: from };
  return { from, to: Math.min(Math.max(step, 1) * STEP_PERCENT, MAX_RUNNING_PERCENT) };
}

export interface HeroCandidate {
  id: string;
  status?: string | null;
}

/**
 * Analysis shown on top of the page. A pinned one (clicked by the user) and an unfinished
 * one stay; otherwise the analysis being processed moves up, then the next one waiting.
 * When everything is finished the last one shown stays.
 */
export function pickHeroId(
  items: readonly HeroCandidate[],
  currentId: string | null,
  pinnedId: string | null,
): string | null {
  const find = (id: string | null) => (id ? items.find((item) => item.id === id) : undefined);

  if (find(pinnedId)) return pinnedId;

  const current = find(currentId);
  if (current && (!current.status || isActiveStatus(current.status))) return currentId;

  const running = items.find((item) => isRunningStatus(item.status));
  if (running) return running.id;

  const waiting = items.find((item) => isActiveStatus(item.status));
  if (waiting) return waiting.id;

  if (current) return currentId;
  return items[0]?.id ?? null;
}
