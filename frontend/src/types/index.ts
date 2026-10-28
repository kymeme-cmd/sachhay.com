// ============================================================
// Shared TypeScript Types for Bookstore Frontend
// ============================================================

export type Role = "customer" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  created_at: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  r2_key: string;
  alt_text?: string | null;
  is_primary: number;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  author?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  sku?: string | null;
  is_active: number;
  created_at?: number;
  updated_at?: number;
  images?: Pick<ProductImage, "r2_key">[] | ProductImage[];
  category?: Category | null;
  avg_rating?: number | null;
  review_count?: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment?: string | null;
  created_at: number;
  updated_at: number;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: Record<number, number>;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  created_at: number;
  updated_at: number;
  product?: Product;
}

export interface OrderStatus {
  pending: "pending";
  confirmed: "confirmed";
  shipped: "shipped";
  delivered: "delivered";
  cancelled: "cancelled";
  refunded: "refunded";
}

export type OrderStatusValue = keyof OrderStatus;

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  name?: string;
  slug?: string;
  author?: string | null;
  image_key?: string | null;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatusValue;
  total_amount: number;
  shipping_address: ShippingAddress | string;
  shipping_method?: string | null;
  payment_method: "cod" | "bank_transfer" | "credit_card";
  payment_status: "unpaid" | "paid" | "failed" | "refunded";
  note?: string | null;
  created_at: number;
  updated_at: number;
  items?: OrderItem[];
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note?: string;
}

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

export interface ProductCreateRequest {
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  is_active?: boolean;
}

export interface CartItemRequest {
  product_id: string;
  quantity: number;
}

export interface OrderCreateRequest {
  items: Array<{ product_id: string; quantity: number }>;
  shipping_address: ShippingAddress;
  shipping_method: string;
  payment_method: "cod" | "bank_transfer" | "credit_card";
  note?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}