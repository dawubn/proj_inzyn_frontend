import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useAuthContext } from '@/context/auth-context';
import LegalLinks from '@/components/public/LegalLinks';

type PublicPageProps = {
  children: React.ReactNode;
  /** Narrow pages hold a single card, wide ones longer text */
  width?: 'narrow' | 'wide';
};

// Pages open to everyone (contact, terms, privacy), also from inside the app
export default function PublicPage({ children, width = 'wide' }: PublicPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useAuthContext();

  // The login page logs out a signed-in user, so they go back to the dashboard instead
  const homePath = authContext?.isAuthenticated ? '/dashboard' : '/';

  function goBack() {
    // A page opened directly (new tab, typed address) has no history inside the app
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(homePath);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <Link to={homePath} className="text-lg font-semibold hover:opacity-70">
          CerberDoc
        </Link>

        <button
          type="button"
          onClick={goBack}
          className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </header>

      <main
        className={`mx-auto w-full flex-1 px-4 pb-12 ${width === 'narrow' ? 'max-w-[440px]' : 'max-w-3xl'}`}
      >
        {children}
      </main>

      <footer className="border-t border-gray-100 px-4 py-6">
        <LegalLinks className="justify-center" />
      </footer>
    </div>
  );
}
