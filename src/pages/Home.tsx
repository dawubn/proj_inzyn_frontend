import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerUser, loginUser } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');

      if (password !== repeatPassword) {
        setError('Passwords do not match');
        return;
      }

      await registerUser({
        email,
        password,
        full_name: 'User',
        role: 'business_user',
      });

      const loginResponse = await loginUser({
        email,
        password,
      });

      login(loginResponse.access_token, loginResponse.refresh_token);

      navigate('/dashboard');
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* LEWY PANEL – tylko desktop, beżowe tło */}
      <div className="hidden md:flex w-1/2 bg-gray-100 flex-col justify-between">
        <div className="p-6">
          <h1 className="font-semibold text-lg">CerberDoc</h1>
        </div>

        <div className="flex justify-center items-center flex-1">
          <img src="/logo.svg" alt="logo" className="w-100" />
        </div>

        <div className="p-6 text-sm text-gray-500">
          Project carried out as part of an engineering thesis.
        </div>
      </div>

      {/* PRAWY / GŁÓWNY PANEL */}
      <div className="flex-1 bg-white flex flex-col justify-between md:w-1/2">
        {/* HEADER */}
        <div className="flex flex-col">
          {/* MOBILE: beżowy pasek z logo + nazwą */}
          <div className="md:hidden bg-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="logo" className="w-12 h-12" />
              <span className="font-semibold text-xl">CerberDoc</span>
            </div>

            <a href="#" className="text-sm underline">
              Contact us
            </a>
          </div>

          {/* DESKTOP: header tylko z prawej, bez beżu */}
          <div className="hidden md:flex px-6 py-6 justify-end">
            <a href="#" className="text-sm underline">
              Contact us
            </a>
          </div>
        </div>

        {/* FORMULARZ */}
        <div className="flex-1 flex justify-center items-center px-4 py-8">
          <Card className="w-full max-w-[400px] min-h-[520px] border border-gray-200 shadow-none ring-0 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Register</CardTitle>
              <p className="text-sm text-gray-500">
                Enter your email below to login to your account
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-1">
                <Label>Repeat password</Label>
                <Input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <Button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-black text-white hover:bg-black/90 cursor-pointer"
              >
                {loading ? 'Creating account...' : 'Register'}
              </Button>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <p className="text-xs text-gray-500 text-center leading-relaxed">
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

              <div className="flex justify-center items-center gap-2 text-sm text-gray-700 hover:text-black">
                <ArrowRight size={16} />
                <Link to="/login" className="underline cursor-pointer">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-6" />
      </div>
    </div>
  );
}
