// Test tìm sách theo từ khóa với dữ liệu giả: npx vitest run src/ai/keyword.test.ts
import { describe, expect, it } from "vitest";
import { extractKeywords, isOneTypo, normalize, scoreBooks, type KeywordBook } from "./keyword";

const raw = [
  { id: "conan1", name: "Thám Tử Lừng Danh Conan - Tập 1", author: "Aoyama Gosho", category: "Thiếu nhi" },
  { id: "conan2", name: "Thám Tử Lừng Danh Conan - Tập 2", author: "Aoyama Gosho", category: "Thiếu nhi" },
  { id: "meo", name: "Chuyện Con Mèo Dạy Hải Âu Bay", author: "Luis Sepúlveda", category: "Thiếu nhi" },
  { id: "matbiec", name: "Mắt Biếc", author: "Nguyễn Nhật Ánh", category: "Văn học" },
  { id: "hoavang", name: "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", author: "Nguyễn Nhật Ánh", category: "Văn học" },
  { id: "harry", name: "Harry Potter Và Hòn Đá Phù Thủy", author: "J.K. Rowling", category: "Thiếu nhi" },
  { id: "dnt", name: "Đắc Nhân Tâm", author: "Dale Carnegie", category: "Kỹ năng sống" },
  { id: "tamly", name: "Tâm Lý Học Về Tiền", author: "Morgan Housel", category: "Kinh tế" },
  { id: "nhagiakim", name: "Nhà Giả Kim", author: "Paulo Coelho", category: "Văn học" },
  { id: "tuoitre", name: "Tuổi Trẻ Đáng Giá Bao Nhiêu", author: "Rosie Nguyễn", category: "Kỹ năng sống" },
  { id: "trieuphu", name: "Bí Mật Tư Duy Triệu Phú", author: "T. Harv Eker", category: "Kinh tế" },
  { id: "zero", name: "Từ Không Đến Một", author: "Peter Thiel", category: "Kinh tế" },
];
const books: KeywordBook[] = raw.map((b) => ({ id: b.id, name: normalize(b.name), meta: normalize(`${b.author} ${b.category}`) }));
const search = (q: string) => scoreBooks(books, extractKeywords(q)).map((h) => h.id);

describe("normalize", () => {
  it("bỏ dấu, đổi đ, bỏ ký tự đặc biệt", () => {
    expect(normalize("Thám Tử Lừng Danh Conan")).toBe("tham tu lung danh conan");
    expect(normalize("Đắc Nhân Tâm!")).toBe("dac nhan tam");
    expect(normalize("J.K. Rowling - Tập 1")).toBe("j k rowling tap 1");
  });
});

describe("extractKeywords", () => {
  it("bỏ từ thừa và cụm 'gợi ý'", () => {
    expect(extractKeywords("Gợi ý cho mình sách của Nguyễn Nhật Ánh nhé")).toEqual(["nguyen", "nhat", "anh"]);
    expect(extractKeywords("shop có cuốn nào không")).toEqual([]);
  });
});

describe("isOneTypo", () => {
  it("nhận sai 1 ký tự và đảo 2 ký tự cạnh nhau", () => {
    expect(isOneTypo("conna", "conan")).toBe(true); // đảo "na" ↔ "an"
    expect(isOneTypo("hary", "harry")).toBe(true); // thiếu 1 chữ
    expect(isOneTypo("poter", "potter")).toBe(true);
    expect(isOneTypo("conan", "conan")).toBe(false);
    expect(isOneTypo("cona", "meo")).toBe(false);
  });
});

describe("scoreBooks", () => {
  it('"cona" → các sách Conan, không khớp nhầm "Con Mèo"', () => {
    const ids = search("cona");
    expect(ids.slice(0, 2).sort()).toEqual(["conan1", "conan2"]);
    expect(ids).not.toContain("meo");
  });

  it('"conna" (gõ sai) → sách Conan', () => {
    expect(search("conna").slice(0, 2).sort()).toEqual(["conan1", "conan2"]);
  });

  it('"nguyen nhat anh" → đúng 2 sách của Nguyễn Nhật Ánh', () => {
    expect(search("nguyen nhat anh").sort()).toEqual(["hoavang", "matbiec"]);
  });

  it('"hary poter" → chỉ Harry Potter, không kéo theo tác giả "Harv Eker" / "Peter Thiel"', () => {
    expect(search("hary poter")).toEqual(["harry"]);
  });

  it('"dac nhan tam" → Đắc Nhân Tâm đứng đầu, không lẫn "Tâm Lý Học Về Tiền"', () => {
    const ids = search("dac nhan tam");
    expect(ids[0]).toBe("dnt");
    expect(ids).not.toContain("tamly");
  });

  it("khớp trong tên sách được điểm cao hơn khớp tác giả / thể loại", () => {
    const [top] = scoreBooks(books, ["kim"]);
    expect(top.id).toBe("nhagiakim");
  });

  it('câu hỏi tự nhiên có "giá bao nhiêu" không khớp nhầm "Tuổi Trẻ Đáng Giá Bao Nhiêu"', () => {
    expect(search("Mắt Biếc giá bao nhiêu?")).toEqual(["matbiec"]);
    expect(search("Sách thiếu nhi giá bao nhiêu?")).not.toContain("tuoitre");
    expect(search("tác giả của Mắt Biếc là ai")).toEqual(["matbiec"]);
    expect(search("truyện conan dưới 50k")).toEqual(expect.arrayContaining(["conan1", "conan2"]));
  });

  it("không có từ khóa → không trả sách nào", () => {
    expect(search("cho mình hỏi với")).toEqual([]);
  });
});
