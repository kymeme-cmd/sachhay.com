-- ============================================================
-- Migration 0006: Đánh giá sản phẩm
-- Mỗi tài khoản đánh giá mỗi cuốn sách tối đa 1 lần (sửa lại được).
-- Chỉ người có đơn hàng chứa cuốn sách ở trạng thái 'delivered' mới được đánh giá
-- (kiểm tra ở API, xem backend/src/routes/reviews.ts).
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
