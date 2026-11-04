-- ============================================================
-- Migration 0010: Ảnh bìa bản tiếng Việt do chủ cửa hàng cung cấp (17 sách)
-- File: frontend/public/covers/<id>-vn.jpg (nén từ anhhh.rar, rộng tối đa 600px).
-- Thay cho bìa tự tạo / bìa Open Library của các cuốn này. Đuôi "-vn.jpg" để trang
-- chi tiết KHÔNG ghi nguồn "Open Library" cho các ảnh này. Chạy lại nhiều lần an toàn.
-- ============================================================

UPDATE product_images SET r2_key = 'products/covers/book_alice_o_xu_so_than_tien-vn.jpg' WHERE id = 'img_cover_book_alice_o_xu_so_than_tien';
UPDATE product_images SET r2_key = 'products/covers/book_cay_cam_ngot_cua_toi-vn.jpg' WHERE id = 'img_cover_book_cay_cam_ngot_cua_toi';
UPDATE product_images SET r2_key = 'products/covers/book_chuyen_con_meo_day_hai_au_bay-vn.jpg' WHERE id = 'img_cover_book_chuyen_con_meo_day_hai_au_bay';
UPDATE product_images SET r2_key = 'products/covers/book_dung_bao_gio_di_an_mot_minh-vn.jpg' WHERE id = 'img_cover_book_dung_bao_gio_di_an_mot_minh';
UPDATE product_images SET r2_key = 'products/covers/book_harry_potter_va_hon_da_phu_thuy-vn.jpg' WHERE id = 'img_cover_book_harry_potter_va_hon_da_phu_thuy';
UPDATE product_images SET r2_key = 'products/covers/book_hat_giong_tam_hon-vn.jpg' WHERE id = 'img_cover_book_hat_giong_tam_hon';
UPDATE product_images SET r2_key = 'products/covers/book_hieu_ve_trai_tim-vn.jpg' WHERE id = 'img_cover_book_hieu_ve_trai_tim';
UPDATE product_images SET r2_key = 'products/covers/book_khong_gia_dinh-vn.jpg' WHERE id = 'img_cover_book_khong_gia_dinh';
UPDATE product_images SET r2_key = 'products/covers/book_muon_kiep_nhan_sinh-vn.jpg' WHERE id = 'img_cover_book_muon_kiep_nhan_sinh';
UPDATE product_images SET r2_key = 'products/covers/book_nhung_cuoc_phieu_luu_cua_tom_sawyer-vn.jpg' WHERE id = 'img_cover_book_nhung_cuoc_phieu_luu_cua_tom_sawyer';
UPDATE product_images SET r2_key = 'products/covers/book_pippi_tat_dai-vn.jpg' WHERE id = 'img_cover_book_pippi_tat_dai';
UPDATE product_images SET r2_key = 'products/covers/book_quang_ganh_lo_di_va_vui_song-vn.jpg' WHERE id = 'img_cover_book_quang_ganh_lo_di_va_vui_song';
UPDATE product_images SET r2_key = 'products/covers/book_shin_cau_be_but_chi_tap_1-vn.jpg' WHERE id = 'img_cover_book_shin_cau_be_but_chi_tap_1';
UPDATE product_images SET r2_key = 'products/covers/book_tham_tu_lung_danh_conan_tap_1-vn.jpg' WHERE id = 'img_cover_book_tham_tu_lung_danh_conan_tap_1';
UPDATE product_images SET r2_key = 'products/covers/book_totto_chan_ben_cua_so-vn.jpg' WHERE id = 'img_cover_book_totto_chan_ben_cua_so';
UPDATE product_images SET r2_key = 'products/covers/book_tren_duong_bang-vn.jpg' WHERE id = 'img_cover_book_tren_duong_bang';
UPDATE product_images SET r2_key = 'products/covers/book_truyen_co_grimm-vn.jpg' WHERE id = 'img_cover_book_truyen_co_grimm';
