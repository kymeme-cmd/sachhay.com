-- ============================================================
-- Migration 0007: Chatbot AI (RAG)
-- policies: chính sách cửa hàng mà chatbot được phép trích dẫn.
--   Nội dung CHỈ gồm những gì website đã công bố (Checkout, trang chi tiết sách).
--   Chưa có chính sách đổi trả/bảo hành → chatbot trả lời "chưa có thông tin".
--   Sửa/thêm chính sách xong, vào Quản trị bấm "Đồng bộ dữ liệu AI".
-- chat_usage: đếm số tin nhắn để giới hạn tần suất.
-- Chạy lại nhiều lần an toàn.
-- ============================================================

CREATE TABLE IF NOT EXISTS policies (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO policies (slug, title, content) VALUES
  ('giao-hang', 'Giao hàng',
   'Sách Hay giao hàng toàn quốc và miễn phí phí vận chuyển. Có 3 hình thức giao: Tiêu chuẩn (2-3 ngày), Nhanh (1-2 ngày), Hỏa tốc (trong ngày). Khách chọn hình thức giao ở bước thanh toán.'),
  ('thanh-toan', 'Thanh toán',
   'Sách Hay hỗ trợ 3 hình thức thanh toán: thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, thẻ tín dụng. Khách cần đăng nhập để đặt hàng.'),
  ('lien-he', 'Liên hệ hỗ trợ',
   'Liên hệ Sách Hay qua email support@sachhay.vn hoặc số điện thoại 0909 123 456.');

CREATE TABLE IF NOT EXISTS chat_usage (
  key          TEXT NOT NULL,      -- 'user:<id>', 'ip:<addr>' hoặc 'global'
  window_start INTEGER NOT NULL,   -- đầu khung thời gian (giây)
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
