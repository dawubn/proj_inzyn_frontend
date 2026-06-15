import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginPayload, LoginResponse } from '@/api/auth/auth.types';
import { loginUser } from '@/api/auth/auth';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: (payload) => loginUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
