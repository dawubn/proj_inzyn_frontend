import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RegisterPayload, RegisterResponse } from '@/api/auth/auth.types';
import { registerUser } from '@/api/auth/auth';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: (payload) => registerUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
