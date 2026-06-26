import { Navigate } from 'react-router-dom';
import { useMe } from '@/hooks/auth/useMe';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isFetching } = useMe();

  if (isLoading || (isFetching && !user)) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
