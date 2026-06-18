import { useGetMeApiV1UsersMeGet } from '@/api/generated/users/users';
import type { UserResponse } from '@/api/generated/model';

export function useMe() {
  return useGetMeApiV1UsersMeGet({
    query: {
      retry: false,
      select: (response): UserResponse | undefined => {
        if (response.status === 200) {
          return response.data as UserResponse;
        }
        return undefined;
      },
    },
    fetch: {
      credentials: 'include',
    },
  });
}
