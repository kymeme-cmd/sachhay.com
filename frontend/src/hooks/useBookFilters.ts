// ============================================================
// Hook: useBookFilters - Bộ lọc trang danh sách sách lưu trên URL
//   ?search=&category=&sort=&min_price=&max_price=&page=
// URL là nguồn dữ liệu duy nhất → reload / back / chia sẻ link giữ nguyên bộ lọc
// ============================================================

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ProductListParams } from "@/api/client";

export const SORT_OPTIONS = {
  relevance: { label: "Liên quan nhất", sort_by: "relevance", sort_dir: "DESC" }, // chỉ dùng khi đang tìm kiếm
  newest: { label: "Mới nhất", sort_by: "created_at", sort_dir: "DESC" },
  price_asc: { label: "Giá tăng dần", sort_by: "price", sort_dir: "ASC" },
  price_desc: { label: "Giá giảm dần", sort_by: "price", sort_dir: "DESC" },
  name_asc: { label: "Tên A → Z", sort_by: "name", sort_dir: "ASC" },
} as const satisfies Record<string, { label: string; sort_by: ProductListParams["sort_by"]; sort_dir: ProductListParams["sort_dir"] }>;

export type SortKey = keyof typeof SORT_OPTIONS;

export const PRICE_RANGES: Array<{ label: string; min?: number; max?: number }> = [
  { label: "Dưới 50.000đ", max: 50000 },
  { label: "50.000đ - 100.000đ", min: 50000, max: 100000 },
  { label: "100.000đ - 200.000đ", min: 100000, max: 200000 },
  { label: "Trên 200.000đ", min: 200000 },
];

export const PER_PAGE = 24;

export interface BookFilters {
  search: string;
  category: string | null;
  sort: SortKey;
  minPrice?: number;
  maxPrice?: number;
  page: number;
}

const toNumber = (v: string | null) => (v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);

export function useBookFilters() {
  const [params, setParams] = useSearchParams();

  const filters: BookFilters = useMemo(() => {
    const sort = params.get("sort");
    const search = params.get("search")?.trim() ?? "";
    const defaultSort: SortKey = search ? "relevance" : "newest";
    const validSort = sort && sort in SORT_OPTIONS && (sort !== "relevance" || search);
    return {
      search,
      category: params.get("category"),
      sort: validSort ? (sort as SortKey) : defaultSort,
      minPrice: toNumber(params.get("min_price")),
      maxPrice: toNumber(params.get("max_price")),
      page: Math.max(1, toNumber(params.get("page")) ?? 1),
    };
  }, [params]);

  /** Cập nhật một phần bộ lọc; đổi bộ lọc khác ngoài page thì quay về trang 1 */
  const update = useCallback(
    (patch: Partial<BookFilters>) => {
      setParams((prev) => {
          const next = new URLSearchParams(prev);
          const set = (key: string, value: string | number | null | undefined, defaultValue?: string) => {
            if (value === undefined || value === null || value === "" || String(value) === defaultValue) next.delete(key);
            else next.set(key, String(value));
          };
          if ("search" in patch) set("search", patch.search?.trim());
          if ("category" in patch) set("category", patch.category);
          // Bỏ sort khỏi URL nếu trùng mặc định (relevance khi đang tìm, newest khi không)
          const searching = "search" in patch ? !!patch.search?.trim() : !!prev.get("search");
          if ("sort" in patch) set("sort", patch.sort, searching ? "relevance" : "newest");
          if ("search" in patch && !searching && prev.get("sort") === "relevance") next.delete("sort");
          if ("minPrice" in patch) set("min_price", patch.minPrice);
          if ("maxPrice" in patch) set("max_price", patch.maxPrice);
          if ("page" in patch) set("page", patch.page, "1");
          else next.delete("page");
          return next;
      });
    },
    [setParams]
  );

  const reset = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  /** Tham số gửi lên API /products */
  const apiParams: ProductListParams = useMemo(() => {
    const sort = SORT_OPTIONS[filters.sort];
    return {
      search: filters.search || undefined,
      category_id: filters.category || undefined,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      sort_by: sort.sort_by,
      sort_dir: sort.sort_dir,
      page: filters.page,
      per_page: PER_PAGE,
    };
  }, [filters]);

  const hasActiveFilters =
    !!filters.search || !!filters.category || filters.minPrice !== undefined || filters.maxPrice !== undefined ||
    (filters.sort !== "newest" && filters.sort !== "relevance");

  return { filters, apiParams, update, reset, hasActiveFilters };
}
