import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  apiFieldErrors,
  cleanMessage,
  cleanSingleLine,
  retryAfterText,
  toContactRequest,
  validateContactForm,
} from '../src/lib/contactForm.ts';

const valid = {
  name: 'Jan Kowalski',
  email: 'jan@example.com',
  subject: 'Account',
  message: 'Hello, how can I change my company name?',
};

test('a filled-in form has no errors', () => {
  assert.deepEqual(validateContactForm(valid), {});
});

test('name and subject are optional', () => {
  assert.deepEqual(validateContactForm({ ...valid, name: '', subject: '' }), {});
});

test('email is required and must look like an address', () => {
  assert.match(validateContactForm({ ...valid, email: ' ' }).email ?? '', /Enter your email/);
  for (const email of ['jan', 'jan@example', 'jan@ex ample.com', 'a<b>@example.com']) {
    assert.equal(validateContactForm({ ...valid, email }).email, 'Enter a valid email address');
  }
});

test('message length is counted without hidden characters and spaces', () => {
  assert.match(validateContactForm({ ...valid, message: '  short  ' }).message ?? '', /at least/);
  assert.match(
    validateContactForm({ ...valid, message: '\u200b'.repeat(20) }).message ?? '',
    /at least/,
  );
  assert.match(validateContactForm({ ...valid, message: 'x'.repeat(5001) }).message ?? '', /most/);
});

test('too many links are rejected', () => {
  const message = 'See http://a.example http://b.example www.c.example https://d.example';
  assert.match(validateContactForm({ ...valid, message }).message ?? '', /at most 3 links/);
});

test('too long name or subject is rejected', () => {
  const errors = validateContactForm({ ...valid, name: 'x'.repeat(101), subject: 'y'.repeat(151) });
  assert.ok(errors.name);
  assert.ok(errors.subject);
});

test('single-line fields lose line breaks and invisible characters', () => {
  assert.equal(cleanSingleLine(' Invoice\u202e  fdp.exe\r\nBcc: x '), 'Invoice fdp.exe Bcc: x');
});

test('message keeps line breaks but not hidden characters or many empty lines', () => {
  assert.equal(
    cleanMessage('Hello\u200b team,  \r\n\r\n\r\n\r\nhelp\u0007.\n'),
    'Hello team,\n\nhelp.',
  );
});

test('the request carries cleaned values and the hidden field', () => {
  assert.deepEqual(toContactRequest({ ...valid, email: ' jan@example.com ' }, ''), {
    ...valid,
    website: '',
  });
});

test('field errors from the API are shown next to the fields', () => {
  const detail = [
    { loc: ['body', 'message'], msg: 'Value error, may contain at most 3 links' },
    { loc: ['body', 'website'], msg: 'String should have at most 200 characters' },
  ];
  assert.deepEqual(apiFieldErrors({ detail }), { message: 'May contain at most 3 links' });
  assert.deepEqual(apiFieldErrors({ detail: 'not a list' }), {});
  assert.deepEqual(apiFieldErrors(null), {});
});

test('retry time is described in words', () => {
  assert.equal(retryAfterText('30'), 'in a minute');
  assert.equal(retryAfterText('600'), 'in about 10 minutes');
  assert.equal(retryAfterText('7200'), 'in about 2 hours');
  assert.equal(retryAfterText(null), 'later');
});
