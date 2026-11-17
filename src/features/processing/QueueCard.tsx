import { Ban, CheckCircle2, ChevronRight, Hourglass, XCircle } from 'lucide-react';

import type { DocumentAnalysisResponse } from '@/api/generated/model';
import {
  getProgressPercent,
  isCancelledStatus,
  isCompletedStatus,
  isFailedStatus,
} from '@/lib/analysisStatus';

import { ProgressBar } from './ProcessingParts';
import { isWaitingStatus } from './processingModel';

type QueueCardProps = {
  analysis: DocumentAnalysisResponse | undefined;
  fileName: string;
  analysisId: string;
  queuePosition: number | null;
  onSelect: () => void;
  transitionName: string;
};

function describe(status: string | undefined, queuePosition: number | null, percent: number) {
  if (!status) {
    return { text: 'Loading', pill: 'bg-gray-100 text-gray-600', icon: 'spinner' as const };
  }
  if (isCompletedStatus(status)) {
    return { text: 'Completed', pill: 'bg-lime-100 text-lime-800', icon: 'done' as const };
  }
  if (isFailedStatus(status)) {
    return { text: 'Failed', pill: 'bg-red-100 text-red-800', icon: 'failed' as const };
  }
  if (isCancelledStatus(status)) {
    return { text: 'Cancelled', pill: 'bg-gray-100 text-gray-600', icon: 'cancelled' as const };
  }
  if (status === 'queued') {
    return {
      text: queuePosition ? `In queue · #${queuePosition}` : 'In queue',
      pill: 'bg-amber-100 text-amber-800',
      icon: 'queued' as const,
    };
  }
  if (status === 'cancelling') {
    return { text: 'Cancelling', pill: 'bg-amber-100 text-amber-800', icon: 'spinner' as const };
  }
  if (isWaitingStatus(status)) {
    return { text: 'Starting', pill: 'bg-sky-100 text-sky-800', icon: 'spinner' as const };
  }
  return {
    text: `Processing · ${percent}%`,
    pill: 'bg-sky-100 text-sky-800',
    icon: 'spinner' as const,
  };
}

function CardIcon({ icon }: { icon: ReturnType<typeof describe>['icon'] }) {
  const base = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full';
  switch (icon) {
    case 'done':
      return (
        <span className={`${base} bg-lime-50 text-lime-600`}>
          <CheckCircle2 size={18} aria-hidden />
        </span>
      );
    case 'failed':
      return (
        <span className={`${base} bg-red-50 text-red-600`}>
          <XCircle size={18} aria-hidden />
        </span>
      );
    case 'cancelled':
      return (
        <span className={`${base} bg-gray-100 text-gray-500`}>
          <Ban size={16} aria-hidden />
        </span>
      );
    case 'queued':
      return (
        <span className={`${base} bg-amber-50 text-amber-600`}>
          <Hourglass size={16} aria-hidden />
        </span>
      );
    default:
      return (
        <span className={`${base} relative bg-gray-50`}>
          <span
            aria-hidden
            className="absolute inset-1.5 animate-spin rounded-full border-2 border-[#171717] border-t-transparent border-r-transparent"
          />
        </span>
      );
  }
}

/** Smaller card of an analysis waiting below the one on top; clicking it brings it up. */
export function QueueCard({
  analysis,
  fileName,
  analysisId,
  queuePosition,
  onSelect,
  transitionName,
}: QueueCardProps) {
  // Widened: the generated type does not list every backend status (e.g. cancelling)
  const status: string | undefined = analysis?.status;
  const percent = getProgressPercent(analysis);
  const info = describe(status, queuePosition, percent);
  const running =
    !!status && info.icon === 'spinner' && !isWaitingStatus(status) && status !== 'cancelling';

  return (
    <li style={{ viewTransitionName: transitionName }}>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Show ${fileName}, ${info.text}`}
        className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white px-3 py-2.5 text-left shadow-xs transition hover:-translate-y-px hover:border-gray-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
      >
        <CardIcon icon={info.icon} />

        <div className="min-w-0 flex-1">
          <p
            title={`${fileName} ID ${analysisId}`}
            className="truncate text-sm font-medium text-gray-900"
          >
            {fileName}
          </p>
          {running ? (
            <div className="mt-1.5">
              <ProgressBar
                value={percent}
                running
                completed={false}
                size="sm"
                label={`${fileName}: processing progress`}
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500">ID {analysisId.slice(0, 8)}</p>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${info.pill}`}
        >
          {info.text}
        </span>
        <ChevronRight
          size={16}
          aria-hidden
          className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500"
        />
      </button>
    </li>
  );
}
