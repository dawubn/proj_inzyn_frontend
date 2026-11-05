import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  displayMessage,
  formalReportRows,
  normalizeValidationIssue,
} from '../src/lib/formalMessages.ts';
import type { FormalCheck } from '../src/lib/formalMessages.ts';
import type { AnalysisReportResponse, ValidationIssue } from '../src/api/generated/model/index.ts';

function issue(overrides: Partial<ValidationIssue> = {}): ValidationIssue {
  return {
    rule_name: 'Data',
    field_name: 'date',
    message: 'Data nie może być wcześniejsza niż dzień podpisania.',
    severity: 'error',
    details: { rule_id: 'date', outcome: 'fail', reason_code: 'CUSTOM_DATE_RULE' },
    ...overrides,
  };
}
function check(overrides: Partial<FormalCheck> = {}): FormalCheck {
  return {
    rule_id: 'date',
    rule_name: 'Data',
    field_name: 'date',
    severity: 'error',
    outcome: 'fail',
    reason_code: 'CUSTOM_DATE_RULE',
    evidence: [],
    ...overrides,
  };
}
function report(
  checks: FormalCheck[],
  errors: ValidationIssue[],
  warnings: ValidationIssue[] = [],
) {
  return {
    summary: { schema_version: 2, rule_results: checks },
    errors,
    warnings,
  } as AnalysisReportResponse;
}

test('unknown reason codes and legacy issues retain the backend explanation', () => {
  assert.equal(displayMessage(normalizeValidationIssue(issue())), issue().message);
  assert.equal(displayMessage(normalizeValidationIssue(issue({ details: {} }))), issue().message);
  assert.equal(
    displayMessage({ outcome: 'fail', reason_code: 'EMPTY_FIELD', message: 'technical text' }),
    'To pole jest puste. Uzupełnij je w dokumencie.',
  );
});

test('all recorded outcomes override severity consistently', () => {
  for (const outcome of ['pass', 'fail', 'unknown', 'not_applicable', 'error'] as const) {
    const entry = issue({ details: { outcome } });
    assert.equal(normalizeValidationIssue(entry).outcome, outcome);
    const { rows } = formalReportRows({ errors: [entry] } as AnalysisReportResponse);
    assert.equal(rows[0].check.outcome, outcome);
  }
  assert.equal(
    normalizeValidationIssue(issue({ details: { outcome: 'toString' } })).outcome,
    'fail',
  );
});

test('repeated rule IDs map one-to-one, matching fields before occurrence', () => {
  const entries = [issue({ field_name: 'signed' }), issue(), issue()];
  const { rows, actionable } = formalReportRows(
    report([check(), check({ field_name: 'signed' }), check()], entries),
  );
  assert.deepEqual(
    rows.map((row) => row.issueIndex),
    [1, 0, 2],
  );
  assert.deepEqual(
    actionable.map((row) => row.issueIndex),
    [0, 1, 2],
  );
});

test('extra report warnings remain visible and selectable without duplicating rule results', () => {
  const warning = issue({
    severity: 'warning',
    rule_name: 'Formal validation profile',
    field_name: 'document_type',
    details: {},
  });
  const { rows, actionable } = formalReportRows(report([check()], [issue()], [warning]));
  assert.equal(rows.length, 2);
  assert.deepEqual(
    actionable.map((row) => row.issueIndex),
    [0, 1],
  );
  assert.equal(rows[1].check.reason_code, 'UNSUPPORTED_PROFILE');
});

test('passed checks cannot consume a failure with the same rule ID', () => {
  const { rows, remaining, actionable } = formalReportRows(
    report([check({ outcome: 'pass' }), check()], [issue()]),
  );
  assert.deepEqual(
    rows.map((row) => row.issueIndex),
    [null, 0],
  );
  assert.equal(remaining.length, 1);
  assert.equal(actionable.length, 1);
});

test('empty legacy and modern reports remain distinguishable', () => {
  assert.equal(
    formalReportRows({ errors: [], warnings: [] } as unknown as AnalysisReportResponse).modern,
    false,
  );
  const modern = formalReportRows(report([check({ outcome: 'pass' })], []));
  assert.equal(modern.modern, true);
  assert.equal(modern.actionable.length, 0);
  assert.equal(modern.remaining.length, 1);
});

test('the card preserves the linked issue message when a rule result has no explanation', () => {
  const { rows } = formalReportRows(report([check()], [issue()]));
  assert.equal(displayMessage(rows[0].check), issue().message);
});
