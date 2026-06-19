import { useQuery } from '@tanstack/react-query';
import type { MeResponse } from '@/api/auth/auth.types';
import { getMe } from '@/api/auth/auth';

export function useMe() {
  return useQuery<MeResponse, Error>({
    queryKey: ['me'],
    queryFn: () => getMe(),
  });
}
