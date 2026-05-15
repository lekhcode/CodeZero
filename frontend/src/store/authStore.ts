import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PublicUser } from "@/types/api.types";
import { tokenStorage } from "@/utils/storage";

type AuthState = {
  user: PublicUser | null;
  isAuthenticated: boolean;
  setSession: (user: PublicUser, token: string) => void;
  setUser: (user: PublicUser) => void;
  logout: () => void;
};

/**
 * Client session state — JWT in localStorage, user profile in persisted Zustand.
 * React Query owns server data; this store only holds auth identity for routing/guards.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user, token) => {
        tokenStorage.set(token);
        set({ user, isAuthenticated: true });
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "codezero-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
