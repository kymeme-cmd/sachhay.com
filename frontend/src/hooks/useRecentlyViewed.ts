// ============================================================
// Hook: useRecentlyViewed - Lịch sử sách đã xem (lưu trong trình duyệt)
// Không cần đăng nhập; mỗi trình duyệt có danh sách riêng.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/types";

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 24;
/** Phát ra khi danh sách thay đổi để mọi nơi đang hiển thị cập nhật theo */
const CHANGED_EVENT = "recently-viewed:changed";

/** Bản tóm tắt đủ để vẽ thẻ sách mà không cần gọi API */
export interface ViewedBook {
  id: string;
  name: string;
  author?: string | null;
  price: number;
  image_key?: string | null;
  viewed_at: number; // ms
}

function read(): ViewedBook[] {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: ViewedBook[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Trình duyệt chặn lưu trữ (chế độ riêng tư...) → bỏ qua
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Ghi nhận vừa xem một cuốn sách (đưa lên đầu danh sách) */
export function recordViewed(p: Product) {
  const entry: ViewedBook = {
    id: p.id,
    name: p.name,
    author: p.author,
    price: p.price,
    image_key: p.images?.[0]?.r2_key ?? null,
    viewed_at: Date.now(),
  };
  write([entry, ...read().filter((b) => b.id !== p.id)].slice(0, MAX_ITEMS));
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<ViewedBook[]>(read);

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync); // tab khác thay đổi
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const remove = useCallback((id: string) => write(read().filter((b) => b.id !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { items, remove, clear };
}
