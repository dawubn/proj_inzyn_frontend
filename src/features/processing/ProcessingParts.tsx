import { Ban, Check, Hourglass, Minus, X } from 'lucide-react';

import type { ProcessingStep } from './processingModel';

export type VisualKind = 'loading' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Animated three dots after a status text. */
export function Dots() {
  return (
    <span aria-hidden className="inline-flex w-4">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          className="animate-processing-dot"
          style={{ animationDelay: `${delay}s` }}
        >
          .
        </span>
      ))}
    </span>
  );
}

function ScanningDocument() {
  return (
    <div className="relative h-14 w-11 overflow-hidden rounded-[5px]">
      <svg viewBox="0 0 44 56" className="h-full w-full" aria-hidden>
        <path
          d="M5 1.5h24.5L42.5 14.5V52a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 52V4A2.5 2.5 0 0 1 5 1.5Z"
          className="fill-white stroke-[#171717]"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M29.5 1.5V12a2.5 2.5 0 0 0 2.5 2.5h10.5"
          className="fill-none stroke-[#171717]"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {[
          { y: 22, w: 26 },
          { y: 29, w: 30 },
          { y: 36, w: 22 },
          { y: 43, w: 28 },
        ].map((line, index) => (
          <rect
            key={line.y}
            x="8"
            y={line.y}
            width={line.w}
            height="3"
            rx="1.5"
            className="animate-processing-line fill-gray-300"
            style={{ animationDelay: `${index * 0.25}s` }}
          />
        ))}
      </svg>
      <span
        aria-hidden
        className="animate-processing-scan absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-transparent via-sky-500/45 to-transparent"
      />
    </div>
  );
}

/** Large illustration at the top of the current analysis card. */
export function StatusVisual({ kind }: { kind: VisualKind }) {
  if (kind === 'loading' || kind === 'running') {
    return (
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden
          className="animate-processing-halo absolute inset-3 rounded-full bg-gray-200"
        />
        <span
          aria-hidden
          className="animate-processing-halo absolute inset-3 rounded-full bg-gray-200"
          style={{ animationDelay: '1.1s' }}
        />
        <span aria-hidden className="absolute inset-4 rounded-full bg-gray-100" />
        <div className="relative">
          <ScanningDocument />
        </div>
      </div>
    );
  }

  if (kind === 'queued') {
    return (
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden
          className="animate-processing-halo absolute inset-4 rounded-full bg-amber-100"
        />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
          <Hourglass size={26} aria-hidden className="animate-pulse" />
        </span>
      </div>
    );
  }

  if (kind === 'completed') {
    return (
      <div className="mx-auto flex h-24 w-24 items-center justify-center">
        <span className="flex h-16 w-16 animate-in items-center justify-center rounded-full bg-lime-600 shadow-[0_0_0_8px_rgb(101_163_13/0.12)] zoom-in-50 duration-300">
          <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              className="animate-processing-check fill-none stroke-white"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    );
  }

  if (kind === 'failed') {
    return (
      <div className="mx-auto flex h-24 w-24 items-center justify-center">
        <span className="flex h-16 w-16 animate-in items-center justify-center rounded-full bg-red-100 text-red-600 zoom-in-50 duration-300">
          <X size={30} aria-hidden />
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Ban size={28} aria-hidden />
      </span>
    </div>
  );
}

const STEP_STATE_TEXT: Record<ProcessingStep['state'], string> = {
  done: 'done',
  active: 'in progress',
  upcoming: 'not started',
  skipped: 'skipped',
  failed: 'failed',
};

function StepCircle({ state }: { state: ProcessingStep['state'] }) {
  const base = 'relative z-10 flex h-7 w-7 items-center justify-center rounded-full';
  switch (state) {
    case 'done':
      return (
        <span className={`${base} animate-in bg-[#171717] text-white zoom-in-75 duration-300`}>
          <Check size={14} strokeWidth={3} aria-hidden />
        </span>
      );
    case 'active':
      return (
        <span className={`${base} border-2 border-gray-200 bg-white`}>
          <span
            aria-hidden
            className="absolute -inset-0.5 animate-spin rounded-full border-2 border-[#171717] border-t-transparent border-r-transparent"
          />
          <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-[#171717]" />
        </span>
      );
    case 'skipped':
      return (
        <span className={`${base} border-2 border-dashed border-gray-300 bg-white text-gray-400`}>
          <Minus size={12} strokeWidth={3} aria-hidden />
        </span>
      );
    case 'failed':
      return (
        <span className={`${base} bg-red-600 text-white`}>
          <X size={14} strokeWidth={3} aria-hidden />
        </span>
      );
    default:
      return <span className={`${base} border-2 border-gray-200 bg-white`} />;
  }
}

/** The pipeline steps as a horizontal tracker. */
export function StepTracker({ steps }: { steps: ProcessingStep[] }) {
  return (
    <ol lang="en" className="grid grid-cols-4" aria-label="Processing steps">
      {steps.map((step, index) => {
        const reached = step.state !== 'upcoming';
        return (
          <li
            key={step.key}
            className="relative flex min-w-0 flex-col items-center px-1 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden
                className={`absolute top-3.5 right-1/2 h-0.5 w-full -translate-y-1/2 transition-colors duration-500 ${
                  reached && step.state !== 'skipped' ? 'bg-[#171717]' : 'bg-gray-200'
                }`}
              />
            )}
            <StepCircle state={step.state} />
            <span
              className={`mt-1.5 max-w-full text-[10px] leading-tight hyphens-manual sm:text-[11px] ${
                step.state === 'active'
                  ? 'font-semibold text-gray-900'
                  : step.state === 'failed'
                    ? 'font-semibold text-red-700'
                    : step.state === 'skipped'
                      ? 'text-gray-400'
                      : 'text-gray-600'
              }`}
            >
              {step.label}
              {step.state === 'skipped' && <span className="block text-[10px]">Skipped</span>}
              <span className="sr-only">: {STEP_STATE_TEXT[step.state]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Progress bar with moving stripes while the analysis runs. */
export function ProgressBar({
  value,
  running,
  completed,
  label,
  size = 'lg',
}: {
  value: number;
  running: boolean;
  completed: boolean;
  label: string;
  size?: 'lg' | 'sm';
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={`relative w-full overflow-hidden rounded-full bg-gray-200 ${size === 'lg' ? 'h-3' : 'h-1'}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${
          completed ? 'bg-lime-600' : 'bg-[#171717]'
        } ${running ? 'animate-processing-stripes' : ''}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
