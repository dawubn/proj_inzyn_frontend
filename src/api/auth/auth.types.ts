// src/api/auth/auth.types.ts
export const LOGIN_ROUTE = '/';

export type UserRole = 'admin' | 'user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  surname: string;
  company?: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  surname: string | null;
  company: string | null;
  role: UserRole;
  isactive: boolean;
  isverified: boolean;
  createdat: string;
  updatedat: string;
}

export type RegisterResponse = UserResponse;
export type MeResponse = UserResponse;
