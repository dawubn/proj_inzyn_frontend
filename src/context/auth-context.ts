import { createContext, useContext } from "react";

export interface AuthContextType {
  isAuthenticated: boolean | null;
  setIsAuthenticated: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthContext() {
  return useContext(AuthContext);
}