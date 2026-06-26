// src/pages/Register.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useRegister } from '@/hooks/auth/useRegister';
import { useLogin } from '@/hooks/auth/useLogin';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');

  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Account name is required');
      return;
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const regResponse = await registerMutation.mutateAsync({
        email,
        password,
        full_name: fullName.trim(),
        role: 'business_user',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;

      if (regResponse?.status === 409) {
        setError('An account with this email already exists.');
        return;
      }
      if ((regResponse?.status as number) !== 201) {
        setError(regResponse?.data?.detail || 'Registration failed');
        return;
      }

      const loginResponse = await loginMutation.mutateAsync({ data: { email, password } });
      if ((loginResponse.status as number) === 200 || loginResponse.status === 204) {
        navigate('/dashboard');
      } else {
        setError('Registration succeeded but login failed. Please log in manually.');
      }
    } catch {
      setError('Registration failed');
    }
  };

  const isPending = registerMutation.isPending || loginMutation.isPending;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="p-6">
        <h1 className="text-lg font-semibold">CerberDoc</h1>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-[400px] rounded-xl border border-gray-200 bg-white shadow-none ring-0">
          <CardHeader className="space-y-2 px-6 pt-8 pb-5">
            <CardTitle className="text-base font-semibold">Register</CardTitle>
            <p className="text-sm leading-5 text-gray-500">
              Enter your email below to login to your account
            </p>
          </CardHeader>

          <CardContent className="px-6 pt-0 pb-6">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Account name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeatPassword">Repeat password</Label>
                <Input
                  id="repeatPassword"
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="h-10 border-gray-200 focus:border-gray-400 focus:ring-0"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="mt-2 h-10 w-full cursor-pointer bg-black text-white hover:bg-black/90"
              >
                {isPending ? 'Creating account...' : 'Register'}
              </Button>

              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              <p className="px-3 text-center text-xs leading-5 text-gray-500">
                By clicking continue, you agree to our{' '}
                <a href="#" className="underline hover:text-black">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="underline hover:text-black">
                  Privacy Policy
                </a>
                .
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <ArrowRight size={16} />
                <Link to="/" className="cursor-pointer hover:text-black">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
