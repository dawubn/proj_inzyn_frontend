// Contact form: the same rules as the API (app/schemas/contact.py in the backend),
// checked here first so people see what to fix before anything is sent

export const CONTACT_LIMITS = {
  email: 254,
  name: 100,
  subject: 150,
  messageMin: 10,
  messageMax: 5000,
  links: 3,
} as const;

export type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactField = keyof ContactFormValues;
export type ContactFormErrors = Partial<Record<ContactField, string>>;

// Control characters, invisible formatting (right-to-left override, zero width space)
// and Unicode line separators; line breaks and tabs are handled separately
const HIDDEN = /[\p{Cc}\p{Cf}\u2028\u2029]/gu;
const LINK = /https?:\/\/|www\./gi;
const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;

/** One line of text without hidden characters and repeated spaces. */
export function cleanSingleLine(value: string): string {
  return value
    .replace(/[\r\n\t]/g, ' ')
    .replace(HIDDEN, '')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/** Message text: line breaks stay, hidden characters and long runs of empty lines go. */
export function cleanMessage(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(HIDDEN, (char) => (char === '\n' || char === '\t' ? char : ''))
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function countLinks(text: string): number {
  return text.match(LINK)?.length ?? 0;
}

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};
  const email = values.email.trim();
  const message = cleanMessage(values.message);

  if (!email) {
    errors.email = 'Enter your email address, so we can reply';
  } else if (email.length > CONTACT_LIMITS.email || !EMAIL.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (cleanSingleLine(values.name).length > CONTACT_LIMITS.name) {
    errors.name = `Use at most ${CONTACT_LIMITS.name} characters`;
  }
  if (cleanSingleLine(values.subject).length > CONTACT_LIMITS.subject) {
    errors.subject = `Use at most ${CONTACT_LIMITS.subject} characters`;
  }

  if (message.length < CONTACT_LIMITS.messageMin) {
    errors.message = `Write at least ${CONTACT_LIMITS.messageMin} characters`;
  } else if (values.message.length > CONTACT_LIMITS.messageMax) {
    errors.message = `Use at most ${CONTACT_LIMITS.messageMax} characters`;
  } else if (countLinks(message) > CONTACT_LIMITS.links) {
    errors.message = `A message can contain at most ${CONTACT_LIMITS.links} links`;
  }

  return errors;
}

/** Cleaned values as sent to the API; `website` is the hidden field only bots fill in. */
export function toContactRequest(values: ContactFormValues, website: string) {
  return {
    email: values.email.trim(),
    name: cleanSingleLine(values.name),
    subject: cleanSingleLine(values.subject),
    message: cleanMessage(values.message),
    website,
  };
}

const FIELDS: readonly ContactField[] = ['name', 'email', 'subject', 'message'];

function isField(value: unknown): value is ContactField {
  return FIELDS.includes(value as ContactField);
}

/** Field errors from the body of a 422 answer of the API, for the fields the form has. */
export function apiFieldErrors(body: unknown): ContactFormErrors {
  const errors: ContactFormErrors = {};
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (!Array.isArray(detail)) return errors;

  for (const item of detail as { loc?: unknown; msg?: unknown }[]) {
    const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : null;
    if (!isField(field) || errors[field]) continue;
    const text = typeof item.msg === 'string' ? item.msg.replace(/^Value error, /, '') : '';
    errors[field] = text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Check this field';
  }
  return errors;
}

/** "in about 12 minutes" from a Retry-After header in seconds. */
export function retryAfterText(header: string | null): string {
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds <= 0) return 'later';
  if (seconds < 90) return 'in a minute';
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `in about ${minutes} minutes`;
  return `in about ${Math.ceil(minutes / 60)} hours`;
}
