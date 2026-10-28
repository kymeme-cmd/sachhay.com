// ============================================================
// Auth Store (Zustand) - Quản lý trạng thái xác thực
// Token lưu ở localStorage (access_token / refresh_token) - nơi api/client.ts đọc
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthTokens } from "@/types";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, AUTH_EXPIRED_EVENT } from "@/api/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (user, tokens) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
        set({ user, isAuthenticated: true, isLoading: false });
      },
      clearAuth: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Refresh token hết hạn → đăng xuất phía client
window.addEventListener(AUTH_EXPIRED_EVENT, () => useAuthStore.getState().clearAuth());
