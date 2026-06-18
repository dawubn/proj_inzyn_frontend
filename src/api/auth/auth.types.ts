// src/api/auth/auth.types.ts
export const LOGIN_ROUTE = '/';

export type UserRole = 'admin' | 'businessuser';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullname: string;
  role: UserRole;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  isactive: boolean;
  isverified: boolean;
  createdat: string;
  updatedat: string;
}

export type RegisterResponse = UserResponse;
export type MeResponse = UserResponse;
