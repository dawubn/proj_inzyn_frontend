// src/pages/ResetPassword.tsx

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import AuthCard from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPasswordApiV1AuthResetPasswordPost } from '@/api/generated/auth/auth';
import { useAuthContext } from '@/context/auth-context';

const MIN_PASSWORD_LENGTH = 8;

const linkButtonClassName =
  'flex h-10 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:bg-black/90';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [isLinkInvalid, setIsLinkInvalid] = useState(!token);
  const [isDone, setIsDone] = useState(false);

  const resetPassword = useResetPasswordApiV1AuthResetPasswordPost({
    fetch: {
      credentials: 'include',
    },
  });
  const authContext = useAuthContext();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
      return;
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await resetPassword.mutateAsync({
        data: { token, new_password: password },
      });

      if (response.status === 204) {
        // The backend ends every session of the user, including the one in this browser
        authContext?.setIsAuthenticated(false);
        setIsDone(true);
      } else if (response.status === 400) {
        setIsLinkInvalid(true);
      } else if (response.status === 422) {
        setError('This password cannot be used. Choose a different one.');
      } else {
        setError('Could not change the password. Try again later.');
      }
    } catch {
      setError('Could not change the password. Try again later.');
    }
  }

  if (isDone) {
    return (
      <AuthCard
        title="Password changed"
        description="Your password has been changed. You can now log in with the new password."
      >
        <Link to="/" className={linkButtonClassName}>
          Go to login
        </Link>
      </AuthCard>
    );
  }

  if (isLinkInvalid) {
    return (
      <AuthCard
        title="Link is no longer valid"
        description="This password reset link is invalid, has already been used or has expired."
      >
        <Link to="/forgot-password" className={linkButtonClassName}>
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Enter the new password for your account.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
          />
          <p className="text-xs text-gray-500">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeatPassword">Repeat new password</Label>
          <Input
            id="repeatPassword"
            type="password"
            autoComplete="new-password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
          />
        </div>

        <Button
          type="submit"
          disabled={resetPassword.isPending}
          className="mt-2 h-10 w-full cursor-pointer bg-black text-white hover:bg-black/90"
        >
          {resetPassword.isPending ? 'Saving...' : 'Change password'}
        </Button>

        {error && (
          <p role="alert" className="text-center text-sm text-red-500">
            {error}
          </p>
        )}
      </form>
    </AuthCard>
  );
}
