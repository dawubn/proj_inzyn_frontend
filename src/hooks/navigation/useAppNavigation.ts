// src/hooks/navigation/useAppNavigation.ts

import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, History, FileText, Settings, User } from 'lucide-react';

import { AuthContext } from '@/context/auth-context';
import { getBreadcrumbs } from '@/lib/breadcrumbs';

export const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'History of analysis', path: '/history', icon: History },
  { label: 'Document Analysis', path: '/document-analysis', icon: FileText },
  { label: 'Rule profiles', path: '/rule-profiles', icon: Settings },
  { label: 'Account details', path: '/account-details', icon: User },
];

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { logout } = useContext(AuthContext)!;

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const currentPath = location.pathname;

  // logout() clears localStorage tokens and updates AuthContext state,
  // queryClient.clear() wipes all cached query data including user info —
  // both must happen before navigate to prevent stale data re-render on route change.
  function handleLogout() {
    logout();
    queryClient.clear();
    navigate('/', { replace: true });
  }

  return {
    navigate,
    currentPath,
    breadcrumbs,
    handleLogout,
  };
}
