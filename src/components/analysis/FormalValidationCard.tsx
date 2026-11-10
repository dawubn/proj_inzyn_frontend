import { useEffect, useRef } from 'react';
import type { AnalysisReportResponse } from '@/api/generated/model';
import { Card, CardContent } from '@/components/ui/card';
import { severityConfig } from '@/features/document-viewer/severity';
import {
  displayLabel,
  displayMessage,
  outcomeLabels,
  formalReportRows,
  type FormalCheck,
  type FormalRow,
} from '@/lib/formalMessages';

const statusLabels: Record<string, string> = {
  complete: 'All required checks passed. Review any additional notes below.',
  incomplete: 'Some information needs your attention.',
  indeterminate: 'Some items need a manual review.',
  unsupported: 'Checks are not yet available for this document type.',
};
function CheckResult({
  check,
  selected = false,
  hovered = false,
  onSelect,
  onHover,
  reducedMotion = false,
}: {
  check: FormalCheck;
  selected?: boolean;
  hovered?: boolean;
  onSelect?: () => void;
  onHover?: (hovered: boolean) => void;
  reducedMotion?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (selected)
      buttonRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
  }, [selected, reducedMotion]);
  const config =
    check.outcome === 'pass'
      ? {
          border: 'border-green-300',
          bg: 'bg-green-50',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800',
        }
      : check.outcome === 'not_applicable'
        ? severityConfig.low
        : check.outcome === 'fail' && check.severity === 'error'
          ? severityConfig.error
          : severityConfig.warning;
  const label = displayLabel(check.rule_name, check.field_name);
  return (
    <div
      className={`border-l-4 ${config.border} ${config.bg} p-3 rounded ${selected ? 'ring-2 ring-gray-900' : hovered ? 'brightness-95' : ''}`}
    >
      <button
        ref={buttonRef}
        type="button"
        data-issue-item
        disabled={!onSelect}
        aria-pressed={onSelect ? selected : undefined}
        onClick={onSelect}
        onMouseEnter={onHover ? () => onHover(true) : undefined}
        onMouseLeave={onHover ? () => onHover(false) : undefined}
        onFocus={onHover ? () => onHover(true) : undefined}
        onBlur={onHover ? () => onHover(false) : undefined}
        className="w-full text-left enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${config.text} text-sm`}>{label}</p>
          </div>
          <span
            className={`${config.badge} px-2 py-1 rounded text-xs font-medium whitespace-nowrap`}
          >
            {outcomeLabels[check.outcome] ?? 'Review'}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">{displayMessage(check)}</p>
      </button>
      {check.evidence?.length > 0 && (
        <details className="mt-2 text-xs text-gray-600">
          <summary className="cursor-pointer font-medium hover:text-gray-900">
            View document fragment
          </summary>
          <ul className="mt-2 space-y-2">
            {check.evidence.map((item, index) => (
              <li key={index} className="break-words rounded bg-white/60 p-2">
                <span className="font-medium">
                  {item.page ? `Page ${item.page}` : 'Document fragment'}
                </span>
                <blockquote className="mt-1 whitespace-pre-wrap">{item.text}</blockquote>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function FormalValidationCard({
  report,
  isLoading,
  selectedIssueIndex,
  hoveredIssueIndex,
  onSelectIssue,
  onHoverIssue,
  reducedMotion,
}: {
  report?: AnalysisReportResponse;
  isLoading: boolean;
  selectedIssueIndex?: number | null;
  hoveredIssueIndex?: number | null;
  onSelectIssue?: (index: number | null) => void;
  onHoverIssue?: (index: number | null) => void;
  reducedMotion?: boolean;
}) {
  const { summary, modern, rows, actionable, remaining } = formalReportRows(report);
  const renderCheck = ({ check, issueIndex }: FormalRow, index: number) => {
    return (
      <CheckResult
        key={`${check.rule_id}-${index}`}
        check={check}
        selected={issueIndex !== null && selectedIssueIndex === issueIndex}
        hovered={issueIndex !== null && hoveredIssueIndex === issueIndex}
        onSelect={
          issueIndex !== null && onSelectIssue
            ? () => onSelectIssue(selectedIssueIndex === issueIndex ? null : issueIndex)
            : undefined
        }
        onHover={
          issueIndex !== null && onHoverIssue
            ? (hovered) => onHoverIssue(hovered ? issueIndex : null)
            : undefined
        }
        reducedMotion={reducedMotion}
      />
    );
  };
  return (
    <Card className="border border-gray-200 bg-white shadow-none shrink-0 max-h-[28rem] flex flex-col min-h-0">
      <CardContent className="p-6 flex flex-col min-h-0">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">Document Completeness</h2>
        </div>
        <div className="space-y-3 overflow-y-auto min-h-0">
          {isLoading && <p className="text-sm text-gray-600">Loading results...</p>}
          {!isLoading && !report && (
            <p className="text-sm text-gray-600">Results are not available yet.</p>
          )}
          {report && modern && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {statusLabels[summary.validation_status ?? ''] ?? 'Results are unavailable.'}
                </p>
                {summary.validation_status !== 'unsupported' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Needs attention: {rows.filter(({ check }) => check.outcome === 'fail').length}
                    {' · '}Review:{' '}
                    {
                      rows.filter(({ check }) => ['unknown', 'error'].includes(check.outcome))
                        .length
                    }
                  </p>
                )}
              </div>
              {actionable.map(renderCheck)}
              {remaining.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Other checks ({remaining.length})
                  </summary>
                  <div className="mt-3 space-y-3">{remaining.map(renderCheck)}</div>
                </details>
              )}
            </>
          )}
          {report && !modern && (
            <>
              <p className="text-sm text-gray-600">
                This is an older report. Run the analysis again to see updated results.
              </p>
              {rows.length === 0 && (
                <p className="text-sm text-gray-600">No formal issues detected.</p>
              )}
              {rows.map(renderCheck)}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
