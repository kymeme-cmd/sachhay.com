// ============================================================
// Category routes
// ============================================================

import { Hono } from "hono";
import type { Context } from "hono";
import { listCategories, findCategoryById, findCategoryBySlug } from "../db/client";
import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
  validate,
} from "../validation/schemas";
import { requireAdmin, type AppEnv } from "../middleware/auth";
import { slugify, uniqueSlug } from "../utils/slug";

export const categoryRoutes = new Hono<AppEnv>();

// ---------- List (public) ----------
categoryRoutes.get("/", async (c) => {
  return c.json({ data: await listCategories(c.env.DB) });
});

// ---------- Get (public) ----------
categoryRoutes.get("/:id", async (c) => {
  const category = await findCategoryById(c.env.DB, c.req.param("id"));
  if (!category) {
    return c.json({ error: { code: "NOT_FOUND", message: "Danh mục không tồn tại" } }, 404);
  }
  return c.json({ data: category });
});

// ---------- Create (admin) ----------
categoryRoutes.post("/", requireAdmin, validate("json", CategoryCreateSchema), async (c) => {
  return createCategoryHandler(c, c.req.valid("json"));
});

// ---------- Update (admin) ----------
categoryRoutes.put("/:id", requireAdmin, validate("json", CategoryUpdateSchema), async (c) => {
  return updateCategoryHandler(c, c.req.param("id"), c.req.valid("json"));
});

// ---------- Delete (admin) ----------
categoryRoutes.delete("/:id", requireAdmin, async (c) => {
  return deleteCategoryHandler(c, c.req.param("id"));
});

// ============================================================
// Shared handlers (dùng chung với /api/admin/categories)
// ============================================================

export interface CategoryInput {
  name?: string;
  slug?: string;
  parent_id?: string | null;
}

export async function createCategoryHandler(c: Context<AppEnv>, data: CategoryInput & { name: string }) {
  let slug: string;
  if (data.slug) {
    slug = slugify(data.slug);
    if (await findCategoryBySlug(c.env.DB, slug)) {
      return c.json({ error: { code: "SLUG_EXISTS", message: "Slug đã tồn tại" } }, 409);
    }
  } else {
    slug = await uniqueSlug(c.env.DB, "categories", data.name);
  }

  const created = await c.env.DB.prepare(
    `INSERT INTO categories (id, name, slug, parent_id, sort_order)
     VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
     RETURNING id, name, slug, parent_id, sort_order, created_at, updated_at`
  ).bind(`cat_${crypto.randomUUID()}`, data.name, slug, data.parent_id || null).first();

  return c.json({ data: created }, 201);
}

export async function updateCategoryHandler(c: Context<AppEnv>, id: string, data: CategoryInput) {
  const existing = await findCategoryById(c.env.DB, id);
  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Danh mục không tồn tại" } }, 404);
  }

  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); params.push(data.name); }
  if (data.slug) {
    const slug = slugify(data.slug);
    if (slug !== existing.slug && (await findCategoryBySlug(c.env.DB, slug))) {
      return c.json({ error: { code: "SLUG_EXISTS", message: "Slug đã tồn tại" } }, 409);
    }
    fields.push("slug = ?"); params.push(slug);
  }
  if (data.parent_id !== undefined) {
    if (data.parent_id === id) {
      return c.json({ error: { code: "VALIDATION", message: "Danh mục không thể là cha của chính nó" } }, 400);
    }
    fields.push("parent_id = ?"); params.push(data.parent_id || null);
  }

  if (fields.length > 0) {
    fields.push("updated_at = unixepoch()");
    params.push(id);
    await c.env.DB.prepare(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: await findCategoryById(c.env.DB, id) });
}

/** Gỡ liên kết sách và danh mục con trước khi xóa (tránh lỗi khóa ngoại) */
export async function deleteCategoryHandler(c: Context<AppEnv>, id: string) {
  const existing = await findCategoryById(c.env.DB, id);
  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Danh mục không tồn tại" } }, 404);
  }

  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE products SET category_id = NULL WHERE category_id = ?`).bind(id),
    c.env.DB.prepare(`UPDATE categories SET parent_id = ? WHERE parent_id = ?`).bind(existing.parent_id, id),
    c.env.DB.prepare(`DELETE FROM categories WHERE id = ?`).bind(id),
  ]);
  return c.json({ data: { message: "Đã xóa danh mục" } });
}
