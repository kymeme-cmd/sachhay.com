// ============================================================
// Cart routes
// ============================================================

import { Hono } from "hono";
import { findProductById } from "../db/client";
import { CartItemAddSchema, CartItemUpdateSchema, validate } from "../validation/schemas";
import { requireAuth, type AppEnv } from "../middleware/auth";

export const cartRoutes = new Hono<AppEnv>();

cartRoutes.use("*", requireAuth);

// Helper: get or create cart for user
async function getOrCreateCart(db: D1Database, userId: string): Promise<string> {
  const existing = await db.prepare(`SELECT id FROM carts WHERE user_id = ?`).bind(userId).first<string>("id");
  if (existing) return existing;

  const cartId = `cart_${crypto.randomUUID()}`;
  await db.prepare(`INSERT INTO carts (id, user_id) VALUES (?, ?)`).bind(cartId, userId).run();
  return cartId;
}

// ---------- Get cart ----------
cartRoutes.get("/", async (c) => {
  const cartId = await getOrCreateCart(c.env.DB, c.get("user").userId);

  const { results: items } = await c.env.DB.prepare(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
            p.name, p.slug, p.price, p.stock, p.sku, p.is_active,
            (SELECT r2_key FROM product_images i WHERE i.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_key
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at ASC`
  ).bind(cartId).all<any>();

  let total = 0;
  const formatted = items.map((item) => {
    const subtotal = item.price * item.quantity;
    if (item.is_active) total += subtotal;
    return {
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: {
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        stock: item.stock,
        sku: item.sku,
        is_active: item.is_active,
        images: item.image_key ? [{ r2_key: item.image_key }] : [],
      },
      subtotal,
    };
  });

  return c.json({ data: { items: formatted, total, cart_id: cartId } });
});

// ---------- Add item ----------
cartRoutes.post("/items", validate("json", CartItemAddSchema), async (c) => {
  const { product_id, quantity } = c.req.valid("json");

  const product = await findProductById(c.env.DB, product_id);
  if (!product) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm không tồn tại" } }, 404);
  }
  if (!product.is_active) {
    return c.json({ error: { code: "INACTIVE", message: "Sản phẩm hiện không hoạt động" } }, 400);
  }

  const cartId = await getOrCreateCart(c.env.DB, c.get("user").userId);

  const existing = await c.env.DB.prepare(
    `SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?`
  ).bind(cartId, product_id).first<{ id: string; quantity: number }>();

  const newQty = (existing?.quantity ?? 0) + quantity;
  if (product.stock < newQty) {
    return c.json(
      { error: { code: "INSUFFICIENT_STOCK", message: `Chỉ còn ${product.stock} sản phẩm` } },
      400
    );
  }

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE cart_items SET quantity = ?, updated_at = unixepoch() WHERE id = ?`
    ).bind(newQty, existing.id).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)`
    ).bind(`cartitem_${crypto.randomUUID()}`, cartId, product_id, quantity).run();
  }

  return c.json({ data: { message: "Đã thêm vào giỏ hàng" } });
});

// ---------- Update item ----------
cartRoutes.put("/items/:itemId", validate("json", CartItemUpdateSchema), async (c) => {
  const { itemId } = c.req.param();
  const { quantity } = c.req.valid("json");
  const cartId = await getOrCreateCart(c.env.DB, c.get("user").userId);

  const item = await c.env.DB.prepare(
    `SELECT ci.id, p.stock
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.id = ? AND ci.cart_id = ?`
  ).bind(itemId, cartId).first<{ id: string; stock: number }>();

  if (!item) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm trong giỏ hàng không tồn tại" } }, 404);
  }
  if (item.stock < quantity) {
    return c.json(
      { error: { code: "INSUFFICIENT_STOCK", message: `Chỉ còn ${item.stock} sản phẩm` } },
      400
    );
  }

  await c.env.DB.prepare(
    `UPDATE cart_items SET quantity = ?, updated_at = unixepoch() WHERE id = ?`
  ).bind(quantity, itemId).run();

  return c.json({ data: { message: "Đã cập nhật giỏ hàng" } });
});

// ---------- Remove item ----------
cartRoutes.delete("/items/:itemId", async (c) => {
  const cartId = await getOrCreateCart(c.env.DB, c.get("user").userId);
  await c.env.DB.prepare(
    `DELETE FROM cart_items WHERE id = ? AND cart_id = ?`
  ).bind(c.req.param("itemId"), cartId).run();

  return c.json({ data: { message: "Đã xóa sản phẩm khỏi giỏ hàng" } });
});

// ---------- Clear cart ----------
cartRoutes.delete("/", async (c) => {
  const cartId = await getOrCreateCart(c.env.DB, c.get("user").userId);
  await c.env.DB.prepare(`DELETE FROM cart_items WHERE cart_id = ?`).bind(cartId).run();

  return c.json({ data: { message: "Đã xóa toàn bộ giỏ hàng" } });
});
