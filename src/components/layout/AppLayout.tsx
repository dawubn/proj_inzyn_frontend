import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
  History,
  FileText,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

import { getMe } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'History of analysis', path: '/history', icon: History },
  { label: 'Document Analysis', path: '/document-analysis', icon: FileText },
  { label: 'Rule profiles', path: '/rule-profiles', icon: Settings },
  { label: 'Account details', path: '/account-details', icon: User },
];

type Breadcrumb = {
  label: string;
  path: string;
};

const breadcrumbMap: Record<string, Breadcrumb[]> = {
  '/dashboard': [{ label: 'Dashboard', path: '/dashboard' }],
  '/history': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'History of analysis', path: '/history' },
  ],
  '/history/analysis-details': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'History of analysis', path: '/history' },
    { label: 'Analysis details', path: '/history/analysis-details' },
  ],
  '/document-analysis': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Document Analysis', path: '/document-analysis' },
  ],
  '/rule-profiles': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Rule profiles', path: '/rule-profiles' },
  ],
  '/account-details': [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Account details', path: '/account-details' },
  ],
};

function getBreadcrumbs(pathname: string) {
  return breadcrumbMap[pathname] ?? [{ label: 'Dashboard', path: '/dashboard' }];
}

type MenuButtonProps = {
  label: string;
  path: string;
  icon: React.ElementType;
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  function handleLogout() {
    queryClient.removeQueries({ queryKey: ['me'] });
    logout();
    setIsSidebarOpen(false);
    navigate('/', { replace: true });
  }

  function renderMenuButton({ label, path, icon: Icon }: MenuButtonProps) {
    const isActive = location.pathname === path;

    return (
      <button
        key={path}
        onClick={() => {
          navigate(path);
          setIsSidebarOpen(false);
        }}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
          isActive ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
        }`}
      >
        <Icon size={16} />
        {label}
      </button>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <header className="flex shrink-0 items-start justify-between px-8 py-6">
        <div>
          <h1
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer text-lg font-semibold transition-opacity hover:opacity-70"
          >
            CerberDoc
          </h1>

          <div className="-ml-2 mt-10 flex items-center gap-1 text-xs text-gray-500 sm:ml-0 sm:mt-4 sm:gap-3 sm:text-sm">
            {breadcrumbs.length > 1 && (
              <button
                onClick={() => navigate(breadcrumbs[breadcrumbs.length - 2].path)}
                className="cursor-pointer text-gray-700 hover:text-black"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
              </button>
            )}

            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div key={breadcrumb.path} className="flex items-center gap-1 sm:gap-3">
                  <span
                    onClick={() => {
                      if (!isLast) {
                        navigate(breadcrumb.path);
                      }
                    }}
                    className={
                      isLast ? 'font-medium text-gray-900' : 'cursor-pointer hover:text-black'
                    }
                  >
                    {breadcrumb.label}
                  </span>

                  {!isLast && <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                </div>
              );
            })}
          </div>
        </div>

        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <button className="flex cursor-pointer items-center gap-3 rounded-full hover:bg-gray-50">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  <User size={18} />
                </AvatarFallback>
              </Avatar>

              <ChevronDown size={16} className="text-gray-500" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[280px] border-l border-[#E5E5E5] bg-[#F5F5F5]/80 px-6 py-6 backdrop-blur-md [&>button]:cursor-pointer"
          >
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation</SheetTitle>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-medium">{user?.email ?? ''}</p>
                  <p className="text-xs text-gray-500">User account</p>
                </div>
              </div>
            </SheetHeader>

            <Separator className="my-6" />

            <nav className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Menu</p>
                <div className="space-y-1">{menuItems.slice(0, 4).map(renderMenuButton)}</div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Account</p>
                {renderMenuButton({
                  label: 'Account details',
                  path: '/account-details',
                  icon: User,
                })}
              </div>
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <Button
                onClick={handleLogout}
                className="w-full cursor-pointer bg-black text-white hover:bg-black/90"
              >
                <LogOut size={16} />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="px-8 pb-8 lg:min-h-0 lg:flex-1 lg:overflow-auto">
        <div className="rounded-sm bg-white lg:h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
