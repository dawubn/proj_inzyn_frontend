import type { AnalysisReportResponse, ValidationIssue } from '@/api/generated/model';
import { Card, CardContent } from '@/components/ui/card';
import { severityConfig } from './issueStyles';

type Evidence = { text: string; page?: number | null };
type Outcome = 'pass' | 'fail' | 'unknown' | 'not_applicable' | 'error';
type Check = {
  rule_id: string;
  rule_name: string;
  field_name?: string | null;
  outcome: Outcome;
  severity: string;
  reason_code?: string;
  evidence: Evidence[];
};
type Summary = {
  schema_version?: number;
  validation_status?: string;
  rule_results?: Check[];
};

const outcomeLabels: Record<Outcome, string> = {
  pass: 'Passed',
  fail: 'Needs attention',
  unknown: 'Review',
  not_applicable: 'Not required',
  error: 'Unavailable',
};
const statusLabels: Record<string, string> = {
  complete: 'All required checks passed. Review any additional notes below.',
  incomplete: 'Some information needs your attention.',
  indeterminate: 'Some items need a manual review.',
  unsupported: 'Checks are not yet available for this document type.',
};
// Interface labels stay in English; document findings are written in Polish.
const fieldLabels: Record<string, string> = {
  has_date: 'Data dokumentu',
  has_principal_section: 'Mocodawca',
  has_attorney_section: 'Pełnomocnik',
  has_authorization_scope_section: 'Zakres umocowania',
  has_parties_section: 'Oznaczenie stron',
  has_subject_section: 'Przedmiot umowy',
  has_court_section: 'Oznaczenie sądu',
  has_claim_section: 'Żądanie pozwu',
  has_justification_section: 'Uzasadnienie',
  has_signature: 'Podpis',
  has_attachments_section: 'Załączniki',
  has_text: 'Treść dokumentu',
  document_type: 'Rodzaj dokumentu',
};
const reasonMessages: Record<string, string> = {
  MASK_TYPE_MISMATCH:
    'Ukryta wartość dotyczy innego rodzaju danych. Sprawdź, czy to pole jest wypełnione.',
  UNRECOGNIZED_NUMBER: 'Nie udało się odczytać kwoty. Sprawdź ją w dokumencie.',
  UNRECOGNIZED_IDENTIFIER: 'Nie udało się odczytać oznaczenia lub numeru. Sprawdź go w dokumencie.',
  FIELD_LAYOUT_UNCERTAIN:
    'Nie można pewnie przypisać treści do tego pola. Sprawdź je w dokumencie.',
  VARIANT_FIELD_REVIEW:
    'Sprawdź, czy ten element występuje i jest potrzebny w tym rodzaju dokumentu.',
  VISUAL_REVIEW_REQUIRED: 'Sprawdź zdjęcie i zabezpieczenia na oryginale dokumentu.',
  TABLE_CONTENT_UNVERIFIED: 'Sprawdź, czy tabela zawiera wypełnione pozycje, a nie tylko nagłówki.',
  EMPTY_FIELD: 'To pole jest puste. Uzupełnij je w dokumencie.',
  INVALID_DATE: 'Ta data jest niepoprawna. Sprawdź dzień, miesiąc i rok.',
  REDACTED_PRESENCE_CONFIRMED:
    'Pole jest wypełnione. Jego treść została ukryta dla ochrony danych.',
  MASKED_CONTENT_UNVERIFIABLE:
    'Pole jest wypełnione, ale jego treść jest ukryta. Sprawdź poprawność w oryginale.',
  REDACTED_VALUE: 'Treść tego pola jest ukryta. Sprawdź ją w oryginale dokumentu.',
  REDACTED_DATE: 'Data jest ukryta. Jej poprawność możesz sprawdzić w oryginale dokumentu.',
  REDACTED_PARTY: 'Dane osoby są ukryte. Sprawdź je w oryginale dokumentu.',
  PARTY_FIELD_EMPTY: 'Dane co najmniej jednej ze stron są puste. Uzupełnij je w dokumencie.',
  PARTY_NOT_FOUND: 'Nie znaleziono danych obu stron. Sprawdź, czy dokument je zawiera.',
  PARTIES_UNCERTAIN: 'Sprawdź, czy dokument zawiera dane obu stron.',
  SIGNATURE_REQUIRES_VISUAL_REVIEW:
    'Sprawdź na oryginale dokumentu, czy znajduje się wymagany podpis.',
  LOW_OCR_CONFIDENCE: 'Ten fragment jest trudny do odczytania. Sprawdź go w oryginale dokumentu.',
  CONFLICTING_CANDIDATES:
    'Znaleziono różne informacje dotyczące tego pola. Sprawdź, która jest właściwa.',
  CONFLICTING_DATES: 'Znaleziono różne daty. Sprawdź, która jest datą dokumentu.',
  UNRECOGNIZED_DATE: 'Nie udało się odczytać daty. Sprawdź ją w dokumencie.',
  INSUFFICIENT_VALUE: 'Sprawdź, czy to pole zawiera wszystkie potrzebne informacje.',
  SCOPE_NOT_ESTABLISHED: 'Sprawdź, czy opisano, do jakich czynności upoważniono pełnomocnika.',
  LAYOUT_UNAVAILABLE:
    'Nie udało się dokładnie odczytać układu dokumentu. Sprawdź ten element ręcznie.',
  UNREADABLE_PAGE:
    'Nie udało się odczytać przynajmniej jednej strony. Sprawdź czytelność dokumentu.',
  INSUFFICIENT_TEXT: 'Odczytano zbyt mało treści. Spróbuj przesłać wyraźniejszą kopię dokumentu.',
  NO_TEXT: 'Nie udało się odczytać dokumentu. Spróbuj przesłać wyraźniejszą kopię.',
  AZURE_OCR_REQUIRED: 'Nie udało się odczytać dokumentu. Uruchom analizę ponownie.',
  LEGACY_EXTRACTION: 'Uruchom analizę ponownie, aby sprawdzić ten element.',
  ATTACHMENT_CONTENT_UNVERIFIED: 'Sprawdź, czy dołączono wszystkie wymienione załączniki.',
  UNSUPPORTED_PROFILE: 'Nie sprawdzamy jeszcze tego rodzaju dokumentów.',
  NO_ATTACHMENT_REQUIREMENT: 'Nie znaleziono informacji o wymaganych załącznikach.',
  INVALID_RULE_CONFIG: 'Nie udało się sprawdzić tego elementu. Spróbuj ponownie później.',
  UNKNOWN_RULE_TYPE: 'Nie udało się sprawdzić tego elementu. Spróbuj ponownie później.',
  VALUE_UNAVAILABLE: 'Nie udało się odczytać wartości tego pola. Sprawdź ją w dokumencie.',
  PATTERN_MISMATCH: 'Wartość ma nieprawidłowy format. Sprawdź ją w dokumencie.',
  DATE_OUT_OF_RANGE: 'Data znajduje się poza dozwolonym zakresem. Sprawdź ją w dokumencie.',
};

function displayMessage(check: Pick<Check, 'outcome' | 'reason_code'>) {
  if (check.reason_code && reasonMessages[check.reason_code]) {
    return reasonMessages[check.reason_code];
  }
  switch (check.outcome) {
    case 'pass':
      return 'Ten element jest obecny i spełnia sprawdzane wymaganie.';
    case 'not_applicable':
      return 'Ten element nie jest wymagany w tym sprawdzeniu.';
    case 'error':
      return 'Nie udało się sprawdzić tego elementu. Spróbuj ponownie później.';
    case 'unknown':
      return 'Sprawdź ten element w oryginale dokumentu.';
    default:
      return 'Brakuje wymaganych informacji lub nie spełniają one wymagania. Sprawdź ten element w dokumencie.';
  }
}

function CheckResult({ check }: { check: Check }) {
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
  const label =
    fieldLabels[check.field_name ?? ''] ??
    (check.rule_name === 'Formal validation profile' ? 'Rodzaj dokumentu' : check.rule_name);
  return (
    <div className={`border-l-4 ${config.border} ${config.bg} p-3 rounded`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${config.text} text-sm`}>{label}</p>
        </div>
        <span className={`${config.badge} px-2 py-1 rounded text-xs font-medium whitespace-nowrap`}>
          {outcomeLabels[check.outcome] ?? 'Review'}
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-1">{displayMessage(check)}</p>
      {check.evidence?.length > 0 && (
        <details className="mt-2 text-xs text-gray-600">
          <summary className="cursor-pointer font-medium hover:text-gray-900">
            View document excerpt
          </summary>
          <ul className="mt-2 space-y-2">
            {check.evidence.map((item, index) => (
              <li key={index} className="break-words rounded bg-white/60 p-2">
                <span className="font-medium">
                  {item.page ? `Page ${item.page}` : 'Document excerpt'}
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

function legacyCheck(issue: ValidationIssue, index: number): Check {
  return {
    rule_id: `legacy-${index}`,
    rule_name: issue.rule_name,
    field_name: issue.field_name,
    severity: issue.severity,
    outcome: issue.details?.outcome === 'fail' || issue.severity === 'error' ? 'fail' : 'unknown',
    reason_code:
      typeof issue.details?.reason_code === 'string'
        ? issue.details.reason_code
        : issue.rule_name === 'Formal validation profile'
          ? 'UNSUPPORTED_PROFILE'
          : undefined,
    evidence: [],
  };
}

export function FormalValidationCard({
  report,
  isLoading,
}: {
  report?: AnalysisReportResponse;
  isLoading: boolean;
}) {
  const summary = (report?.summary ?? {}) as Summary;
  const modern = summary.schema_version === 2 && Array.isArray(summary.rule_results);
  const checks = modern ? (summary.rule_results ?? []) : [];
  const issues = [...(report?.errors ?? []), ...(report?.warnings ?? [])];
  const actionable = checks.filter((check) => !['pass', 'not_applicable'].includes(check.outcome));
  const remaining = checks.filter((check) => ['pass', 'not_applicable'].includes(check.outcome));
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
                    Needs attention: {checks.filter((check) => check.outcome === 'fail').length}
                    {' · '}Review:{' '}
                    {checks.filter((check) => ['unknown', 'error'].includes(check.outcome)).length}
                  </p>
                )}
              </div>
              {actionable.map((check, index) => (
                <CheckResult key={`${check.rule_id}-${index}`} check={check} />
              ))}
              {remaining.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Other checks ({remaining.length})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {remaining.map((check, index) => (
                      <CheckResult key={`${check.rule_id}-${index}`} check={check} />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
          {report && !modern && (
            <>
              <p className="text-sm text-gray-600">
                This is an older report. Run the analysis again to see updated results.
              </p>
              {issues.map((issue, index) => (
                <CheckResult key={index} check={legacyCheck(issue, index)} />
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
