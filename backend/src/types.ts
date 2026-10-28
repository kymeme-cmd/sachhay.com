// ============================================================
// Shared TypeScript Types for E-commerce Backend
// ============================================================

export type Role = "customer" | "admin" | "super_admin";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentMethod = "cod" | "bank_transfer" | "credit_card";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";
export type InventoryType = "sale" | "restock" | "adjustment" | "return";

// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  R2?: R2Bucket; // tùy chọn: production có thể chưa bật R2
  KV: KVNamespace;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  CORS_ORIGINS?: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ============================================================
// Database Row Types (from D1)
// ============================================================

export interface DBUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  role: Role;
  created_at: number;
  updated_at: number;
}

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface DBProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  author: string | null;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface DBProductImage {
  id: string;
  product_id: string;
  r2_key: string;
  alt_text: string | null;
  is_primary: number;
  sort_order: number;
  created_at: number;
}

export interface DBCart {
  id: string;
  user_id: string;
  created_at: number;
  updated_at: number;
}

export interface DBCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: number;
  updated_at: number;
}

export interface DBOrder {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;  // JSON string
  shipping_method: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  note: string | null;
  created_at: number;
  updated_at: number;
}

export interface DBOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: number;
}

export interface DBInventoryTransaction {
  id: string;
  product_id: string;
  type: InventoryType;
  quantity: number;
  reference_id: string | null;
  note: string | null;
  created_at: number;
}

export interface DBSession {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: number;
  created_at: number;
}

export interface DBSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: number;
}

// ============================================================
// API Request/Response Payload Types
// ============================================================

export interface AuthRegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
}

export interface ProductCreateRequest {
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  is_active?: boolean;
}

export interface ProductUpdateRequest {
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  is_active?: boolean;
}

export interface CartItemRequest {
  product_id: string;
  quantity: number;
}

export interface OrderCreateRequest {
  items: Array<{ product_id: string; quantity: number }>;
  shipping_address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    note?: string;
  };
  shipping_method: string;
  payment_method: PaymentMethod;
  note?: string;
}

export interface InventoryAdjustRequest {
  product_id: string;
  type: InventoryType;
  quantity: number;
  reference_id?: string;
  note?: string;
}

// ============================================================
// Token / Auth Types
// ============================================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}
