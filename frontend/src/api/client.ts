// API Client for Bookstore Frontend
//
// Backend trả về { data, meta? } khi thành công và { error: { code, message } } khi lỗi.
// Interceptor bên dưới "mở gói" để code gọi API dùng trực tiếp:
//   - response.data  = payload (phần `data` của backend)
//   - response.meta  = thông tin phân trang (nếu có)
//   - err.response.data.message = thông báo lỗi tiếng Việt từ backend

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";

declare global {
  interface ImportMetaEnv {
    VITE_API_URL?: string;
  }
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

declare module "axios" {
  interface AxiosResponse {
    meta?: { page: number; per_page: number; total: number; total_pages: number };
  }
}

export const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

/** Sự kiện phát ra khi phiên đăng nhập hết hạn (store auth lắng nghe để đăng xuất) */
export const AUTH_EXPIRED_EVENT = "auth:expired";
/** Sự kiện phát ra khi giỏ hàng thay đổi (Navbar cập nhật số lượng) */
export const CART_CHANGED_EVENT = "cart:changed";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

function unwrap(response: AxiosResponse): AxiosResponse {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    response.meta = body.meta;
    response.data = body.data;
  }
  return response;
}

function normalizeError(error: AxiosError): AxiosError {
  const body = error.response?.data as any;
  if (body?.error?.message) {
    error.response!.data = { ...body, code: body.error.code, message: body.error.message };
  } else if (error.response) {
    error.response.data = { message: "Có lỗi xảy ra, vui lòng thử lại" };
  } else {
    // Không kết nối được server
    (error as any).response = { data: { message: "Không thể kết nối tới máy chủ" } };
  }
  return error;
}

// Request interceptor: gắn access token vào header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dùng chung 1 lần refresh khi nhiều request cùng nhận 401
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error("No refresh token");

  const response = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
  const { access_token } = response.data.data as { access_token: string };
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  return access_token;
}

// Response interceptor: mở gói dữ liệu, tự refresh token khi 401
api.interceptors.response.use(unwrap, async (error: AxiosError) => {
  const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  const isAuthEndpoint = originalRequest?.url?.startsWith("/auth/") ?? false;

  if (
    error.response?.status === 401 &&
    originalRequest &&
    !originalRequest._retry &&
    !isAuthEndpoint &&
    localStorage.getItem(REFRESH_TOKEN_KEY)
  ) {
    originalRequest._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
      const accessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
  }

  return Promise.reject(normalizeError(error));
});

/** Phát sự kiện thay đổi giỏ hàng sau khi request thành công */
function notifyCart<T>(promise: Promise<T>): Promise<T> {
  return promise.then((res) => {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
    return res;
  });
}

// ============================================================
// Auth API
// ============================================================

export const authAPI = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }),
  logout: () => api.post("/auth/logout", { refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined }),
  me: () => api.get("/auth/me"),
};

// ============================================================
// Products API
// ============================================================

export interface ProductListParams {
  category_id?: string;
  search?: string;
  page?: number;
  per_page?: number;
  min_price?: number;
  max_price?: number;
  sort_by?: "created_at" | "price" | "name" | "relevance";
  sort_dir?: "ASC" | "DESC";
}

export const productAPI = {
  list: (params?: ProductListParams, config?: { signal?: AbortSignal }) =>
    api.get("/products", { params, signal: config?.signal }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: { name: string; description?: string; price: number; stock: number; category_id?: string; sku?: string; is_active?: boolean }) =>
    api.post("/products", data),
  update: (id: string, data: Partial<{ name: string; description: string; price: number; stock: number; category_id: string; sku: string; is_active: boolean }>) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  addImage: (id: string, data: { r2_key: string; alt_text?: string; is_primary?: boolean }) =>
    api.post(`/products/${id}/images`, data),
  deleteImage: (id: string, imageId: string) => api.delete(`/products/${id}/images/${imageId}`),
};

// ============================================================
// Upload API (R2)
// ============================================================

export const uploadAPI = {
  image: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload/image", form, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

// ============================================================
// Categories API
// ============================================================

export const categoryAPI = {
  list: () => api.get("/categories"),
  get: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string; slug?: string; parent_id?: string }) =>
    api.post("/categories", data),
  update: (id: string, data: Partial<{ name: string; slug: string; parent_id: string }>) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ============================================================
// Cart API
// ============================================================

export const cartAPI = {
  get: () => api.get("/cart"),
  add: (data: { product_id: string; quantity: number }) => notifyCart(api.post("/cart/items", data)),
  update: (itemId: string, quantity: number) =>
    notifyCart(api.put(`/cart/items/${itemId}`, { quantity })),
  remove: (itemId: string) => notifyCart(api.delete(`/cart/items/${itemId}`)),
  clear: () => notifyCart(api.delete("/cart")),
};

// ============================================================
// Orders API
// ============================================================

export const orderAPI = {
  list: () => api.get("/orders"),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: {
    items: Array<{ product_id: string; quantity: number }>;
    shipping_address: { name: string; phone: string; address: string; city: string; district: string; ward: string; note?: string };
    shipping_method: string;
    payment_method: "cod" | "bank_transfer" | "credit_card";
    note?: string;
  }) => notifyCart(api.post("/orders", data)),
};

// ============================================================
// Admin API
// ============================================================

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  listUsers: () => api.get("/admin/users"),
  listOrders: () => api.get("/admin/orders"),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  listProducts: () => api.get("/admin/products"),
  createProduct: (data: any) => api.post("/admin/products", data),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  listCategories: () => api.get("/admin/categories"),
  createCategory: (data: any) => api.post("/admin/categories", data),
  updateCategory: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
};
