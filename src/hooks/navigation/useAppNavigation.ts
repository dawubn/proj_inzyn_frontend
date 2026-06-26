import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, FileText, Settings, User } from 'lucide-react';

import { useLogout } from '@/api/auth-wrapper';
import { getBreadcrumbs } from '@/lib/breadcrumbs';

export const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'History of analysis', path: '/history', icon: History },
  { label: 'Document Analysis', path: '/document-analysis', icon: FileText },
  // { label: 'Rule profiles', path: '/rule-profiles', icon: Settings },
  // { label: 'Account details', path: '/account-details', icon: User },
];

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const logoutMutation = useLogout();

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const currentPath = location.pathname;

  function handleLogout() {
    logoutMutation.mutate();
  }

  return {
    navigate,
    currentPath,
    breadcrumbs,
    handleLogout,
  };
}
