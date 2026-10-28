// ============================================================
// Hook: useAddToCart - Thêm sách vào giỏ, báo kết quả bằng toast
// Không chuyển trang; Navbar tự cập nhật số lượng qua CART_CHANGED_EVENT
// ============================================================

import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { cartAPI, ACCESS_TOKEN_KEY } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import type { Product } from "@/types";

export function useAddToCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();

  return useCallback(
    async (product: Pick<Product, "id" | "name">, quantity = 1): Promise<boolean> => {
      // Trạng thái "đã đăng nhập" còn lưu nhưng token đã mất → coi như chưa đăng nhập
      if (isAuthenticated && !localStorage.getItem(ACCESS_TOKEN_KEY)) clearAuth();
      if (!isAuthenticated || !localStorage.getItem(ACCESS_TOKEN_KEY)) {
        toast.info("Vui lòng đăng nhập để thêm sách vào giỏ hàng.", {
          label: "Đăng nhập",
          to: `/login?from=${encodeURIComponent(location.pathname + location.search)}`,
        });
        return false;
      }
      try {
        await cartAPI.add({ product_id: product.id, quantity });
        toast.success(`Đã thêm "${product.name}"${quantity > 1 ? ` (×${quantity})` : ""} vào giỏ hàng.`, {
          label: "Xem giỏ hàng",
          to: "/cart",
        });
        return true;
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không thể thêm vào giỏ hàng");
        return false;
      }
    },
    [isAuthenticated, clearAuth, location.pathname, location.search]
  );
}
