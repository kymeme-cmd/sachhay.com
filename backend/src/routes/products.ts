// ============================================================
// Product routes: list, get, create, update, delete, images
// ============================================================

import { Hono } from "hono";
import type { Context } from "hono";
import { listProducts, findProductById, findCategoryById, createProductImage, attachImages } from "../db/client";
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductListQuerySchema,
  validate,
} from "../validation/schemas";
import { requireAdmin, type AppEnv } from "../middleware/auth";
import { uniqueSlug, buildSearchText } from "../utils/slug";
import { scheduleProductSync } from "../ai/rag";

export const productRoutes = new Hono<AppEnv>();

// ---------- List (public, with pagination/search/filter) ----------
productRoutes.get("/", validate("query", ProductListQuerySchema), async (c) => {
  const { category_id, search, page, per_page, sort_by, sort_dir, min_price, max_price } = c.req.valid("query");

  const result = await listProducts(c.env.DB, {
    category_id,
    search,
    min_price,
    max_price,
    page: Math.max(1, page || 1),
    per_page: Math.min(100, Math.max(1, per_page || 20)),
    is_active: 1,
    sortBy: sort_by,
    sortDir: sort_dir,
  });

  return c.json({ data: result.products, meta: result.meta });
});

// ---------- Get (public) ----------
productRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const product = await findProductById(c.env.DB, id);
  if (!product) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm không tồn tại" } }, 404);
  }
  const [withImages] = await attachImages(c.env.DB, [product]);
  const category = product.category_id ? await findCategoryById(c.env.DB, product.category_id) : null;
  return c.json({ data: { ...withImages, category } });
});

// ---------- Create (admin) ----------
productRoutes.post("/", requireAdmin, validate("json", ProductCreateSchema), async (c) => {
  const product = await insertProduct(c.env.DB, c.req.valid("json"));
  scheduleProductSync(c, (product as { id?: string } | null)?.id);
  return c.json({ data: product }, 201);
});

// ---------- Update (admin) ----------
productRoutes.put("/:id", requireAdmin, validate("json", ProductUpdateSchema), async (c) => {
  const res = await updateProductHandler(c, c.req.param("id"), c.req.valid("json"));
  scheduleProductSync(c, c.req.param("id"));
  return res;
});

// ---------- Delete (admin) ----------
productRoutes.delete("/:id", requireAdmin, async (c) => {
  const res = await deleteProductHandler(c, c.req.param("id"));
  scheduleProductSync(c, c.req.param("id"));
  return res;
});

// ---------- Product images ----------
productRoutes.post("/:id/images", requireAdmin, async (c) => {
  const { id } = c.req.param();
  const { r2_key, alt_text, is_primary, sort_order } = await c.req.json<{
    r2_key?: string; alt_text?: string; is_primary?: number | boolean; sort_order?: number;
  }>();

  if (!r2_key) {
    return c.json({ error: { code: "VALIDATION", message: "Thiếu r2_key của hình ảnh" } }, 400);
  }

  const product = await findProductById(c.env.DB, id);
  if (!product) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm không tồn tại" } }, 404);
  }

  const primary = is_primary ? 1 : 0;
  if (primary) {
    await c.env.DB.prepare(`UPDATE product_images SET is_primary = 0 WHERE product_id = ?`).bind(id).run();
  }

  const image = await createProductImage(c.env.DB, {
    id: `img_${crypto.randomUUID()}`,
    product_id: id,
    r2_key,
    alt_text: alt_text ?? undefined,
    is_primary: primary,
    sort_order: sort_order ?? 0,
  });

  return c.json({ data: image }, 201);
});

productRoutes.get("/:id/images", async (c) => {
  const { id } = c.req.param();
  const { results } = await c.env.DB.prepare(
    `SELECT id, product_id, r2_key, alt_text, is_primary, sort_order, created_at FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC`
  ).bind(id).all();

  return c.json({ data: results ?? [] });
});

productRoutes.delete("/:id/images/:imageId", requireAdmin, async (c) => {
  const { id, imageId } = c.req.param();

  const image = await c.env.DB.prepare(
    `SELECT r2_key FROM product_images WHERE id = ? AND product_id = ?`
  ).bind(imageId, id).first<{ r2_key: string }>();

  if (!image) {
    return c.json({ error: { code: "NOT_FOUND", message: "Hình ảnh không tồn tại" } }, 404);
  }

  try {
    await c.env.R2?.delete(image.r2_key);
  } catch {
    // Ignore R2 errors, continue with DB deletion
  }

  await c.env.DB.prepare(`DELETE FROM product_images WHERE id = ?`).bind(imageId).run();
  return c.json({ data: { message: "Đã xóa hình ảnh" } });
});

// ============================================================
// Shared handlers (dùng chung với /api/admin/products)
// ============================================================

export interface ProductInput {
  category_id?: string | null;
  name?: string;
  author?: string | null;
  description?: string | null;
  price?: number;
  stock?: number;
  sku?: string | null;
  is_active?: boolean;
}

export async function insertProduct(db: D1Database, data: ProductInput & { name: string; price: number; stock: number }) {
  const id = `prod_${crypto.randomUUID()}`;
  const slug = await uniqueSlug(db, "products", data.name);
  const author = data.author?.trim() || null;

  return db.prepare(
    `INSERT INTO products (id, category_id, name, slug, author, description, price, stock, sku, is_active, search_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id, category_id, name, slug, author, description, price, stock, sku, is_active, created_at, updated_at`
  ).bind(
    id, data.category_id || null, data.name, slug, author, data.description ?? null,
    data.price, data.stock, data.sku || null, data.is_active !== false ? 1 : 0,
    buildSearchText({ name: data.name, author, description: data.description })
  ).first();
}

export async function updateProductHandler(c: Context<AppEnv>, id: string, data: ProductInput) {
  const existing = await findProductById(c.env.DB, id);
  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm không tồn tại" } }, 404);
  }

  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.category_id !== undefined) { fields.push("category_id = ?"); params.push(data.category_id || null); }
  if (data.name !== undefined && data.name !== existing.name) {
    fields.push("name = ?", "slug = ?");
    params.push(data.name, await uniqueSlug(c.env.DB, "products", data.name, id));
  }
  if (data.author !== undefined) { fields.push("author = ?"); params.push(data.author?.trim() || null); }
  if (data.description !== undefined) { fields.push("description = ?"); params.push(data.description); }
  if (data.name !== undefined || data.author !== undefined || data.description !== undefined) {
    fields.push("search_text = ?");
    params.push(buildSearchText({
      name: data.name ?? existing.name,
      author: data.author !== undefined ? data.author : existing.author,
      description: data.description !== undefined ? data.description : existing.description,
    }));
  }
  if (data.price !== undefined) { fields.push("price = ?"); params.push(data.price); }
  if (data.stock !== undefined) { fields.push("stock = ?"); params.push(data.stock); }
  if (data.sku !== undefined) { fields.push("sku = ?"); params.push(data.sku || null); }
  if (data.is_active !== undefined) { fields.push("is_active = ?"); params.push(data.is_active ? 1 : 0); }

  if (fields.length > 0) {
    fields.push("updated_at = unixepoch()");
    params.push(id);
    await c.env.DB.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: await findProductById(c.env.DB, id) });
}

/** Sản phẩm đã có trong đơn hàng thì chỉ ẩn đi (giữ lịch sử đơn), ngược lại xóa hẳn */
export async function deleteProductHandler(c: Context<AppEnv>, id: string) {
  const existing = await findProductById(c.env.DB, id);
  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm không tồn tại" } }, 404);
  }

  const used = await c.env.DB.prepare(`SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1`).bind(id).first();
  if (used) {
    await c.env.DB.prepare(`UPDATE products SET is_active = 0, updated_at = unixepoch() WHERE id = ?`).bind(id).run();
    return c.json({ data: { message: "Sản phẩm đã có đơn hàng nên được chuyển sang trạng thái ẩn" } });
  }

  const { results: images } = await c.env.DB.prepare(`SELECT r2_key FROM product_images WHERE product_id = ?`).bind(id).all<{ r2_key: string }>();
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM inventory_transactions WHERE product_id = ?`).bind(id),
    c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id),
  ]);
  if (images.length > 0) {
    try { await c.env.R2?.delete(images.map((i) => i.r2_key)); } catch { /* bỏ qua lỗi R2 */ }
  }
  return c.json({ data: { message: "Đã xóa sản phẩm" } });
}
