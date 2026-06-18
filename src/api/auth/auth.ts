// src/api/auth/auth.ts

import {
  type LoginPayload,
  type LoginResponse,
  type RegisterPayload,
  type RegisterResponse,
  type MeResponse,
  type RefreshResponse,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  LOGIN_ROUTE,
} from './auth.types';

export const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  throw new Error('Missing VITE_API_URL');
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function redirectToLogin() {
  window.location.replace(LOGIN_ROUTE);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function extractErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof (data as Record<string, unknown>).detail === 'string'
    ) {
      return (data as Record<string, unknown>).detail as string;
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as Record<string, unknown>).message === 'string'
    ) {
      return (data as Record<string, unknown>).message as string;
    }
    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

// Executes fetch with HttpOnly cookies. Tokens are in secure cookies, not localStorage.
export async function authorizedFetch(input: string, init: RequestInit = {}, retry = true) {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  });

  if (response.status !== 401) {
    return response;
  }

  if (!retry) {
    clearTokens();
    redirectToLogin();
    throw new Error('Session expired');
  }

  try {
    const refreshResponse = await fetch(input, {
      ...init,
      credentials: 'include',
      method: 'POST',
    });

    if (!refreshResponse.ok) {
      clearTokens();
      redirectToLogin();
      throw new Error('Session expired');
    }

    return refreshResponse;
  } catch {
    clearTokens();
    redirectToLogin();
    throw new Error('Session expired');
  }
}

export async function loginUser(data: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Invalid email or password'));
  }

  const result = await parseJsonResponse<LoginResponse>(response);
  setTokens(result.access_token, result.refresh_token);
  return result;
}

export async function registerUser(data: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Registration failed'));
  }

  return parseJsonResponse<RegisterResponse>(response);
}

export async function getMe(): Promise<MeResponse> {
  const response = await authorizedFetch(`${API_URL}/api/v1/users/me`);

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'Failed to fetch user'));
  }

  return parseJsonResponse<MeResponse>(response);
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    redirectToLogin();
    throw new Error('Missing refresh token');
  }

  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    clearTokens();
    redirectToLogin();
    throw new Error('Session expired');
  }

  const data = await parseJsonResponse<RefreshResponse>(response);
  setTokens(data.access_token, data.refresh_token);

  return data.access_token;
}

export function logoutUser() {
  clearTokens();
  redirectToLogin();
}
