import { displayLabel, displayMessage, normalizeValidationIssue } from '@/lib/formalMessages';
import type { ValidationIssue } from '@/api/generated/model';
import type { HighlightKind, LegalIssue, NormalizedRect, ViewerIssue } from './types';

interface FormalIssueLocation {
  kind: 'placeholder' | 'expected' | 'page';
  page: number;
  rects: NormalizedRect[];
}

export function aiToViewerIssue(issue: LegalIssue): ViewerIssue {
  return { ...issue, source: 'ai', kind: 'text' };
}

export function formalToViewerIssue(issue: ValidationIssue): ViewerIssue {
  const location = issue.details?.location as FormalIssueLocation | undefined;
  const kind: HighlightKind = location?.kind === 'placeholder' ? 'placeholder' : 'expected';

  const normalized = normalizeValidationIssue(issue);

  return {
    issue: displayMessage(normalized),
    outcome: normalized.outcome,
    text_reference: '',
    severity: issue.severity,
    page: location?.page ?? null,
    locations: location?.rects.length
      ? [{ page: location.page, rects: location.rects }]
      : undefined,
    source: 'formal',
    kind,
    rule_name: displayLabel(issue.rule_name, issue.field_name),
  };
}
