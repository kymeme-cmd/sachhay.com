-- ============================================================
-- Migration 0008: Thông tin cơ bản của tác giả
-- Nối với sách qua authors.name = products.author (không sửa bảng products).
-- Nội dung: tổng hợp từ kiến thức phổ biến, CHƯA đối chiếu nguồn → cột source ghi rõ.
-- Năm sinh / năm mất không chắc chắn được để NULL (không đoán).
-- Chạy lại nhiều lần an toàn (INSERT OR REPLACE theo id).
-- ============================================================

CREATE TABLE IF NOT EXISTS authors (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,   -- trùng khớp products.author
  nationality   TEXT,
  born_year     INTEGER,
  died_year     INTEGER,
  bio           TEXT,
  notable_works TEXT,                   -- tác phẩm tiêu biểu, phân tách bằng "; "
  source        TEXT,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);

INSERT OR REPLACE INTO authors (id, name, nationality, born_year, died_year, bio, notable_works, source) VALUES
-- ---------- Việt Nam ----------
('auth_nguyen_du', 'Nguyễn Du', 'Việt Nam', 1766, 1820, 'Đại thi hào dân tộc Việt Nam thời Lê mạt – Nguyễn sơ, được UNESCO vinh danh là danh nhân văn hóa thế giới.', 'Truyện Kiều; Văn chiêu hồn', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_nam_cao', 'Nam Cao', 'Việt Nam', 1915, 1951, 'Nhà văn hiện thực xuất sắc của văn học Việt Nam, nổi bật với các truyện về người nông dân và trí thức nghèo trước Cách mạng.', 'Chí Phèo; Lão Hạc; Đời thừa', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_ngo_tat_to', 'Ngô Tất Tố', 'Việt Nam', 1893, 1954, 'Nhà văn, nhà báo, học giả; một trong những cây bút hiện thực tiêu biểu viết về nông thôn Việt Nam trước Cách mạng.', 'Tắt đèn; Lều chõng', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_vu_trong_phung', 'Vũ Trọng Phụng', 'Việt Nam', 1912, 1939, 'Nhà văn, nhà báo hiện thực trào phúng, được mệnh danh là "ông vua phóng sự đất Bắc".', 'Số đỏ; Giông tố; Làm đĩ', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_to_hoai', 'Tô Hoài', 'Việt Nam', 1920, 2014, 'Nhà văn có sự nghiệp sáng tác đồ sộ, nổi tiếng với các tác phẩm viết cho thiếu nhi và về miền núi Tây Bắc.', 'Dế Mèn phiêu lưu ký; Vợ chồng A Phủ', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_kim_lan', 'Kim Lân', 'Việt Nam', 1920, 2007, 'Nhà văn chuyên viết truyện ngắn về đời sống và con người nông thôn Bắc Bộ.', 'Vợ nhặt; Làng', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_bao_ninh', 'Bảo Ninh', 'Việt Nam', 1952, NULL, 'Nhà văn từng là người lính trong chiến tranh; tiểu thuyết đầu tay của ông được dịch ra nhiều thứ tiếng.', 'Nỗi buồn chiến tranh', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_nguyen_nhat_anh', 'Nguyễn Nhật Ánh', 'Việt Nam', 1955, NULL, 'Nhà văn chuyên viết cho tuổi mới lớn, nổi tiếng với những câu chuyện trong trẻo về tuổi thơ và tuổi học trò.', 'Mắt biếc; Tôi thấy hoa vàng trên cỏ xanh; Kính vạn hoa', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_nguyen_phong', 'Nguyên Phong', 'Việt Nam', NULL, NULL, 'Bút danh của một dịch giả, tác giả người Việt sống ở nước ngoài, viết và phóng tác nhiều sách về tâm linh, triết lý phương Đông.', 'Hành trình về phương Đông (phóng tác); Muôn kiếp nhân sinh', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_minh_niem', 'Minh Niệm', 'Việt Nam', NULL, NULL, 'Thiền sư, tác giả sách về đời sống nội tâm, cảm xúc và cách sống tỉnh thức.', 'Hiểu về trái tim; Làm như chơi', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_rosie_nguyen', 'Rosie Nguyễn', 'Việt Nam', NULL, NULL, 'Tác giả sách kỹ năng dành cho người trẻ, viết về học tập, trải nghiệm và định hướng bản thân.', 'Tuổi trẻ đáng giá bao nhiêu', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_tony_buoi_sang', 'Tony Buổi Sáng', 'Việt Nam', NULL, NULL, 'Bút danh của một tác giả viết các bài chia sẻ về khởi nghiệp, rèn luyện bản thân cho người trẻ.', 'Trên đường băng; Cà phê cùng Tony', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
-- ---------- Văn học thế giới ----------
('auth_victor_hugo', 'Victor Hugo', 'Pháp', 1802, 1885, 'Nhà văn, nhà thơ, nhà viết kịch lớn của chủ nghĩa lãng mạn Pháp.', 'Những người khốn khổ; Nhà thờ Đức Bà Paris', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_hector_malot', 'Hector Malot', 'Pháp', 1830, 1907, 'Nhà văn Pháp, được biết đến nhiều nhất với các tiểu thuyết dành cho thiếu nhi.', 'Không gia đình; Trong gia đình', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_saint_exupery', 'Antoine de Saint-Exupéry', 'Pháp', 1900, 1944, 'Nhà văn kiêm phi công người Pháp; nhiều tác phẩm của ông lấy cảm hứng từ nghề bay.', 'Hoàng tử bé; Cõi người ta; Bay đêm', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_emily_bronte', 'Emily Brontë', 'Anh', 1818, 1848, 'Nhà văn, nhà thơ Anh, một trong ba chị em nhà Brontë; tác giả của một tiểu thuyết duy nhất.', 'Đồi gió hú', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_lewis_carroll', 'Lewis Carroll', 'Anh', 1832, 1898, 'Bút danh của Charles Lutwidge Dodgson, nhà văn và nhà toán học người Anh.', 'Alice ở xứ sở thần tiên; Alice ở xứ sở trong gương', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_mark_twain', 'Mark Twain', 'Mỹ', 1835, 1910, 'Bút danh của Samuel Langhorne Clemens, nhà văn hài hước nổi tiếng của văn học Mỹ.', 'Những cuộc phiêu lưu của Tom Sawyer; Những cuộc phiêu lưu của Huckleberry Finn', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_ernest_hemingway', 'Ernest Hemingway', 'Mỹ', 1899, 1961, 'Nhà văn Mỹ đoạt giải Nobel Văn học năm 1954, nổi tiếng với lối viết ngắn gọn, hàm súc.', 'Ông già và biển cả; Chuông nguyện hồn ai; Giã từ vũ khí', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_harper_lee', 'Harper Lee', 'Mỹ', 1926, 2016, 'Nhà văn Mỹ, đoạt giải Pulitzer với tiểu thuyết về phân biệt chủng tộc ở miền Nam nước Mỹ.', 'Giết con chim nhại', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_mario_puzo', 'Mario Puzo', 'Mỹ', 1920, 1999, 'Nhà văn, nhà biên kịch Mỹ gốc Ý, nổi tiếng với các tiểu thuyết về giới mafia.', 'Bố già; Ông trùm cuối cùng', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_garcia_marquez', 'Gabriel García Márquez', 'Colombia', 1927, 2014, 'Nhà văn Colombia đoạt giải Nobel Văn học năm 1982, gương mặt tiêu biểu của chủ nghĩa hiện thực huyền ảo.', 'Trăm năm cô đơn; Tình yêu thời thổ tả', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_paulo_coelho', 'Paulo Coelho', 'Brazil', 1947, NULL, 'Nhà văn Brazil với các tiểu thuyết mang màu sắc triết lý, được dịch ra rất nhiều ngôn ngữ.', 'Nhà giả kim; Veronika quyết chết', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_vasconcelos', 'José Mauro de Vasconcelos', 'Brazil', 1920, 1984, 'Nhà văn Brazil, nhiều tác phẩm lấy cảm hứng từ tuổi thơ của chính ông.', 'Cây cam ngọt của tôi', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_luis_sepulveda', 'Luis Sepúlveda', 'Chile', 1949, 2020, 'Nhà văn Chile, viết cả tiểu thuyết cho người lớn và truyện cho thiếu nhi.', 'Chuyện con mèo dạy hải âu bay; Ông già đọc truyện tình', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_haruki_murakami', 'Haruki Murakami', 'Nhật Bản', 1949, NULL, 'Nhà văn Nhật Bản đương đại có tác phẩm được dịch rộng rãi trên thế giới.', 'Rừng Na Uy; Kafka bên bờ biển; 1Q84', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_kuroyanagi_tetsuko', 'Kuroyanagi Tetsuko', 'Nhật Bản', 1933, NULL, 'Diễn viên, người dẫn chương trình truyền hình Nhật Bản; cuốn hồi ký về thời tiểu học của bà rất được yêu mến.', 'Totto-chan bên cửa sổ', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_astrid_lindgren', 'Astrid Lindgren', 'Thụy Điển', 1907, 2002, 'Nhà văn Thụy Điển viết cho thiếu nhi, tác giả của nhiều nhân vật quen thuộc với trẻ em khắp thế giới.', 'Pippi Tất Dài; Emil ở Lönneberga', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_anh_em_grimm', 'Anh em Grimm', 'Đức', NULL, NULL, 'Jacob và Wilhelm Grimm, hai anh em học giả người Đức, sưu tầm và biên soạn truyện cổ tích dân gian Đức.', 'Truyện cổ Grimm', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_jk_rowling', 'J.K. Rowling', 'Anh', 1965, NULL, 'Nhà văn Anh, tác giả bộ truyện giả tưởng về cậu bé phù thủy Harry Potter.', 'Bộ truyện Harry Potter', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
-- ---------- Truyện tranh Nhật Bản ----------
('auth_aoyama_gosho', 'Aoyama Gosho', 'Nhật Bản', 1963, NULL, 'Họa sĩ truyện tranh Nhật Bản, tác giả bộ truyện trinh thám Conan.', 'Thám tử lừng danh Conan; Kaito Kid', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_fujiko_f_fujio', 'Fujiko F. Fujio', 'Nhật Bản', 1933, 1996, 'Bút danh của họa sĩ truyện tranh Fujimoto Hiroshi, cha đẻ của chú mèo máy Doraemon.', 'Doraemon', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_usui_yoshito', 'Usui Yoshito', 'Nhật Bản', 1958, 2009, 'Họa sĩ truyện tranh Nhật Bản, tác giả bộ truyện hài về cậu bé Shin.', 'Shin – Cậu bé bút chì', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
-- ---------- Kỹ năng sống, tâm lý ----------
('auth_dale_carnegie', 'Dale Carnegie', 'Mỹ', 1888, 1955, 'Nhà văn, giảng viên người Mỹ, người đi đầu trong các khóa học về giao tiếp và phát triển bản thân.', 'Đắc nhân tâm; Quẳng gánh lo đi và vui sống', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_napoleon_hill', 'Napoleon Hill', 'Mỹ', 1883, 1970, 'Tác giả người Mỹ viết về thành công và làm giàu, thuộc thế hệ đầu của dòng sách phát triển bản thân.', 'Nghĩ giàu và làm giàu', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_stephen_covey', 'Stephen R. Covey', 'Mỹ', 1932, 2012, 'Nhà giáo dục, tác giả và diễn giả người Mỹ về lãnh đạo và hiệu quả cá nhân.', '7 thói quen hiệu quả', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_viktor_frankl', 'Viktor E. Frankl', 'Áo', 1905, 1997, 'Bác sĩ tâm thần người Áo, từng sống sót qua trại tập trung; người sáng lập liệu pháp ý nghĩa (logotherapy).', 'Đi tìm lẽ sống', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_andrew_matthews', 'Andrew Matthews', 'Úc', NULL, NULL, 'Tác giả, họa sĩ minh họa và diễn giả người Úc, viết sách về thái độ sống tích cực.', 'Đời thay đổi khi chúng ta thay đổi', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_david_lieberman', 'David J. Lieberman', 'Mỹ', NULL, NULL, 'Nhà tâm lý học người Mỹ, viết sách về tâm lý hành vi và giao tiếp.', 'Đọc vị bất kỳ ai', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_keith_ferrazzi', 'Keith Ferrazzi', 'Mỹ', NULL, NULL, 'Doanh nhân, tác giả người Mỹ viết về xây dựng quan hệ và làm việc nhóm.', 'Đừng bao giờ đi ăn một mình', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_charles_duhigg', 'Charles Duhigg', 'Mỹ', NULL, NULL, 'Nhà báo người Mỹ, viết sách về khoa học của thói quen và năng suất.', 'Sức mạnh của thói quen', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_james_clear', 'James Clear', 'Mỹ', NULL, NULL, 'Tác giả người Mỹ viết về thói quen, ra quyết định và cải thiện bản thân từng chút một.', 'Thay đổi tí hon, hiệu quả bất ngờ (Atomic Habits)', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_ikigai', 'Héctor García & Francesc Miralles', 'Tây Ban Nha', NULL, NULL, 'Hai tác giả cùng viết về triết lý sống ikigai của người Nhật, tìm hiểu từ những người sống thọ ở Okinawa.', 'Ikigai', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_sasaki_fumio', 'Sasaki Fumio', 'Nhật Bản', NULL, NULL, 'Biên tập viên, tác giả người Nhật chia sẻ trải nghiệm sống tối giản.', 'Lối sống tối giản của người Nhật', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
-- ---------- Kinh tế, kinh doanh, tài chính ----------
('auth_benjamin_graham', 'Benjamin Graham', 'Mỹ', 1894, 1976, 'Nhà đầu tư, nhà kinh tế học người Mỹ, được xem là cha đẻ của trường phái đầu tư giá trị.', 'Nhà đầu tư thông minh; Phân tích chứng khoán', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_george_clason', 'George S. Clason', 'Mỹ', 1874, 1957, 'Tác giả người Mỹ, nổi tiếng với loạt truyện ngụ ngôn về quản lý tiền bạc lấy bối cảnh Babylon cổ đại.', 'Người giàu có nhất thành Babylon', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_daniel_kahneman', 'Daniel Kahneman', 'Israel – Mỹ', 1934, 2024, 'Nhà tâm lý học đoạt giải Nobel Kinh tế năm 2002 nhờ các nghiên cứu về cách con người ra quyết định.', 'Tư duy nhanh và chậm', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_robert_kiyosaki', 'Robert T. Kiyosaki', 'Mỹ', 1947, NULL, 'Doanh nhân, tác giả người Mỹ viết về giáo dục tài chính cá nhân.', 'Dạy con làm giàu (Cha giàu cha nghèo)', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_t_harv_eker', 'T. Harv Eker', 'Canada', NULL, NULL, 'Doanh nhân, diễn giả viết về tư duy tài chính và làm giàu.', 'Bí mật tư duy triệu phú', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_morgan_housel', 'Morgan Housel', 'Mỹ', NULL, NULL, 'Cây bút tài chính người Mỹ, viết về hành vi và tâm lý của con người với tiền bạc.', 'Tâm lý học về tiền', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_song_hongbing', 'Song Hongbing', 'Trung Quốc', NULL, NULL, 'Tác giả người Trung Quốc viết về lịch sử tiền tệ và tài chính thế giới.', 'Chiến tranh tiền tệ', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_steven_levitt', 'Steven D. Levitt', 'Mỹ', NULL, NULL, 'Nhà kinh tế học người Mỹ, giáo sư Đại học Chicago, nổi tiếng với cách áp dụng kinh tế học vào các hiện tượng đời thường.', 'Kinh tế học hài hước (Freakonomics)', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_jim_collins', 'Jim Collins', 'Mỹ', NULL, NULL, 'Nhà nghiên cứu, tác giả người Mỹ về quản trị và cách các công ty phát triển bền vững.', 'Từ tốt đến vĩ đại; Xây dựng để trường tồn', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_eric_ries', 'Eric Ries', 'Mỹ', NULL, NULL, 'Doanh nhân người Mỹ, người khởi xướng phương pháp khởi nghiệp tinh gọn (lean startup).', 'Khởi nghiệp tinh gọn', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_peter_thiel', 'Peter Thiel', 'Mỹ', NULL, NULL, 'Doanh nhân, nhà đầu tư mạo hiểm, đồng sáng lập PayPal.', 'Từ không đến một', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_philip_kotler', 'Philip Kotler', 'Mỹ', NULL, NULL, 'Giáo sư marketing người Mỹ, tác giả nhiều giáo trình marketing được dùng rộng rãi.', 'Marketing căn bản; Quản trị marketing', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_quoc_gia_khoi_nghiep', 'Dan Senor & Saul Singer', 'Mỹ – Israel', NULL, NULL, 'Hai tác giả cùng viết về hệ sinh thái khởi nghiệp và đổi mới sáng tạo của Israel.', 'Quốc gia khởi nghiệp', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_dai_duong_xanh', 'W. Chan Kim & Renée Mauborgne', 'Hàn Quốc – Mỹ', NULL, NULL, 'Hai giáo sư chiến lược tại trường kinh doanh INSEAD, đồng tác giả lý thuyết chiến lược đại dương xanh.', 'Chiến lược đại dương xanh', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn'),
('auth_walter_isaacson', 'Walter Isaacson', 'Mỹ', NULL, NULL, 'Nhà báo, nhà viết tiểu sử người Mỹ, tác giả nhiều cuốn tiểu sử về các nhân vật nổi tiếng.', 'Steve Jobs; Leonardo da Vinci; Einstein', 'Tổng hợp kiến thức phổ biến, chưa đối chiếu nguồn');
