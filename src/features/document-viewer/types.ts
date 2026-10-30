import type { FormalOutcome } from '@/components/analysis/formalMessages';

/** Rectangle relative to its page: all values are fractions (0-1) of page width/height. */
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IssueLocation {
  page: number;
  rects: NormalizedRect[];
}

/** One item of `legal_analysis_result.errors` returned by the backend. */
export interface LegalIssue {
  issue: string;
  text_reference: string;
  severity: string;
  /** Page cited by the LLM or found by text matching (1-based); missing in old analyses. */
  page?: number | null;
  /** Exact highlight areas; missing when the referenced text was not found on the page. */
  locations?: IssueLocation[];
}

/**
 * How a highlight relates to the text: `text` marks the referenced text itself; for missing
 * elements (formal issues) `placeholder` marks an unfilled field and `expected` the usual spot.
 */
export type HighlightKind = 'text' | 'placeholder' | 'expected';

/** An issue shown on the document: from the AI analysis or from formal validation. */
export interface ViewerIssue extends LegalIssue {
  source: 'ai' | 'formal';
  outcome?: FormalOutcome;
  kind: HighlightKind;
  /** Validation rule name (formal issues only). */
  rule_name?: string;
}
