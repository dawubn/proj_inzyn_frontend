import { useQueryClient } from '@tanstack/react-query';

import {
  getGetMeApiV1UsersMeGetQueryKey,
  useUpdateMeApiV1UsersMePatch,
} from '@/api/generated/users/users';
import type { UserProfileUpdate } from '@/api/generated/model';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  const result = useUpdateMeApiV1UsersMePatch({
    mutation: {
      onSuccess: (response) => {
        if (response.status === 200) {
          void queryClient.invalidateQueries({ queryKey: getGetMeApiV1UsersMeGetQueryKey() });
        }
      },
    },
    fetch: {
      credentials: 'include',
    },
  });

  return {
    ...result,
    mutateAsync: (payload: UserProfileUpdate) => result.mutateAsync({ data: payload }),
  };
}
