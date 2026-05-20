import { createContext } from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);