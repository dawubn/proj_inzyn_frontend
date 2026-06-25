import { useQueryClient } from '@tanstack/react-query';
import {
  useLoginApiV1AuthLoginPost,
  useRegisterApiV1AuthRegisterPost,
  useLogoutApiV1AuthLogoutPost,
} from '@/api/generated/auth/auth';
import { useGetMeApiV1UsersMeGet } from '@/api/generated/users/users';

export const LOGIN_ROUTE = '/';


export function useLogin() {
  const queryClient = useQueryClient();

  return useLoginApiV1AuthLoginPost({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['/api/v1/users/me'] });
      },
    },
    fetch: {
      credentials: 'include',
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useRegisterApiV1AuthRegisterPost({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['/api/v1/users/me'] });
      },
    },
    fetch: {
      credentials: 'include',
    },
  });
}

export function useMe() {
  return useGetMeApiV1UsersMeGet({
    fetch: {
      credentials: 'include',
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useLogoutApiV1AuthLogoutPost({
    mutation: {
      onSuccess: () => {
        void queryClient.removeQueries({ queryKey: ['/api/v1/users/me'] });
        window.location.replace(LOGIN_ROUTE);
      },
      onError: () => {
        window.location.replace(LOGIN_ROUTE);
      },
    },
    fetch: {
      credentials: 'include',
    },
  });
}

export function logoutUser() {
  window.location.replace(LOGIN_ROUTE);
}
