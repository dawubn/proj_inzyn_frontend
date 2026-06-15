import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loginUser } from '@/api/auth/auth';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const response = await loginUser({ email, password });

      login(response.access_token, response.refresh_token);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <div className="hidden w-1/2 flex-col justify-between bg-gray-100 md:flex">
        <div className="p-6">
          <h1 className="text-lg font-semibold">CerberDoc</h1>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <img src="/logo.svg" alt="logo" className="w-100" />
        </div>

        <div className="p-6 text-sm text-gray-500">
          Project carried out as part of an engineering thesis.
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between bg-white md:w-1/2">
        <div className="flex flex-col">
          <div className="flex items-center justify-between bg-gray-100 px-6 py-4 md:hidden">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="logo" className="h-12 w-12" />
              <span className="text-xl font-semibold">CerberDoc</span>
            </div>

            <a href="#" className="text-sm underline">
              Contact us
            </a>
          </div>

          <div className="hidden justify-end px-6 py-6 md:flex">
            <a href="#" className="text-sm underline">
              Contact us
            </a>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <Card className="w-full max-w-[400px] border border-gray-200 bg-white shadow-none ring-0">
            <CardHeader className="space-y-2 px-6 pt-8 pb-5">
              <CardTitle className="text-lg font-bold leading-none">
                Login to your account
              </CardTitle>
              <p className="text-sm leading-5 text-gray-500">
                Enter your email and password to access your account
              </p>
            </CardHeader>

            <CardContent className="px-6 pt-0 pb-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-sm text-gray-500 hover:text-black">
                      Forgot your password?
                    </a>
                  </div>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 border-gray-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full cursor-pointer bg-black text-white hover:bg-black/90"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>

                {error && <p className="text-center text-sm text-red-500">{error}</p>}

                <div className="pt-1 text-center text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="cursor-pointer underline hover:text-black">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="p-6" />
      </div>
    </div>
  );
}
