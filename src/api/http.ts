// src/api/http.ts

import { ACCESS_TOKEN_KEY } from './auth/auth.types';

const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  throw new Error('Missing VITE_API_URL');
}

export function getApiUrl() {
  return API_URL;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthHeaders() {
  const token = getAccessToken();

  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
}
