import { Link } from 'react-router-dom';

type LegalLinksProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function LegalLinks({ className = '', onNavigate }: LegalLinksProps) {
  const links = [
    { to: '/terms', label: 'Terms of Service' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/contact', label: 'Contact us' },
  ];

  return (
    <nav
      aria-label="Legal"
      className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 ${className}`}
    >
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className="underline-offset-2 hover:text-black hover:underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
