import { getDocumentTypeLabel } from '@/api/documents-wrapper';
import type { DocumentAnalysisResponse } from '@/api/generated/model';
import { Button } from '@/components/ui/button';
import { isCancelledStatus, isCompletedStatus, isFailedStatus } from '@/lib/analysisStatus';

import { Dots, ProgressBar, StatusVisual, StepTracker, type VisualKind } from './ProcessingParts';
import {
  getProcessingSteps,
  getProgressRange,
  getStageTitle,
  isWaitingStatus,
} from './processingModel';
import { useCreepingProgress } from './useCreepingProgress';

type ProcessingHeroProps = {
  analysis: DocumentAnalysisResponse | undefined;
  fileName: string;
  analysisId: string;
  queuePosition: number | null;
  statusError: boolean;
  /** The only analysis on the page finished and its results are about to open */
  openingResults: boolean;
  cancelling: boolean;
  onCancel: (() => void) | null;
  onViewResults: () => void;
  onTryAgain: () => void;
  transitionName: string;
};

const CARD_BORDER: Record<VisualKind, string> = {
  loading: 'border-[#E5E5E5]',
  running: 'border-[#E5E5E5]',
  queued: 'border-amber-300',
  completed: 'border-lime-300',
  failed: 'border-red-300',
  cancelled: 'border-gray-300',
};

function visualKind(analysis: DocumentAnalysisResponse | undefined): VisualKind {
  const status = analysis?.status;
  if (!status) return 'loading';
  if (isCompletedStatus(status)) return 'completed';
  if (isFailedStatus(status)) return 'failed';
  if (isCancelledStatus(status)) return 'cancelled';
  if (status === 'queued') return 'queued';
  return 'running';
}

/** The analysis on top of the processing page, shown large with its progress. */
export function ProcessingHero({
  analysis,
  fileName,
  analysisId,
  queuePosition,
  statusError,
  openingResults,
  cancelling,
  onCancel,
  onViewResults,
  onTryAgain,
  transitionName,
}: ProcessingHeroProps) {
  const kind = visualKind(analysis);
  // Widened: the generated type does not list every backend status (e.g. cancelling)
  const status: string | undefined = analysis?.status;
  const running = kind === 'running' && status !== 'cancelling';

  const range = getProgressRange(analysis);
  const progress = useCreepingProgress(range.from, range.to, running);
  const percent = Math.round(progress);

  const stageLabel =
    kind === 'loading'
      ? statusError
        ? 'Status unavailable'
        : 'Loading current status'
      : kind === 'queued'
        ? 'In queue'
        : kind === 'completed'
          ? 'Completed'
          : kind === 'failed'
            ? getStageTitle(analysis?.processing_stage)
            : status === 'cancelling'
              ? 'Cancelling'
              : getStageTitle(analysis?.processing_stage);

  const detectedType = analysis?.detected_document_type;
  const confidence = analysis?.classification_confidence;
  const showDetectedType = !!detectedType && detectedType !== 'unknown';
  const showProgress = kind === 'running' || kind === 'completed' || kind === 'loading';

  return (
    <div className="w-full" style={{ viewTransitionName: transitionName }}>
      <article
        aria-label={`${fileName}, ID ${analysisId.slice(0, 8)}`}
        className={`rounded-xl border bg-white px-3 py-6 text-center shadow-sm transition-colors duration-500 sm:px-8 ${CARD_BORDER[kind]}`}
      >
        <p title={`${fileName} ID ${analysisId}`} className="truncate text-xs text-gray-500">
          {fileName} <span className="text-gray-400">· ID {analysisId.slice(0, 8)}</span>
        </p>

        <div className="mt-3">
          <StatusVisual kind={kind} />
        </div>

        <div aria-live="polite">
          <p className="mt-3 text-sm text-gray-600">
            {kind === 'failed' ? 'Failed at:' : 'Processing stage:'}
          </p>
          <p
            key={stageLabel}
            className={`mt-1 animate-in text-base font-semibold fade-in slide-in-from-bottom-1 duration-300 ${
              kind === 'failed'
                ? 'text-red-800'
                : kind === 'completed'
                  ? 'text-lime-700'
                  : kind === 'queued'
                    ? 'text-amber-700'
                    : 'text-gray-900'
            }`}
          >
            {stageLabel}
          </p>
        </div>

        {showDetectedType && kind !== 'failed' && (
          <div className="mt-3 inline-flex animate-in rounded-lg bg-gray-50 px-4 py-2 text-sm fade-in duration-500">
            <span className="text-gray-500">Detected type:&nbsp;</span>
            <span className="font-semibold text-gray-900">
              {getDocumentTypeLabel(detectedType)}
            </span>
            {confidence != null && Number.isFinite(confidence) && (
              <span className="ml-1 text-gray-400">({Math.round(confidence * 100)}%)</span>
            )}
          </div>
        )}

        {kind === 'queued' && (
          <p className="mt-2 text-sm text-gray-500">
            {queuePosition ? `Position ${queuePosition} in the queue. ` : ''}
            It starts automatically when the analyses before it finish.
          </p>
        )}

        {kind === 'failed' && (
          <div
            role="alert"
            className="mt-3 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm break-words text-red-700 [overflow-wrap:anywhere]"
          >
            {analysis?.error_message || 'Unknown error occurred.'}
          </div>
        )}

        {kind === 'cancelled' && (
          <p className="mt-2 text-sm text-gray-600">This analysis was cancelled.</p>
        )}

        {statusError && (
          <p className="mt-3 text-sm text-amber-800">
            Could not retrieve the latest status.
            {analysis ? ' The last available status is shown.' : ''}
          </p>
        )}

        <div className="mt-6">
          <StepTracker steps={getProcessingSteps(analysis)} />
        </div>
      </article>

      {showProgress && (
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold tabular-nums">{kind === 'loading' ? 0 : percent}%</p>
          <div className="mt-3">
            <ProgressBar
              value={kind === 'loading' ? 0 : progress}
              running={running}
              completed={kind === 'completed'}
              label={`${fileName}: processing progress`}
            />
          </div>
          <p className="mt-4 text-sm text-gray-700">
            {kind === 'completed' ? (
              openingResults ? (
                <>
                  Analysis completed. Opening results
                  <Dots />
                </>
              ) : (
                'Analysis completed'
              )
            ) : status === 'cancelling' ? (
              <>
                Cancelling
                <Dots />
              </>
            ) : isWaitingStatus(status) ? (
              <>
                Starting analysis
                <Dots />
              </>
            ) : (
              <>
                Analyzing document
                <Dots />
              </>
            )}
          </p>
        </div>
      )}

      {(onCancel || kind === 'completed' || kind === 'failed') && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={cancelling}
              onClick={onCancel}
              className="h-10 rounded-lg border-[#e7caca] bg-white px-4 text-sm text-[#a33636] hover:bg-[#fff3f3]"
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
          {kind === 'completed' && !openingResults && (
            <Button
              type="button"
              onClick={onViewResults}
              className="h-10 rounded-lg bg-[#171717] px-4 text-sm text-white hover:bg-[#2A2A2A]"
            >
              View results
            </Button>
          )}
          {kind === 'failed' && (
            <Button
              type="button"
              onClick={onTryAgain}
              className="h-10 rounded-lg bg-[#171717] px-4 text-sm text-white hover:bg-[#2A2A2A]"
            >
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
