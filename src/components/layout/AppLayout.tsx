// src/components/layout/AppLayout.tsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ChevronDown, ChevronRight, ArrowLeft, User, LogOut } from 'lucide-react';

import { useMe } from '@/hooks/auth/useMe';
import { useLogout } from '@/api/auth-wrapper';
import { useAppNavigation, menuItems } from '@/hooks/navigation/useAppNavigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

type MenuButtonProps = {
  label: string;
  path: string;
  icon: React.ElementType;
};

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: user } = useMe();
  const { navigate, currentPath, breadcrumbs } = useAppNavigation();
  const logoutMutation = useLogout();

  function handleLogoutClick() {
    logoutMutation.mutate();
    setIsSidebarOpen(false);
  }

  const formatRole = (role) => {
    if (!role?.trim()) return '—';

    return role
      .trim()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  function renderMenuButton({ label, path, icon: Icon }: MenuButtonProps) {
    const isActive = currentPath === path;

    return (
      <button
        key={path}
        onClick={() => {
          navigate(path);
          setIsSidebarOpen(false);
        }}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${isActive ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
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
                      if (!isLast) navigate(breadcrumb.path);
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
              <SheetDescription className="sr-only">
                Application navigation and user account options
              </SheetDescription>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-medium">{user?.email ?? '—'}</p>
                  <p className="text-xs text-gray-500">{formatRole(user?.role)}</p>
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
                onClick={handleLogoutClick}
                disabled={logoutMutation.isPending}
                className="w-full cursor-pointer bg-black text-white hover:bg-black/90 disabled:opacity-50"
              >
                <LogOut size={16} />
                {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
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
