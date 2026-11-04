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

  return {
    issue: issue.message,
    text_reference: '',
    severity: issue.severity,
    page: location?.page ?? null,
    locations: location?.rects.length
      ? [{ page: location.page, rects: location.rects }]
      : undefined,
    source: 'formal',
    kind,
    rule_name: issue.rule_name,
  };
}
