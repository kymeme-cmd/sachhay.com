// ============================================================
// Admin routes: stats, users, orders, products, categories, inventory
// ============================================================

import { Hono } from "hono";
import { findProductById, createInventoryTransaction, findInventoryTransactionsByProduct, findOrderItems } from "../db/client";
import {
  OrderStatusUpdateSchema,
  InventoryAdjustSchema,
  ProductCreateSchema,
  ProductUpdateSchema,
  CategoryCreateSchema,
  CategoryUpdateSchema,
  validate,
} from "../validation/schemas";
import type { DBOrder } from "../types";
import { requireAdmin, type AppEnv } from "../middleware/auth";
import { insertProduct, updateProductHandler, deleteProductHandler } from "./products";
import { createCategoryHandler, updateCategoryHandler, deleteCategoryHandler } from "./categories";
import { serializeOrder } from "./orders";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", requireAdmin);

// ---------- Stats ----------
adminRoutes.get("/stats", async (c) => {
  const db = c.env.DB;
  const count = (table: string) => db.prepare(`SELECT COUNT(*) as c FROM ${table}`).first<number>("c");

  const [users, orders, products, categories, revenue, pending] = await Promise.all([
    count("users"),
    count("orders"),
    count("products"),
    count("categories"),
    // Doanh thu: đơn đã thanh toán hoặc đã giao (COD), trừ đơn hủy/hoàn
    db.prepare(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
       WHERE status NOT IN ('cancelled', 'refunded') AND (payment_status = 'paid' OR status = 'delivered')`
    ).first<number>("total"),
    db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'pending'`).first<number>("c"),
  ]);

  return c.json({
    data: { users, orders, products, categories, revenue, pending_orders: pending },
  });
});

// ---------- Users ----------
adminRoutes.get("/users", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC`
  ).all();
  return c.json({ data: results });
});

// ---------- Orders (all) ----------
adminRoutes.get("/orders", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT o.id, o.user_id, o.status, o.total_amount, o.shipping_address, o.shipping_method, o.payment_method,
            o.payment_status, o.note, o.created_at, o.updated_at, u.name, u.email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  ).all<DBOrder & { name: string; email: string }>();

  const enriched = await Promise.all(
    results.map(async (order) => ({ ...serializeOrder(order), items: await findOrderItems(c.env.DB, order.id) }))
  );

  return c.json({ data: enriched });
});

// ---------- Update order status ----------
adminRoutes.put("/orders/:id/status", validate("json", OrderStatusUpdateSchema), async (c) => {
  const { id } = c.req.param();
  const { status } = c.req.valid("json");
  const db = c.env.DB;

  const order = await db.prepare(`SELECT id, status, payment_method, payment_status FROM orders WHERE id = ?`)
    .bind(id).first<Pick<DBOrder, "id" | "status" | "payment_method" | "payment_status">>();
  if (!order) {
    return c.json({ error: { code: "NOT_FOUND", message: "Đơn hàng không tồn tại" } }, 404);
  }

  const wasReleased = order.status === "cancelled" || order.status === "refunded";
  const releases = status === "cancelled" || status === "refunded";
  if (wasReleased && !releases) {
    return c.json({ error: { code: "INVALID_STATUS", message: "Không thể mở lại đơn đã hủy/hoàn tiền" } }, 400);
  }

  const statements: D1PreparedStatement[] = [];

  // Đơn COD giao thành công => coi như đã thu tiền
  const paymentStatus =
    status === "delivered" && order.payment_method === "cod" ? "paid"
    : status === "refunded" && order.payment_status === "paid" ? "refunded"
    : order.payment_status;

  statements.push(
    db.prepare(`UPDATE orders SET status = ?, payment_status = ?, updated_at = unixepoch() WHERE id = ?`)
      .bind(status, paymentStatus, id)
  );

  // Hủy/hoàn đơn => trả hàng về kho
  if (releases && !wasReleased) {
    const items = await db.prepare(`SELECT product_id, quantity FROM order_items WHERE order_id = ?`)
      .bind(id).all<{ product_id: string; quantity: number }>();
    for (const item of items.results) {
      statements.push(
        db.prepare(`UPDATE products SET stock = stock + ?, updated_at = unixepoch() WHERE id = ?`)
          .bind(item.quantity, item.product_id),
        db.prepare(
          `INSERT INTO inventory_transactions (id, product_id, type, quantity, reference_id, note) VALUES (?, ?, 'return', ?, ?, ?)`
        ).bind(`inv_${crypto.randomUUID()}`, item.product_id, item.quantity, id, `Hoàn kho do đơn #${id} chuyển sang ${status}`),
      );
    }
  }

  await db.batch(statements);
  return c.json({ data: { message: "Đã cập nhật trạng thái đơn hàng" } });
});

// ---------- Products (admin) ----------
adminRoutes.get("/products", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.category_id, p.name, p.slug, p.author, p.description, p.price, p.stock, p.sku, p.is_active, p.created_at, p.updated_at,
            c.name as category_name,
            (SELECT r2_key FROM product_images i WHERE i.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_key
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC`
  ).all();
  return c.json({ data: results });
});

adminRoutes.post("/products", validate("json", ProductCreateSchema), async (c) => {
  return c.json({ data: await insertProduct(c.env.DB, c.req.valid("json")) }, 201);
});

adminRoutes.put("/products/:id", validate("json", ProductUpdateSchema), async (c) => {
  return updateProductHandler(c, c.req.param("id"), c.req.valid("json"));
});

adminRoutes.delete("/products/:id", async (c) => {
  return deleteProductHandler(c, c.req.param("id"));
});

// ---------- Categories (admin) ----------
adminRoutes.get("/categories", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
     FROM categories c ORDER BY c.sort_order ASC, c.created_at ASC`
  ).all();
  return c.json({ data: results });
});

adminRoutes.post("/categories", validate("json", CategoryCreateSchema), async (c) => {
  return createCategoryHandler(c, c.req.valid("json"));
});

adminRoutes.put("/categories/:id", validate("json", CategoryUpdateSchema), async (c) => {
  return updateCategoryHandler(c, c.req.param("id"), c.req.valid("json"));
});

adminRoutes.delete("/categories/:id", async (c) => {
  return deleteCategoryHandler(c, c.req.param("id"));
});

// ---------- Inventory adjustment ----------
adminRoutes.post("/inventory/adjust", validate("json", InventoryAdjustSchema), async (c) => {
  const { product_id, type, quantity, reference_id, note } = c.req.valid("json");

  const product = await findProductById(c.env.DB, product_id);
  if (!product) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm không tồn tại" } }, 404);
  }

  // adjustment: đặt tồn kho = quantity; các loại khác cộng/trừ
  const newStock =
    type === "adjustment" ? quantity
    : type === "sale" ? Math.max(0, product.stock - quantity)
    : product.stock + quantity;

  await c.env.DB.prepare(
    `UPDATE products SET stock = ?, updated_at = unixepoch() WHERE id = ?`
  ).bind(newStock, product_id).run();

  await createInventoryTransaction(c.env.DB, {
    product_id,
    type,
    quantity: newStock - product.stock,
    reference_id,
    note,
  });

  const updated = await findProductById(c.env.DB, product_id);
  return c.json({ data: { product: updated, message: "Đã điều chỉnh tồn kho" } });
});

adminRoutes.get("/inventory/:productId", async (c) => {
  const transactions = await findInventoryTransactionsByProduct(c.env.DB, c.req.param("productId"));
  return c.json({ data: transactions });
});
