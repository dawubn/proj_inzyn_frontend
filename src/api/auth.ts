// src/api/auth.ts

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

const API_URL = import.meta.env.VITE_API_URL as string;

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
    const data = await response.json();
    if (typeof (data as any)?.detail === 'string') return (data as any).detail;
    if (typeof (data as any)?.message === 'string') return (data as any).message;
    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function authorizedFetch(input: string, init: RequestInit = {}, retry = true) {
  const token = getAccessToken();

  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: token ? `Bearer ${token}` : '',
    },
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
    const newAccessToken = await refreshAccessToken();

    return fetch(input, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
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
