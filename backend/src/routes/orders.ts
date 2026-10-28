// ============================================================
// Order routes
// ============================================================

import { Hono } from "hono";
import { findOrdersByUser, createOrder, findOrderItems } from "../db/client";
import { OrderCreateSchema, validate } from "../validation/schemas";
import type { DBOrder } from "../types";
import { requireAuth, type AppEnv } from "../middleware/auth";

export const orderRoutes = new Hono<AppEnv>();

orderRoutes.use("*", requireAuth);

/** shipping_address lưu dạng JSON string trong D1 → trả về object cho client */
export function serializeOrder(order: DBOrder) {
  let shipping_address: unknown = order.shipping_address;
  try {
    shipping_address = JSON.parse(order.shipping_address);
  } catch {
    // Giữ nguyên chuỗi nếu dữ liệu cũ không phải JSON
  }
  return { ...order, shipping_address };
}

// ---------- Create order (stock deduction + inventory trong 1 batch) ----------
orderRoutes.post("/", validate("json", OrderCreateSchema), async (c) => {
  const { userId } = c.get("user");
  const { items, shipping_address, shipping_method, payment_method, note } = c.req.valid("json");

  // Tính tổng tiền từ giá trên server (không tin giá từ client)
  let total_amount = 0;
  for (const item of items) {
    const product = await findProductById(c.env.DB, item.product_id);
    if (!product) {
      return c.json(
        { error: { code: "NOT_FOUND", message: `Sản phẩm ${item.product_id} không tồn tại` } },
        404
      );
    }
    if (!product.is_active) {
      return c.json(
        { error: { code: "INACTIVE", message: `Sản phẩm ${product.name} hiện không hoạt động` } },
        400
      );
    }
    if (product.stock < item.quantity) {
      return c.json(
        {
          error: {
            code: "INSUFFICIENT_STOCK",
            message: `Sản phẩm ${product.name} chỉ còn ${product.stock} (yêu cầu: ${item.quantity})`,
          },
        },
        400
      );
    }
    total_amount += product.price * item.quantity;
  }

  const result = await createOrder(c.env.DB, {
    userId,
    items,
    total_amount,
    shipping_address: JSON.stringify(shipping_address),
    shipping_method,
    payment_method,
    note,
  });

  // Xóa giỏ hàng sau khi đặt
  await c.env.DB.prepare(
    `DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)`
  ).bind(userId).run();

  return c.json({ data: { order: serializeOrder(result.order) } }, 201);
});

// ---------- List user orders ----------
orderRoutes.get("/", async (c) => {
  const orders = await findOrdersByUser(c.env.DB, c.get("user").userId);
  const enriched = await Promise.all(
    orders.map(async (order) => ({ ...serializeOrder(order), items: await findOrderItems(c.env.DB, order.id) }))
  );
  return c.json({ data: enriched });
});

// ---------- Get order detail ----------
orderRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const order = await c.env.DB.prepare(
    `SELECT id, user_id, status, total_amount, shipping_address, shipping_method, payment_method, payment_status, note, created_at, updated_at
     FROM orders WHERE id = ? AND user_id = ?`
  ).bind(id, c.get("user").userId).first<DBOrder>();

  if (!order) {
    return c.json({ error: { code: "NOT_FOUND", message: "Đơn hàng không tồn tại" } }, 404);
  }

  return c.json({ data: { ...serializeOrder(order), items: await findOrderItems(c.env.DB, id) } });
});

async function findProductById(db: D1Database, id: string) {
  return db.prepare(
    `SELECT id, name, price, stock, is_active FROM products WHERE id = ?`
  ).bind(id).first<{ id: string; name: string; price: number; stock: number; is_active: number }>();
}
