-- ============================================================
-- Migration 0004: Cột tác giả + cột tìm kiếm không dấu cho sản phẩm
--   author      : tên tác giả (hiển thị riêng trên thẻ sách)
--   search_text : tên + tác giả + mô tả đã bỏ dấu, chữ thường.
--                 Backend tự điền (khi tạo/sửa sách và tự bổ sung cho dòng còn NULL),
--                 vì SQLite/D1 không có hàm bỏ dấu tiếng Việt.
-- ============================================================

ALTER TABLE products ADD COLUMN author TEXT;
ALTER TABLE products ADD COLUMN search_text TEXT;

CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Điền tác giả cho 66 sách mẫu (0002 + 0003)
UPDATE products SET author = 'Nguyễn Nhật Ánh' WHERE id = 'book_mat_biec';
UPDATE products SET author = 'Nguyễn Nhật Ánh' WHERE id = 'book_toi_thay_hoa_vang';
UPDATE products SET author = 'Paulo Coelho' WHERE id = 'book_nha_gia_kim';
UPDATE products SET author = 'Tô Hoài' WHERE id = 'book_de_men';
UPDATE products SET author = 'Vũ Trọng Phụng' WHERE id = 'book_so_do';
UPDATE products SET author = 'Robert T. Kiyosaki' WHERE id = 'book_cha_giau_cha_ngheo';
UPDATE products SET author = 'Napoleon Hill' WHERE id = 'book_nghi_giau';
UPDATE products SET author = 'Benjamin Graham' WHERE id = 'book_nha_dau_tu';
UPDATE products SET author = 'Eric Ries' WHERE id = 'book_khoi_nghiep';
UPDATE products SET author = 'Dale Carnegie' WHERE id = 'book_dac_nhan_tam';
UPDATE products SET author = 'Andrew Matthews' WHERE id = 'book_thoi_quen';
UPDATE products SET author = 'Rosie Nguyễn' WHERE id = 'book_tuoi_tre';
UPDATE products SET author = 'James Clear' WHERE id = 'book_atomic_habits';
UPDATE products SET author = 'Antoine de Saint-Exupéry' WHERE id = 'book_hoang_tu_be';
UPDATE products SET author = 'Fujiko F. Fujio' WHERE id = 'book_doraemon_1';
UPDATE products SET author = 'Nguyễn Nhật Ánh' WHERE id = 'book_kinh_van_hoa';
UPDATE products SET author = 'Nguyễn Nhật Ánh' WHERE id = 'book_cho_toi_xin_mot_ve_di_tuoi_tho';
UPDATE products SET author = 'Nguyễn Nhật Ánh' WHERE id = 'book_co_gai_den_tu_hom_qua';
UPDATE products SET author = 'Nguyễn Nhật Ánh' WHERE id = 'book_ngoi_khoc_tren_cay';
UPDATE products SET author = 'Ngô Tất Tố' WHERE id = 'book_tat_den';
UPDATE products SET author = 'Nam Cao' WHERE id = 'book_chi_pheo';
UPDATE products SET author = 'Kim Lân' WHERE id = 'book_vo_nhat';
UPDATE products SET author = 'Bảo Ninh' WHERE id = 'book_noi_buon_chien_tranh';
UPDATE products SET author = 'Nguyễn Du' WHERE id = 'book_truyen_kieu';
UPDATE products SET author = 'Haruki Murakami' WHERE id = 'book_rung_na_uy';
UPDATE products SET author = 'Gabriel García Márquez' WHERE id = 'book_tram_nam_co_don';
UPDATE products SET author = 'Ernest Hemingway' WHERE id = 'book_ong_gia_va_bien_ca';
UPDATE products SET author = 'Harper Lee' WHERE id = 'book_giet_con_chim_nhai';
UPDATE products SET author = 'Mario Puzo' WHERE id = 'book_bo_gia';
UPDATE products SET author = 'Victor Hugo' WHERE id = 'book_nhung_nguoi_khon_kho';
UPDATE products SET author = 'Emily Brontë' WHERE id = 'book_doi_gio_hu';
UPDATE products SET author = 'Jim Collins' WHERE id = 'book_tu_tot_den_vi_dai';
UPDATE products SET author = 'W. Chan Kim & Renée Mauborgne' WHERE id = 'book_chien_luoc_dai_duong_xanh';
UPDATE products SET author = 'Daniel Kahneman' WHERE id = 'book_tu_duy_nhanh_va_cham';
UPDATE products SET author = 'Steven D. Levitt' WHERE id = 'book_kinh_te_hoc_hai_huoc';
UPDATE products SET author = 'George S. Clason' WHERE id = 'book_nguoi_giau_co_nhat_thanh_babylon';
UPDATE products SET author = 'Morgan Housel' WHERE id = 'book_tam_ly_hoc_ve_tien';
UPDATE products SET author = 'Peter Thiel' WHERE id = 'book_tu_khong_den_mot';
UPDATE products SET author = 'T. Harv Eker' WHERE id = 'book_bi_mat_tu_duy_trieu_phu';
UPDATE products SET author = 'Philip Kotler' WHERE id = 'book_marketing_can_ban';
UPDATE products SET author = 'Dan Senor & Saul Singer' WHERE id = 'book_quoc_gia_khoi_nghiep';
UPDATE products SET author = 'Song Hongbing' WHERE id = 'book_chien_tranh_tien_te';
UPDATE products SET author = 'Walter Isaacson' WHERE id = 'book_steve_jobs';
UPDATE products SET author = 'Viktor E. Frankl' WHERE id = 'book_di_tim_le_song';
UPDATE products SET author = 'Stephen R. Covey' WHERE id = 'book_7_thoi_quen_hieu_qua';
UPDATE products SET author = 'Charles Duhigg' WHERE id = 'book_suc_manh_cua_thoi_quen';
UPDATE products SET author = 'David J. Lieberman' WHERE id = 'book_doc_vi_bat_ky_ai';
UPDATE products SET author = 'Keith Ferrazzi' WHERE id = 'book_dung_bao_gio_di_an_mot_minh';
UPDATE products SET author = 'Dale Carnegie' WHERE id = 'book_quang_ganh_lo_di_va_vui_song';
UPDATE products SET author = 'Nhiều tác giả' WHERE id = 'book_hat_giong_tam_hon';
UPDATE products SET author = 'Sasaki Fumio' WHERE id = 'book_loi_song_toi_gian_cua_nguoi_nhat';
UPDATE products SET author = 'Héctor García & Francesc Miralles' WHERE id = 'book_ikigai';
UPDATE products SET author = 'Nguyên Phong' WHERE id = 'book_muon_kiep_nhan_sinh';
UPDATE products SET author = 'Minh Niệm' WHERE id = 'book_hieu_ve_trai_tim';
UPDATE products SET author = 'Tony Buổi Sáng' WHERE id = 'book_tren_duong_bang';
UPDATE products SET author = 'J.K. Rowling' WHERE id = 'book_harry_potter_va_hon_da_phu_thuy';
UPDATE products SET author = 'Hector Malot' WHERE id = 'book_khong_gia_dinh';
UPDATE products SET author = 'Kuroyanagi Tetsuko' WHERE id = 'book_totto_chan_ben_cua_so';
UPDATE products SET author = 'Luis Sepúlveda' WHERE id = 'book_chuyen_con_meo_day_hai_au_bay';
UPDATE products SET author = 'Astrid Lindgren' WHERE id = 'book_pippi_tat_dai';
UPDATE products SET author = 'Mark Twain' WHERE id = 'book_nhung_cuoc_phieu_luu_cua_tom_sawyer';
UPDATE products SET author = 'Lewis Carroll' WHERE id = 'book_alice_o_xu_so_than_tien';
UPDATE products SET author = 'Aoyama Gosho' WHERE id = 'book_tham_tu_lung_danh_conan_tap_1';
UPDATE products SET author = 'Usui Yoshito' WHERE id = 'book_shin_cau_be_but_chi_tap_1';
UPDATE products SET author = 'José Mauro de Vasconcelos' WHERE id = 'book_cay_cam_ngot_cua_toi';
UPDATE products SET author = 'Anh em Grimm' WHERE id = 'book_truyen_co_grimm';
