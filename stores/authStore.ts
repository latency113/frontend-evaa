import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "ADMIN" | "EVALUATOR" | "EVALUATEE";

export interface User {
  id: string;
  username: string;
  role: Role;
  name?: string;
  email?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: "auth-storage", // stores auth tokens to local storage automatically
    }
  )
);
