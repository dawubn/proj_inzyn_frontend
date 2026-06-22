import { Navigate } from 'react-router-dom';
import { useMe } from '@/hooks/auth/useMe';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: response, isLoading } = useMe();

  if (isLoading) {
    return null;
  }

  if (!response || response.status !== 200) {
    return <Navigate to="/" replace />;
  }

  return children;
}
