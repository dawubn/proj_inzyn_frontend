// src/pages/VerifyEmail.tsx

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AuthCard from '@/components/auth/AuthCard';
import ResendVerificationLink from '@/components/auth/ResendVerificationLink';
import { useVerifyEmailApiV1AuthVerifyEmailPost } from '@/api/generated/auth/auth';

type VerifyState = 'verifying' | 'verified' | 'invalid' | 'error';

const linkButtonClassName =
  'flex h-10 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:bg-black/90';

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

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'invalid');

  const { mutateAsync } = useVerifyEmailApiV1AuthVerifyEmailPost();
  // The link works once: React may run the effect twice in development
  const sentToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || sentToken.current === token) {
      return;
    }
    sentToken.current = token;

    mutateAsync({ data: { token } })
      .then((response) => {
        if (response.status === 204) {
          setState('verified');
        } else if (response.status === 400 || response.status === 422) {
          setState('invalid');
        } else {
          setState('error');
        }
      })
      .catch(() => setState('error'));
  }, [token, mutateAsync]);

  if (state === 'verifying') {
    return (
      <AuthCard title="Confirming your email" description="This takes a moment.">
        <p role="status" className="text-sm text-gray-500">
          Checking the link...
        </p>
      </AuthCard>
    );
  }

  if (state === 'verified') {
    return (
      <AuthCard
        title="Email confirmed"
        description="Your account is active. You can now log in with your email and password."
      >
        <Link to="/" className={linkButtonClassName}>
          Go to login
        </Link>
      </AuthCard>
    );
  }

  if (state === 'error') {
    return (
      <AuthCard
        title="Could not confirm the email"
        description="Something went wrong on our side. Open the link from the email again in a moment."
      >
        <BackToLogin />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="This link does not work"
      description="The confirmation link is invalid, has expired or was already used."
    >
      <div className="space-y-5">
        <p className="text-sm leading-5 text-gray-500">
          If you have already confirmed your email, just log in. Otherwise enter your email and we
          will send you a new link.
        </p>

        <ResendVerificationLink />

        <BackToLogin />
      </div>
    </AuthCard>
  );
}
