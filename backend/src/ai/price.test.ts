// Test hiểu khoảng giá trong câu hỏi chatbot: npx vitest run src/ai/price.test.ts
import { describe, expect, it } from "vitest";
import { normalizeSearch } from "../utils/slug";
import { parsePriceRange } from "./rag";

const parse = (q: string) => parsePriceRange(normalizeSearch(q));

describe("parsePriceRange", () => {
  it("hiểu khoảng giá có từ chỉ giới hạn", () => {
    expect(parse("sách dưới 100k")).toEqual({ max: 100_000 });
    expect(parse("từ 50k đến 120k")).toEqual({ min: 50_000, max: 120_000 });
    expect(parse("trên 200.000đ")).toEqual({ min: 200_000 });
  });

  it("hiểu ngân sách không có từ 'dưới'", () => {
    expect(parse("50000 mua duoc quyen sach nao")).toEqual({ max: 50_000 });
    expect(parse("có 100k thì mua gì")).toEqual({ max: 100_000 });
    expect(parse("tầm 80 nghìn có sách nào hay")).toEqual({ max: 80_000 });
    expect(parse("50000 thi sao")).toEqual({ max: 50_000 });
    expect(parse("50k")).toEqual({ max: 50_000 });
  });

  it("không coi năm / số tập là tiền", () => {
    expect(parse("có sách xuất bản năm 1997 không")).toEqual({});
    expect(parse("conan tập 1 có không")).toEqual({});
  });
});
