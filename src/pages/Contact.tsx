// src/pages/Contact.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import PublicPage from '@/components/public/PublicPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSendMessageApiV1ContactPost } from '@/api/generated/contact/contact';
import { useGetMeApiV1UsersMeGet } from '@/api/generated/users/users';
import type { UserResponse } from '@/api/generated/model';
import { useAuthContext } from '@/context/auth-context';
import {
  CONTACT_LIMITS,
  apiFieldErrors,
  retryAfterText,
  toContactRequest,
  validateContactForm,
  type ContactField,
  type ContactFormErrors,
  type ContactFormValues,
} from '@/lib/contactForm';

const EMPTY: ContactFormValues = { name: '', email: '', subject: '', message: '' };

type FieldProps = {
  id: ContactField;
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
};

function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <Label htmlFor={id}>{label}</Label>
        {hint}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Contact() {
  const authContext = useAuthContext();
  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [formError, setFormError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const send = useSendMessageApiV1ContactPost();

  // A signed-in user does not have to type in who they are
  const me = useGetMeApiV1UsersMeGet({
    query: { enabled: authContext?.isAuthenticated === true, retry: false },
    fetch: { credentials: 'include' },
  });
  useEffect(() => {
    if (me.data?.status !== 200) return;
    const user = me.data.data as UserResponse;
    setValues((current) => ({
      ...current,
      email: current.email || user.email,
      name: current.name || [user.name, user.surname].filter(Boolean).join(' '),
    }));
  }, [me.data]);

  function change(field: ContactField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const found = validateContactForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    try {
      const response = await send.mutateAsync({ data: toContactRequest(values, website) });

      if (response.status === 202) {
        setSentTo(values.email.trim());
        setValues((current) => ({ ...current, subject: '', message: '' }));
      } else if (response.status === 422) {
        const fromApi = apiFieldErrors(response.data);
        setErrors(fromApi);
        setFormError('Some fields are not valid. Correct them and send the message again.');
      } else if (response.status === 429) {
        setFormError(
          `You have sent too many messages. Try again ${retryAfterText(response.headers.get('Retry-After'))}.`,
        );
      } else if (response.status === 503) {
        setFormError('The contact form is not available right now. Please try again later.');
      } else {
        setFormError('Could not send the message. Try again later.');
      }
    } catch {
      setFormError('Could not send the message. Check your connection and try again.');
    }
  }

  if (sentTo) {
    return (
      <PublicPage width="narrow">
        <Card className="mt-4 w-full rounded-xl border border-gray-200 bg-white shadow-none ring-0 sm:mt-12">
          <CardHeader className="space-y-3 px-6 pt-8 pb-5">
            <CheckCircle2 className="text-green-600" size={28} />
            <CardTitle className="text-base font-semibold">Message sent</CardTitle>
            <p className="text-sm leading-5 text-gray-500">
              Thank you for writing to us. We will reply to{' '}
              <span className="font-medium [overflow-wrap:anywhere] text-gray-900">{sentTo}</span>.
            </p>
          </CardHeader>
          <CardContent className="px-6 pt-0 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSentTo(null)}
              className="h-10 w-full cursor-pointer border-gray-300"
            >
              Send another message
            </Button>
          </CardContent>
        </Card>
      </PublicPage>
    );
  }

  const messageLength = values.message.length;

  return (
    <PublicPage width="narrow">
      <Card className="mt-4 w-full rounded-xl border border-gray-200 bg-white shadow-none ring-0 sm:mt-12">
        <CardHeader className="space-y-2 px-6 pt-8 pb-5">
          <CardTitle className="text-base font-semibold">Contact us</CardTitle>
          <p className="text-sm leading-5 text-gray-500">
            Questions about CerberDoc, your account or your data? Send us a message and we will
            reply by email.
          </p>
        </CardHeader>

        <CardContent className="px-6 pt-0 pb-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field id="email" label="Your email" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                maxLength={CONTACT_LIMITS.email}
                value={values.email}
                onChange={(e) => change('email', e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="h-10 border-gray-200"
              />
            </Field>

            <Field id="name" label="Name (optional)" error={errors.name}>
              <Input
                id="name"
                autoComplete="name"
                maxLength={CONTACT_LIMITS.name}
                value={values.name}
                onChange={(e) => change('name', e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className="h-10 border-gray-200"
              />
            </Field>

            <Field id="subject" label="Subject (optional)" error={errors.subject}>
              <Input
                id="subject"
                autoComplete="off"
                maxLength={CONTACT_LIMITS.subject}
                value={values.subject}
                onChange={(e) => change('subject', e.target.value)}
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? 'subject-error' : undefined}
                className="h-10 border-gray-200"
              />
            </Field>

            <Field
              id="message"
              label="Message"
              error={errors.message}
              hint={
                <span
                  className={`text-xs ${messageLength >= CONTACT_LIMITS.messageMax ? 'text-red-600' : 'text-gray-400'}`}
                >
                  {messageLength} / {CONTACT_LIMITS.messageMax}
                </span>
              }
            >
              <textarea
                id="message"
                rows={6}
                maxLength={CONTACT_LIMITS.messageMax}
                value={values.message}
                onChange={(e) => change('message', e.target.value)}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : 'message-help'}
                className="w-full resize-y rounded-lg border border-gray-200 px-2.5 py-2 text-base outline-none placeholder:text-gray-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
              />
              {!errors.message && (
                <p id="message-help" className="text-xs leading-5 text-gray-500">
                  Do not include passwords or the content of your documents. If a problem concerns
                  an analysis, give its name or ID.
                </p>
              )}
            </Field>

            {/* Hidden from people and screen readers; bots that fill every field get caught */}
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={send.isPending}
              className="h-10 w-full cursor-pointer bg-black text-white hover:bg-black/90"
            >
              {send.isPending ? 'Sending...' : 'Send message'}
            </Button>

            {formError && (
              <p role="alert" className="text-center text-sm text-red-500">
                {formError}
              </p>
            )}

            <p className="text-center text-xs leading-5 text-gray-500">
              We use your email address and message only to answer you, as described in the{' '}
              <Link to="/privacy" className="underline hover:text-black">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </CardContent>
      </Card>
    </PublicPage>
  );
}
