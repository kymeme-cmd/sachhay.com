// ============================================================
// Component: CategoryBar - Danh mục dạng thanh ngang cuộn được (điện thoại)
// ============================================================

import { useEffect, useRef } from "react";
import type { Category } from "@/types";

interface CategoryBarProps {
  categories: Category[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryBar({ categories, active, onSelect }: CategoryBarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Cuộn mục đang chọn vào giữa thanh
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active, categories.length]);

  return (
    <nav
      aria-label="Danh mục sách"
      className="flex gap-2 overflow-x-auto snap-x scroll-px-4 -mx-4 px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {[{ id: null as string | null, name: "Tất cả" }, ...categories].map((c) => {
        const isActive = active === c.id;
        return (
          <button
            key={c.id ?? "all"}
            ref={isActive ? activeRef : undefined}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect(c.id)}
            className={`snap-start flex-shrink-0 px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
              isActive
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-white text-gray-700 border-gray-300 active:bg-gray-100"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </nav>
  );
}
