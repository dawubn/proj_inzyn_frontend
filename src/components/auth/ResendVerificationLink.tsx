import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResendVerificationApiV1AuthResendVerificationPost } from '@/api/generated/auth/auth';
import { EMAIL_LINKS_PER_DAY } from '@/lib/emailLinks';

type ResendVerificationLinkProps = {
  // Email of the account; without it the user types it in
  email?: string;
};

// Asks for a new email confirmation link. The answer is the same for every email,
// so the message after sending does not say whether the account exists.
export default function ResendVerificationLink({ email }: ResendVerificationLinkProps) {
  const [typedEmail, setTypedEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const resend = useResendVerificationApiV1AuthResendVerificationPost();
  const address = (email ?? typedEmail).trim();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!address) {
      setError('Email is required');
      return;
    }

    try {
      const response = await resend.mutateAsync({ data: { email: address } });

      if (response.status === 202) {
        setIsSent(true);
      } else if (response.status === 422) {
        setError('Enter a valid email address');
      } else {
        setError('Could not send the link. Try again later.');
      }
    } catch {
      setError('Could not send the link. Try again later.');
    }
  }

  if (isSent) {
    return (
      <p role="status" className="rounded-md bg-gray-50 px-3 py-2 text-sm leading-5 text-gray-600">
        If the account still needs to be confirmed, we have sent a new link. Check your inbox and
        the spam folder. You can ask for a new link once a minute, up to {EMAIL_LINKS_PER_DAY} times
        a day.
      </p>
    );
  }

  return (
    <form onSubmit={handleSend} noValidate className="space-y-3">
      {email === undefined && (
        <div className="space-y-2">
          <Label htmlFor="resend-email">Email</Label>
          <Input
            id="resend-email"
            type="email"
            autoComplete="email"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
          />
        </div>
      )}

      <Button
        type="submit"
        variant="outline"
        disabled={resend.isPending}
        className="h-10 w-full cursor-pointer"
      >
        {resend.isPending ? 'Sending...' : 'Send a new link'}
      </Button>

      {error && (
        <p role="alert" className="text-center text-sm text-red-500">
          {error}
        </p>
      )}
    </form>
  );
}
