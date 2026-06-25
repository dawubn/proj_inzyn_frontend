import { useRegister as useRegisterBase } from '@/api/auth-wrapper';
import type { UserCreate } from '@/api/generated/model';

export function useRegister() {
  const result = useRegisterBase();

  return {
    ...result,
    mutate: (payload: UserCreate) => {
      result.mutate({ data: payload });
    },
    mutateAsync: (payload: UserCreate) => {
      return result.mutateAsync({ data: payload });
    },
  };
}
