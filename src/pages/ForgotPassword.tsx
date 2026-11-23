// src/pages/ForgotPassword.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AuthCard from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPasswordApiV1AuthForgotPasswordPost } from '@/api/generated/auth/auth';
import { EMAIL_LINKS_PER_DAY } from '@/lib/emailLinks';

function BackToLogin() {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
      <ArrowLeft size={16} />
      <Link to="/" className="cursor-pointer hover:text-black">
        Back to login
      </Link>
    </div>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const forgotPassword = useForgotPasswordApiV1AuthForgotPasswordPost();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      const response = await forgotPassword.mutateAsync({ data: { email: email.trim() } });

      if (response.status === 202) {
        setIsSent(true);
      } else if (response.status === 422) {
        setError('Enter a valid email address');
      } else {
        setError('Could not send the reset link. Try again later.');
      }
    } catch {
      setError('Could not send the reset link. Try again later.');
    }
  }

  if (isSent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account with this email exists, we have sent a link to reset the password."
      >
        <div className="space-y-5">
          <p className="text-sm leading-5 text-gray-500">
            The link is valid for 30 minutes and can be used once. If the message does not arrive,
            check the spam folder or try again in a minute. You can ask for a link up to{' '}
            {EMAIL_LINKS_PER_DAY} times a day.
          </p>

          <BackToLogin />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter the email of your account and we will send you a link to set a new password."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
          />
        </div>

        <Button
          type="submit"
          disabled={forgotPassword.isPending}
          className="mt-2 h-10 w-full cursor-pointer bg-black text-white hover:bg-black/90"
        >
          {forgotPassword.isPending ? 'Sending...' : 'Send reset link'}
        </Button>

        {error && (
          <p role="alert" className="text-center text-sm text-red-500">
            {error}
          </p>
        )}

        <BackToLogin />
      </form>
    </AuthCard>
  );
}
