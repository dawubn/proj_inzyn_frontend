// src/context/auth-context.ts
import { createContext } from 'react';

export interface AuthContextType {
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
