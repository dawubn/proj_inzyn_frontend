// src/hooks/auth/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LoginPayload,
  RegisterPayload,
  LoginResponse,
  RegisterResponse,
  MeResponse,
} from '@/api/auth/auth.types';
import { getMe, loginUser, registerUser } from '@/api/auth/auth';

export function useMe() {
  return useQuery<MeResponse, Error>({
    queryKey: ['me'],
    queryFn: () => getMe(),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: (payload) => loginUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: (payload) => registerUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
