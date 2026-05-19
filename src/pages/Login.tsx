import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await loginUser({
        email,
        password,
      });

      login(response.access_token, response.refresh_token);

      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* header */}
      <div className="p-6">
        <h1 className="font-semibold text-lg">CerberDoc</h1>
      </div>

      {/* center */}
      <div className="flex justify-center items-center flex-1">
        <Card className="w-[400px] min-h border border-gray-200 shadow-none ring-0 bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Login to your account
            </CardTitle>
            <p className="text-sm text-gray-500">
              Enter your email below to login to your account
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pt-6 pb-6">
            {/* email */}
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
              />
            </div>

            {/* password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label>Password</Label>
                <a href="#" className="text-sm text-gray-500 hover:text-black">
                  Forgot your password?
                </a>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
              />
            </div>

            {/* button */}
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-black text-white hover:bg-black/90 cursor-pointer"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* komunikaty bledow */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {/* footer */}
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/"
                className="underline hover:text-black cursor-pointer"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
