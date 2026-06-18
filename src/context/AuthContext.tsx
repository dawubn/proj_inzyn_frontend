// src/context/AuthContext.tsx
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logoutUser } from '@/api/auth/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  async function logout() {
    try {
      await logoutUser();
    } finally {
      queryClient.clear();
      window.location.replace('/');
    }
  }

  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>;
}
