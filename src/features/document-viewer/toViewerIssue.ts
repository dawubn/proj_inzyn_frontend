import { displayLabel, displayMessage, normalizeValidationIssue } from '@/lib/formalMessages';
import type { ValidationIssue } from '@/api/generated/model';
import { readFormalLocation } from '@/lib/formalLocation';
import type { HighlightKind, LegalIssue, ViewerIssue } from './types';

export function aiToViewerIssue(issue: LegalIssue): ViewerIssue {
  return { ...issue, source: 'ai', kind: 'text' };
}

export function formalToViewerIssue(issue: ValidationIssue): ViewerIssue {
  const location = readFormalLocation(issue.details?.location);
  const kind: HighlightKind =
    location?.kind === 'placeholder'
      ? 'placeholder'
      : location?.kind === 'expected'
        ? 'expected'
        : 'text';

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
