// src/components/ProtectedRoute.tsx

import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '@/context/auth-context';
import { useMe } from '@/hooks/auth/useMe';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authContext = useContext(AuthContext);
  const { data: user, isLoading } = useMe();

  if (!authContext?.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
