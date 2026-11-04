import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, History, FileText, Settings, User } from 'lucide-react';

import { useLogout } from '@/api/auth-wrapper';
import { fetchAllDocuments, getAnalysisStatus } from '@/api/documents-wrapper';
import { getBreadcrumbAnalysisId, getBreadcrumbs } from '@/lib/breadcrumbs';

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
  const logoutMutation = useLogout();

  const currentPath = location.pathname;
  const analysisId = getBreadcrumbAnalysisId(location.pathname, location.search);

  // Same query keys as the pages use, so the data usually comes straight from the cache
  const { data: analysis } = useQuery({
    queryKey: ['analysis-status', analysisId],
    queryFn: () => getAnalysisStatus(analysisId as string),
    enabled: !!analysisId,
    staleTime: 30_000,
  });

  const { data: documents } = useQuery({
    queryKey: ['user-documents-all'],
    queryFn: fetchAllDocuments,
    enabled: !!analysisId,
    staleTime: 30_000,
  });

  const documentName = documents?.find(
    (document) => document.id === analysis?.document_id,
  )?.original_filename;

  const analysisLabel = analysisId
    ? `${documentName ?? 'Analysis'} (ID: ${analysisId.slice(0, 8)})`
    : null;

  const breadcrumbs = getBreadcrumbs(location.pathname, location.search, analysisLabel);

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
