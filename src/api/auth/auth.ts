// src/api/auth/auth.ts
import type { LoginPayload, MeResponse, RegisterPayload, RegisterResponse } from './auth.types';
import { LOGIN_ROUTE } from './auth.types';

export const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  throw new Error('Missing VITE_API_URL');
}

function redirectToLogin() {
  window.location.replace(LOGIN_ROUTE);
}

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const data = (await response.json()) as unknown;

    if (typeof data === 'object' && data !== null) {
      if ('detail' in data && typeof data.detail === 'string') {
        return data.detail;
      }

      if ('message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function isUuidPlaceholder(value?: string | null): boolean {
  if (!value) {
    return false;
  }

  return /^user\s+[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

export function getUserDisplayName(
  user?: Pick<MeResponse, 'id' | 'full_name' | 'email'> | null,
): string {
  const fullname = user?.full_name?.trim();

  if (fullname && !isUuidPlaceholder(fullname)) {
    return fullname;
  }

  if (user?.id) {
    const shortId = user.id.replace(/-/g, '').slice(-6).toUpperCase();
    return `User ID:${shortId}`;
  }

  return '';
}

export async function refreshTokens(): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Session expired');
  }
}

export async function authorizedFetch(
  input: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  });

  if (response.status !== 401) {
    return response;
  }

  if (!retry) {
    redirectToLogin();
    throw new Error('Session expired');
  }

  try {
    await refreshTokens();

    return await fetch(input, {
      ...init,
      credentials: 'include',
    });
  } catch {
    redirectToLogin();
    throw new Error('Session expired');
  }
}

export async function loginUser(data: LoginPayload): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Invalid email or password'));
  }
}

export async function registerUser(data: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Registration failed'));
  }

  return response.json() as Promise<RegisterResponse>;
}

export async function getMe(): Promise<MeResponse> {
  const response = await authorizedFetch(`${API_URL}/api/v1/users/me`);

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to fetch user'));
  }

  return response.json() as Promise<MeResponse>;
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
