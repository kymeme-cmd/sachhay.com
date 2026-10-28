-- ============================================================
-- Migration 0002: Dữ liệu sách mẫu (seed)
-- Giá tham khảo theo giá bìa phổ biến, đơn vị VND.
-- Chạy lại nhiều lần an toàn (INSERT OR IGNORE theo id/slug).
-- ============================================================

INSERT OR IGNORE INTO products (id, category_id, name, slug, description, price, stock, sku, is_active)
VALUES
  -- ---------- Văn học ----------
  ('book_mat_biec', 'cat_van_hoc', 'Mắt Biếc', 'mat-biec',
   'Tác giả: Nguyễn Nhật Ánh. Câu chuyện tình đơn phương trong trẻo mà day dứt của Ngạn dành cho Hà Lan, gắn với làng Đo Đo yên bình.',
   110000, 40, 'VH-001', 1),
  ('book_toi_thay_hoa_vang', 'cat_van_hoc', 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'toi-thay-hoa-vang-tren-co-xanh',
   'Tác giả: Nguyễn Nhật Ánh. Những trang viết về tuổi thơ nơi làng quê nghèo với tình anh em, tình bạn và những rung động đầu đời.',
   125000, 35, 'VH-002', 1),
  ('book_nha_gia_kim', 'cat_van_hoc', 'Nhà Giả Kim', 'nha-gia-kim',
   'Tác giả: Paulo Coelho. Hành trình theo đuổi giấc mơ của chàng chăn cừu Santiago – cuốn sách truyền cảm hứng bán chạy khắp thế giới.',
   79000, 50, 'VH-003', 1),
  ('book_de_men', 'cat_van_hoc', 'Dế Mèn Phiêu Lưu Ký', 'de-men-phieu-luu-ky',
   'Tác giả: Tô Hoài. Cuộc phiêu lưu của chú Dế Mèn qua thế giới loài vật, tác phẩm kinh điển của văn học Việt Nam.',
   55000, 60, 'VH-004', 1),
  ('book_so_do', 'cat_van_hoc', 'Số Đỏ', 'so-do',
   'Tác giả: Vũ Trọng Phụng. Tiểu thuyết trào phúng bậc thầy về xã hội thành thị Việt Nam đầu thế kỷ 20.',
   68000, 25, 'VH-005', 1),

  -- ---------- Kinh tế ----------
  ('book_cha_giau_cha_ngheo', 'cat_kinh_te', 'Dạy Con Làm Giàu (Cha Giàu Cha Nghèo)', 'day-con-lam-giau',
   'Tác giả: Robert T. Kiyosaki. Những bài học về tư duy tài chính, tài sản và tiêu sản để làm chủ đồng tiền.',
   99000, 45, 'KT-001', 1),
  ('book_nghi_giau', 'cat_kinh_te', 'Nghĩ Giàu Và Làm Giàu', 'nghi-giau-va-lam-giau',
   'Tác giả: Napoleon Hill. 13 nguyên tắc thành công được đúc kết từ hơn 500 người giàu có nhất nước Mỹ.',
   115000, 30, 'KT-002', 1),
  ('book_nha_dau_tu', 'cat_kinh_te', 'Nhà Đầu Tư Thông Minh', 'nha-dau-tu-thong-minh',
   'Tác giả: Benjamin Graham. Cuốn sách nền tảng về đầu tư giá trị, được Warren Buffett đánh giá là hay nhất từng viết về đầu tư.',
   219000, 20, 'KT-003', 1),
  ('book_khoi_nghiep', 'cat_kinh_te', 'Khởi Nghiệp Tinh Gọn', 'khoi-nghiep-tinh-gon',
   'Tác giả: Eric Ries. Phương pháp xây dựng doanh nghiệp bằng thử nghiệm nhanh, đo lường và học hỏi liên tục.',
   139000, 25, 'KT-004', 1),

  -- ---------- Kỹ năng sống ----------
  ('book_dac_nhan_tam', 'cat_ky_nang', 'Đắc Nhân Tâm', 'dac-nhan-tam',
   'Tác giả: Dale Carnegie. Nghệ thuật thu phục lòng người – cuốn sách kỹ năng giao tiếp nổi tiếng nhất mọi thời đại.',
   86000, 80, 'KN-001', 1),
  ('book_thoi_quen', 'cat_ky_nang', 'Đời Thay Đổi Khi Chúng Ta Thay Đổi', 'doi-thay-doi-khi-chung-ta-thay-doi',
   'Tác giả: Andrew Matthews. Những lời khuyên giản dị, hài hước giúp sống vui vẻ và tích cực hơn mỗi ngày.',
   72000, 40, 'KN-002', 1),
  ('book_tuoi_tre', 'cat_ky_nang', 'Tuổi Trẻ Đáng Giá Bao Nhiêu', 'tuoi-tre-dang-gia-bao-nhieu',
   'Tác giả: Rosie Nguyễn. Cuốn sách dành cho người trẻ về học tập, đọc sách, đi và làm việc để sống một tuổi trẻ đáng giá.',
   90000, 55, 'KN-003', 1),
  ('book_atomic_habits', 'cat_ky_nang', 'Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ', 'thay-doi-ti-hon-hieu-qua-bat-ngo',
   'Tác giả: James Clear. Cách xây dựng thói quen tốt và loại bỏ thói quen xấu bằng những thay đổi nhỏ mỗi ngày.',
   189000, 35, 'KN-004', 1),

  -- ---------- Thiếu nhi ----------
  ('book_hoang_tu_be', 'cat_thieu_nhi', 'Hoàng Tử Bé', 'hoang-tu-be',
   'Tác giả: Antoine de Saint-Exupéry. Câu chuyện đầy chất thơ về tình bạn, tình yêu và cách nhìn thế giới bằng trái tim.',
   65000, 50, 'TN-001', 1),
  ('book_doraemon_1', 'cat_thieu_nhi', 'Doraemon - Tập 1', 'doraemon-tap-1',
   'Tác giả: Fujiko F. Fujio. Chú mèo máy đến từ thế kỷ 22 cùng túi thần kỳ và những bảo bối giúp đỡ cậu bé Nobita.',
   25000, 100, 'TN-002', 1),
  ('book_kinh_van_hoa', 'cat_thieu_nhi', 'Kính Vạn Hoa - Tập 1', 'kinh-van-hoa-tap-1',
   'Tác giả: Nguyễn Nhật Ánh. Những câu chuyện học trò vui nhộn của bộ ba Quý ròm, Tiểu Long và nhỏ Hạnh.',
   45000, 0, 'TN-003', 1);

-- Ghi nhận tồn kho ban đầu vào lịch sử kho
INSERT OR IGNORE INTO inventory_transactions (id, product_id, type, quantity, reference_id, note)
SELECT 'inv_seed_' || id, id, 'restock', stock, NULL, 'Nhập kho ban đầu (seed)'
FROM products WHERE id LIKE 'book_%' AND stock > 0;
