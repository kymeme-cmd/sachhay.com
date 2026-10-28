// Hook: useAuth - Quản lý đăng nhập, đăng ký, đăng xuất

import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { authAPI, ACCESS_TOKEN_KEY } from "@/api/client";
import type { AuthRegisterRequest, AuthLoginRequest, User, AuthTokens } from "@/types";

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth, setLoading, setUser } =
    useAuthStore();
  // Trạng thái gửi form đăng nhập/đăng ký (cục bộ, không ảnh hưởng route guard)
  const [isLoading, setSubmitting] = useState(false);

  const register = useCallback(
    async (data: AuthRegisterRequest) => {
      setSubmitting(true);
      try {
        const response = await authAPI.register(data);
        const resData = response.data as { user: User; tokens: AuthTokens };
        setAuth(resData.user, resData.tokens); // đăng nhập luôn sau khi đăng ký
        return resData;
      } catch (error: any) {
        throw error.response?.data || { message: "Đăng ký thất bại" };
      } finally {
        setSubmitting(false);
      }
    },
    [setAuth]
  );

  const login = useCallback(
    async (data: AuthLoginRequest) => {
      setSubmitting(true);
      try {
        const response = await authAPI.login(data);
        const resData = response.data as { user: User; tokens: AuthTokens };
        setAuth(resData.user, resData.tokens);
        return resData;
      } catch (error: any) {
        throw error.response?.data || { message: "Đăng nhập thất bại" };
      } finally {
        setSubmitting(false);
      }
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Bỏ qua lỗi khi logout, vẫn xóa local state
    }
    clearAuth();
    window.location.href = "/login";
  }, [clearAuth]);

  /** Khôi phục phiên khi tải lại trang */
  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      clearAuth();
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.me();
      setUser((response.data as { user: User }).user);
    } catch {
      clearAuth();
    }
  }, [setUser, clearAuth, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    fetchMe,
  };
}
