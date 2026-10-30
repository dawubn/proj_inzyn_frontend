export type FormalOutcome = 'pass' | 'fail' | 'unknown' | 'not_applicable' | 'error';

export const outcomeLabels: Record<FormalOutcome, string> = {
  pass: 'Passed',
  fail: 'Needs attention',
  unknown: 'Review',
  not_applicable: 'Not required',
  error: 'Unavailable',
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

export function displayMessage(check: { outcome: FormalOutcome; reason_code?: string }) {
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

export function displayLabel(ruleName: string, fieldName?: string | null): string {
  return (
    fieldLabels[fieldName ?? ''] ??
    (ruleName === 'Formal validation profile' ? 'Rodzaj dokumentu' : ruleName)
  );
}
