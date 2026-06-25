import { useGetMeApiV1UsersMeGet } from '@/api/generated/users/users';
import type { UserResponse } from '@/api/generated/model';
import { useMemo } from 'react';

export function useMe() {
  const response = useGetMeApiV1UsersMeGet({
    query: {
      retry: false,
    },
    fetch: {
      credentials: 'include',
    },
  });

  const data = useMemo(() => {
    if (response.data?.status === 200) {
      return response.data.data as UserResponse;
    }
    return undefined;
  }, [response.data]);

  return { data, isLoading: response.isLoading, isFetching: response.isFetching };
}
