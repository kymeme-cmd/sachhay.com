// Page: BookList - Danh sách sách

import { useEffect, useState } from "react";
import { productAPI, categoryAPI } from "@/api/client";
import type { Product, Category, PaginationMeta } from "@/types";
import { BookOpen, Filter, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import { CategoryBar } from "@/components/book/CategoryBar";
import { SearchBox } from "@/components/book/SearchBox";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { BookCard } from "@/components/book/BookCard";
import { BookGridSkeleton } from "@/components/book/BookCardSkeleton";
import { PriceFilter } from "@/components/book/PriceFilter";
import { useAddToCart } from "@/hooks/useAddToCart";
import { SORT_OPTIONS, useBookFilters, type SortKey } from "@/hooks/useBookFilters";
import { formatCurrency } from "@/utils/formatCurrency";

export default function BookList() {
  const { filters, apiParams, update, reset, hasActiveFilters } = useBookFilters();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const addToCart = useAddToCart();

  // Danh mục chỉ cần tải một lần
  useEffect(() => {
    categoryAPI.list().then((res) => setCategories((res.data as Category[]) || [])).catch(() => {});
  }, []);

  // Tải sách mỗi khi bộ lọc trên URL thay đổi; hủy request cũ nếu người dùng đổi lọc liên tục
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    productAPI
      .list(apiParams, { signal: controller.signal })
      .then((res) => {
        setProducts((res.data as Product[]) || []);
        setMeta(res.meta ?? null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.response?.data?.message || "Không thể tải danh sách sách");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiParams]);

  // Đồng bộ ô tìm kiếm khi URL đổi (back/forward)
  useEffect(() => { setSearchInput(filters.search); }, [filters.search]);

  const total = meta?.total ?? 0;
  const totalPages = meta?.total_pages ?? 1;

  // Tiêu đề: đang tìm → "Kết quả cho ..."; chọn danh mục → tên danh mục; còn lại → "Tất cả sách"
  const categoryName = categories.find((c) => c.id === filters.category)?.name;
  const heading = filters.search
    ? `Kết quả cho "${filters.search}" (${total})`
    : `${categoryName ?? "Tất cả sách"} (${total})`;

  const priceLabel =
    filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? `${filters.minPrice !== undefined ? formatCurrency(filters.minPrice) : "0đ"} – ${filters.maxPrice !== undefined ? formatCurrency(filters.maxPrice) : "không giới hạn"}`
      : null;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ search: searchInput });
  };

  const goToPage = (page: number) => {
    update({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* ---------- Điện thoại/tablet: danh mục dạng thanh ngang, dính dưới Navbar ---------- */}
      <div className="lg:hidden sticky top-16 z-20 -mt-6 mb-3 bg-gray-50/95 backdrop-blur border-b border-gray-200 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <CategoryBar categories={categories} active={filters.category} onSelect={(id) => update({ category: id })} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* ---------- Sidebar (máy tính): danh mục + giá ---------- */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0 space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Filter size={18} /> Danh mục</h3>
            <nav className="flex flex-col gap-1">
              {[{ id: null as string | null, name: "Tất cả sách" }, ...categories].map((c) => {
                const active = filters.category === c.id;
                return (
                  <button
                    key={c.id ?? "all"}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => update({ category: c.id })}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border-l-4 ${
                      active
                        ? "bg-primary text-white font-semibold border-accent"
                        : "text-gray-700 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Khoảng giá</h3>
            <PriceFilter
              min={filters.minPrice}
              max={filters.maxPrice}
              onChange={({ minPrice, maxPrice }) => update({ minPrice, maxPrice })}
            />
          </div>
        </aside>

        {/* ---------- Nội dung chính ---------- */}
        <div className="flex-1 min-w-0">
          <form onSubmit={submitSearch} className="flex gap-3 mb-5">
            <SearchBox value={searchInput} onChange={setSearchInput} onSubmit={(q) => update({ search: q })} />
            <Button type="submit" className="flex-shrink-0 hidden sm:inline-flex">Tìm kiếm</Button>
          </form>

          {/* Điện thoại/tablet: lọc giá thu gọn */}
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setShowPriceFilter((v) => !v)}
              aria-expanded={showPriceFilter}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border ${
                filters.minPrice !== undefined || filters.maxPrice !== undefined
                  ? "border-primary bg-primary/5 text-primary font-semibold"
                  : "border-gray-300 bg-light text-gray-700"
              }`}
            >
              <SlidersHorizontal size={16} /> Lọc giá
              <ChevronDown size={16} className={`transition-transform ${showPriceFilter ? "rotate-180" : ""}`} />
            </button>
            {showPriceFilter && (
              <div className="card p-4 mt-2">
                <PriceFilter
                  min={filters.minPrice}
                  max={filters.maxPrice}
                  onChange={({ minPrice, maxPrice }) => { update({ minPrice, maxPrice }); setShowPriceFilter(false); }}
                />
              </div>
            )}
          </div>

          {error && <Alert type="error" title="Lỗi" description={error} />}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">{heading}</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Sắp xếp:
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-light text-gray-800 focus:ring-2 focus:ring-primary"
              >
                {(Object.keys(SORT_OPTIONS) as SortKey[]).filter((key) => key !== "relevance" || !!filters.search).map((key) => (
                  <option key={key} value={key}>{SORT_OPTIONS[key].label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Bộ lọc đang áp dụng */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
              {filters.search && <FilterChip label={`Từ khóa: ${filters.search}`} onRemove={() => update({ search: "" })} />}
              {categoryName && <FilterChip label={categoryName} onRemove={() => update({ category: null })} />}
              {priceLabel && <FilterChip label={priceLabel} onRemove={() => update({ minPrice: undefined, maxPrice: undefined })} />}
              <button type="button" onClick={reset} className="text-accent hover:underline">Xóa tất cả bộ lọc</button>
            </div>
          )}

          {loading ? (
            <BookGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={32} />}
              title="Không tìm thấy sách"
              description="Hãy thử từ khóa khác hoặc chọn danh mục khác."
              action={hasActiveFilters ? <Button variant="outline" onClick={reset}>Xóa bộ lọc</Button> : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {products.map((p) => (
                  <BookCard key={p.id} product={p} onAddToCart={async (book) => { await addToCart(book); }} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Phân trang">
                  <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => goToPage(filters.page - 1)} aria-label="Trang trước">
                    <ChevronLeft size={16} />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      aria-current={n === filters.page ? "page" : undefined}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${n === filters.page ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      {n}
                    </button>
                  ))}
                  <Button variant="outline" size="sm" disabled={filters.page >= totalPages} onClick={() => goToPage(filters.page + 1)} aria-label="Trang sau">
                    <ChevronRight size={16} />
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-gray-100 text-gray-700">
      {label}
      <button type="button" onClick={onRemove} className="w-5 h-5 rounded-full hover:bg-gray-200 text-gray-500" aria-label={`Bỏ lọc ${label}`}>×</button>
    </span>
  );
}
