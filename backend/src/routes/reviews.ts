// ============================================================
// Review routes: đánh giá sách (mount tại /api/products/:id/reviews)
// Chỉ người đã nhận hàng (đơn 'delivered' chứa cuốn sách) mới được đánh giá.
// ============================================================

import { Hono } from "hono";
import { findProductById } from "../db/client";
import { ReviewUpsertSchema, validate } from "../validation/schemas";
import { requireAuth, requireAdmin, type AppEnv } from "../middleware/auth";

export const reviewRoutes = new Hono<AppEnv>();

const REVIEWS_PER_PAGE = 10;

const REVIEW_COLUMNS = `r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at, r.updated_at, u.name AS user_name`;

/** Người dùng đã nhận được cuốn sách này chưa (có đơn 'delivered' chứa nó) */
async function hasReceivedProduct(db: D1Database, userId: string, productId: string): Promise<boolean> {
  const row = await db.prepare(
    `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered' LIMIT 1`
  ).bind(userId, productId).first();
  return !!row;
}

// ---------- List (public): tổng quan sao + danh sách đánh giá có phân trang ----------
reviewRoutes.get("/:id/reviews", async (c) => {
  const { id } = c.req.param();
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);

  const [{ results: dist }, { results: reviews }] = await Promise.all([
    c.env.DB.prepare(`SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? GROUP BY rating`)
      .bind(id).all<{ rating: number; n: number }>(),
    c.env.DB.prepare(
      `SELECT ${REVIEW_COLUMNS} FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? ORDER BY r.created_at DESC, r.id LIMIT ? OFFSET ?`
    ).bind(id, REVIEWS_PER_PAGE, (page - 1) * REVIEWS_PER_PAGE).all(),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0, sum = 0;
  for (const { rating, n } of dist) {
    distribution[rating] = n;
    count += n;
    sum += rating * n;
  }

  return c.json({
    data: {
      summary: { average: count ? Math.round((sum / count) * 10) / 10 : null, count, distribution },
      reviews,
    },
    meta: { page, per_page: REVIEWS_PER_PAGE, total: count, total_pages: Math.ceil(count / REVIEWS_PER_PAGE) },
  });
});

// ---------- Đánh giá của tôi + quyền đánh giá ----------
reviewRoutes.get("/:id/reviews/me", requireAuth, async (c) => {
  const { id } = c.req.param();
  const { userId } = c.get("user");
  const [canReview, review] = await Promise.all([
    hasReceivedProduct(c.env.DB, userId, id),
    c.env.DB.prepare(
      `SELECT ${REVIEW_COLUMNS} FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? AND r.user_id = ?`
    ).bind(id, userId).first(),
  ]);
  return c.json({ data: { can_review: canReview, review: review ?? null } });
});

// ---------- Viết / sửa đánh giá của tôi ----------
reviewRoutes.put("/:id/reviews", requireAuth, validate("json", ReviewUpsertSchema), async (c) => {
  const { id } = c.req.param();
  const { userId } = c.get("user");
  const { rating, comment } = c.req.valid("json");

  if (!(await findProductById(c.env.DB, id))) {
    return c.json({ error: { code: "NOT_FOUND", message: "Sản phẩm không tồn tại" } }, 404);
  }
  if (!(await hasReceivedProduct(c.env.DB, userId, id))) {
    return c.json(
      { error: { code: "NOT_PURCHASED", message: "Bạn chỉ có thể đánh giá sách sau khi đã nhận hàng" } },
      403
    );
  }

  await c.env.DB.prepare(
    `INSERT INTO reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (product_id, user_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment, updated_at = unixepoch()`
  ).bind(`rev_${crypto.randomUUID()}`, id, userId, rating, comment?.trim() || null).run();

  const review = await c.env.DB.prepare(
    `SELECT ${REVIEW_COLUMNS} FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? AND r.user_id = ?`
  ).bind(id, userId).first();
  return c.json({ data: review });
});

// ---------- Xóa đánh giá của tôi ----------
reviewRoutes.delete("/:id/reviews", requireAuth, async (c) => {
  const { id } = c.req.param();
  await c.env.DB.prepare(`DELETE FROM reviews WHERE product_id = ? AND user_id = ?`).bind(id, c.get("user").userId).run();
  return c.json({ data: { message: "Đã xóa đánh giá" } });
});

// ---------- Admin xóa đánh giá bất kỳ ----------
reviewRoutes.delete("/:id/reviews/:reviewId", requireAdmin, async (c) => {
  const { id, reviewId } = c.req.param();
  const result = await c.env.DB.prepare(`DELETE FROM reviews WHERE id = ? AND product_id = ?`).bind(reviewId, id).run();
  if (!result.meta.changes) {
    return c.json({ error: { code: "NOT_FOUND", message: "Đánh giá không tồn tại" } }, 404);
  }
  return c.json({ data: { message: "Đã xóa đánh giá" } });
});
