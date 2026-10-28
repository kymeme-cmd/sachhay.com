/**
 * Image URL utilities for Cloudflare R2
 *
 * Mặc định ảnh được phục vụ qua backend: GET /api/images/<r2_key>.
 * Nếu bucket R2 có domain public, đặt VITE_R2_PUBLIC_URL=https://cdn.example.com để tải trực tiếp.
 */

import { API_BASE } from "@/api/client";

declare global {
  interface ImportMetaEnv {
    VITE_R2_PUBLIC_URL?: string;
  }
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

// Public R2 bucket URL (tùy chọn)
export const R2_BASE_URL = import.meta.env.VITE_R2_PUBLIC_URL;

// Build the full URL for a given r2_key
export function getProductImageUrl(r2Key: string | null | undefined): string {
  if (!r2Key) {
    return fallbackImageUrl();
  }

  const cleanKey = r2Key.replace(/^\/|\/$/g, "");
  const base = R2_BASE_URL || `${API_BASE}/images`;
  return `${base.replace(/\/$/, "")}/${cleanKey}`;
}

// Placeholder SVG khi sản phẩm chưa có ảnh
export function fallbackImageUrl(): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E`;
}

// Helper for null/undefined r2Key
export function getImageUrl(r2Key: string | null | undefined): string {
  return getProductImageUrl(r2Key);
}
