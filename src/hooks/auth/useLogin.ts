import { useLoginApiV1AuthLoginPost } from '@/api/generated/auth/auth';
import { useQueryClient } from '@tanstack/react-query';

export function useLogin() {
  const queryClient = useQueryClient();

  return useLoginApiV1AuthLoginPost({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: [`${import.meta.env.VITE_API_URL}/api/v1/users/me`]
        });
      },
    },
    fetch: {
      credentials: 'include',
    },
  });
}
