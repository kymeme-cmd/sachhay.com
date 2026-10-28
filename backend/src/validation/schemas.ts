// ============================================================
// Zod validation schemas for all API requests
// ============================================================

import { z, type ZodSchema } from "zod";
import { zValidator } from "@hono/zod-validator";

/** zValidator trả lỗi theo định dạng chung { error: { code, message } } */
export const validate = <T extends ZodSchema, Target extends "json" | "query">(target: Target, schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      return c.json(
        { error: { code: "VALIDATION", message: issue?.message ?? "Dữ liệu không hợp lệ" } },
        400
      );
    }
    return undefined;
  });

// ---------- Auth ----------
export const RegisterSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  name: z.string().min(1, "Tên không được để trống"),
  phone: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export const RefreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token không được để trống"),
});

export const LogoutSchema = z.object({
  refresh_token: z.string().optional(),
});

// ---------- Categories ----------
export const CategoryCreateSchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống"),
  slug: z.string().optional(), // bỏ trống → tự sinh từ tên
  parent_id: z.string().optional().nullable(),
});

export const CategoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(), // bỏ trống → giữ nguyên
  parent_id: z.string().optional().nullable(),
});

// ---------- Products ----------
export const ProductCreateSchema = z.object({
  category_id: z.string().optional().nullable(),
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  author: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  stock: z.number().int().min(0, "Tồn kho phải là số nguyên không âm"),
  sku: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const ProductUpdateSchema = z.object({
  category_id: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  author: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const ProductListQuerySchema = z.object({
  category_id: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  per_page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  min_price: z.string().optional().transform((val) => (val && !isNaN(Number(val)) ? Math.max(0, Number(val)) : undefined)),
  max_price: z.string().optional().transform((val) => (val && !isNaN(Number(val)) ? Math.max(0, Number(val)) : undefined)),
  sort_by: z.enum(["created_at", "price", "name", "relevance"]).optional().default("created_at"),
  sort_dir: z.enum(["ASC", "DESC"]).optional().default("DESC"),
});

// ---------- Cart ----------
export const CartItemAddSchema = z.object({
  product_id: z.string().min(1, "ID sản phẩm không được để trống"),
  quantity: z.number().int().min(1, "Số lượng phải ít nhất 1"),
});

export const CartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1, "Số lượng phải ít nhất 1"),
});

// ---------- Orders ----------
export const OrderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "Phải có ít nhất một sản phẩm"),
  shipping_address: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    ward: z.string().min(1),
    note: z.string().optional(),
  }),
  shipping_method: z.string().min(1),
  payment_method: z.enum(["cod", "bank_transfer", "credit_card"]),
  note: z.string().optional(),
});

// ---------- Reviews ----------
export const ReviewUpsertSchema = z.object({
  rating: z.number().int().min(1, "Chọn từ 1 đến 5 sao").max(5, "Chọn từ 1 đến 5 sao"),
  comment: z.string().max(1000, "Nhận xét tối đa 1000 ký tự").optional().nullable(),
});

// ---------- Chatbot ----------
export const ChatSchema = z.object({
  message: z.string().trim().min(1, "Vui lòng nhập câu hỏi").max(500, "Câu hỏi tối đa 500 ký tự"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(6)
    .optional(),
});

// ---------- Admin Order ----------
export const OrderStatusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
});

// ---------- Inventory ----------
export const InventoryAdjustSchema = z.object({
  product_id: z.string().min(1),
  type: z.enum(["sale", "restock", "adjustment", "return"]),
  quantity: z.number().int().min(0), // adjustment: tồn kho mới; loại khác: số lượng thay đổi
  reference_id: z.string().optional(),
  note: z.string().optional(),
});