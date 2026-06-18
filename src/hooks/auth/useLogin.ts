// src/hooks/auth/useLogin.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginPayload, MeResponse } from '@/api/auth/auth.types';
import { getMe, loginUser } from '@/api/auth/auth';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, LoginPayload>({
    mutationFn: loginUser,
    onSuccess: async () => {
      await queryClient.fetchQuery<MeResponse>({
        queryKey: ['me'],
        queryFn: getMe,
      });
    },
  });
}
