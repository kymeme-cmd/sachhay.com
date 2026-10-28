// ============================================================
// Hook: useCart - Quản lý giỏ hàng
// Mọi instance của hook tự đồng bộ qua sự kiện CART_CHANGED_EVENT
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { cartAPI, CART_CHANGED_EVENT } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import type { CartItem } from "@/types";

interface UseCartReturn {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  total: number;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export function useCart(): UseCartReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const activeItems = items.filter((item) => item.product?.is_active !== 0);
  const total = activeItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    // Chỉ hiện trạng thái loading ở lần tải đầu, các lần đồng bộ sau cập nhật ngầm
    if (!loadedRef.current) setLoading(true);
    setError(null);
    try {
      const response = await cartAPI.get();
      const data = response.data as { items: CartItem[] };
      setItems(data.items || []);
      loadedRef.current = true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // cartAPI phát CART_CHANGED_EVENT sau mỗi thay đổi → không cần gọi fetchCart thủ công
  const run = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    setError(null);
    try {
      await action();
    } catch (err: any) {
      setError(err.response?.data?.message || fallback);
    }
  }, []);

  const addItem = useCallback(
    (productId: string, quantity: number) =>
      run(() => cartAPI.add({ product_id: productId, quantity }), "Không thể thêm vào giỏ hàng"),
    [run]
  );

  const updateItem = useCallback(
    (itemId: string, quantity: number) =>
      run(() => cartAPI.update(itemId, quantity), "Không thể cập nhật giỏ hàng"),
    [run]
  );

  const removeItem = useCallback(
    (itemId: string) => run(() => cartAPI.remove(itemId), "Không thể xóa sản phẩm khỏi giỏ hàng"),
    [run]
  );

  const clearCart = useCallback(() => run(() => cartAPI.clear(), "Không thể xóa giỏ hàng"), [run]);

  useEffect(() => {
    fetchCart();
    window.addEventListener(CART_CHANGED_EVENT, fetchCart);
    return () => window.removeEventListener(CART_CHANGED_EVENT, fetchCart);
  }, [fetchCart]);

  return {
    items,
    loading,
    error,
    total,
    itemCount,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
}
