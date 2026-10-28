// ============================================================
// Component: PriceFilter - Lọc theo khoảng giá (mốc có sẵn + tự nhập)
// ============================================================

import { useEffect, useState } from "react";
import { PRICE_RANGES } from "@/hooks/useBookFilters";

interface PriceFilterProps {
  min?: number;
  max?: number;
  onChange: (range: { minPrice?: number; maxPrice?: number }) => void;
}

export function PriceFilter({ min, max, onChange }: PriceFilterProps) {
  const [minInput, setMinInput] = useState(min?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(max?.toString() ?? "");

  // Đồng bộ ô nhập khi URL thay đổi (back/forward, chọn mốc có sẵn)
  useEffect(() => { setMinInput(min?.toString() ?? ""); }, [min]);
  useEffect(() => { setMaxInput(max?.toString() ?? ""); }, [max]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    let lo = minInput ? Number(minInput) : undefined;
    let hi = maxInput ? Number(maxInput) : undefined;
    if (lo !== undefined && hi !== undefined && lo > hi) [lo, hi] = [hi, lo];
    onChange({ minPrice: lo, maxPrice: hi });
  };

  return (
    <div>
      <div className="flex flex-col gap-1">
        {PRICE_RANGES.map((r) => {
          const active = min === r.min && max === r.max;
          return (
            <label key={r.label} className="flex items-center gap-2 px-1 py-1 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="price-range"
                checked={active}
                onChange={() => onChange({ minPrice: r.min, maxPrice: r.max })}
                className="accent-accent"
              />
              <span className={active ? "font-semibold text-gray-900" : ""}>{r.label}</span>
            </label>
          );
        })}
      </div>

      <form onSubmit={apply} className="mt-3 flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Từ"
          aria-label="Giá thấp nhất"
          value={minInput}
          onChange={(e) => setMinInput(e.target.value)}
          className="w-full min-w-0 px-2 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary"
        />
        <span className="text-gray-400">–</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Đến"
          aria-label="Giá cao nhất"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          className="w-full min-w-0 px-2 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary"
        />
        <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-secondary">
          Áp dụng
        </button>
      </form>

      {(min !== undefined || max !== undefined) && (
        <button
          type="button"
          onClick={() => onChange({ minPrice: undefined, maxPrice: undefined })}
          className="mt-2 text-xs text-accent hover:underline"
        >
          Bỏ lọc giá
        </button>
      )}
    </div>
  );
}
