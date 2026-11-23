// src/pages/NotFound.tsx

import { Link } from 'react-router-dom';

import PublicPage from '@/components/public/PublicPage';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/auth-context';

// Any address the application does not know, instead of an empty page
export default function NotFound() {
  const authContext = useAuthContext();
  const isLoggedIn = authContext?.isAuthenticated === true;

  return (
    <PublicPage width="narrow">
      <div className="mt-12 space-y-4 text-center sm:mt-24">
        <p className="text-sm font-medium text-gray-500">404</p>
        <h1 className="text-xl font-semibold text-gray-900">Page not found</h1>
        <p className="text-sm leading-6 text-gray-600">
          The page you are looking for does not exist or has been moved. Check the address or go
          back to the start.
        </p>
        <Button asChild className="h-10 cursor-pointer bg-black px-5 text-white hover:bg-black/90">
          <Link to={isLoggedIn ? '/dashboard' : '/'}>
            {isLoggedIn ? 'Go to dashboard' : 'Go to login'}
          </Link>
        </Button>
      </div>
    </PublicPage>
  );
}
