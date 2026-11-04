import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getSeverityConfig } from './severity';
import type { ViewerIssue } from './types';

interface IssueDetailsProps {
  issue: ViewerIssue;
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

function locationNote(issue: ViewerIssue): string | null {
  const hasLocation = !!issue.locations?.length;
  if (issue.kind === 'placeholder') return 'This field in the document has not been filled in.';
  if (issue.kind === 'expected') {
    return hasLocation
      ? 'Missing element. The outline marks where it is usually placed.'
      : 'Missing element. It is usually found on this page.';
  }
  return hasLocation ? null : 'The referenced text could not be located on the page.';
}

/** Details of the selected issue: shown in the highlight popover (desktop) or a bottom card (mobile). */
export function IssueDetails({
  issue,
  position,
  total,
  onPrevious,
  onNext,
  onClose,
}: IssueDetailsProps) {
  const config = getSeverityConfig(issue.severity);
  const page = issue.locations?.[0]?.page ?? issue.page ?? null;
  const note = locationNote(issue);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`${config.badge} rounded px-2 py-0.5 text-xs font-medium`}>
            {issue.severity}
          </span>
          {page != null && <span className="text-xs text-gray-500">Page {page}</span>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <p className={`text-sm font-medium ${config.text}`}>{issue.issue}</p>
      {issue.text_reference && (
        <p className="border-l-2 border-gray-300 pl-2 text-xs text-gray-600 italic">
          {issue.text_reference}
        </p>
      )}
      {issue.rule_name && <p className="text-xs text-gray-600">{issue.rule_name}</p>}
      {note && <p className="text-xs text-gray-500">{note}</p>}

      {total > 1 && (
        <div className="mt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs text-gray-500">
            {position} / {total}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
