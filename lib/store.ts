import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserInfo {
  name: string;
  email: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      login: (token, user) => {
        set({ user, token, isLoggedIn: true });
      },

      logout: () => {
        set({ user: null, token: null, isLoggedIn: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
