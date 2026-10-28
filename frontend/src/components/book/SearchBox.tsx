// ============================================================
// Component: SearchBox - Ô tìm kiếm sách có gợi ý khi gõ
// Tìm không dấu (backend xử lý): gõ "dac nhan" vẫn gợi ý "Đắc Nhân Tâm"
// ============================================================

import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { productAPI } from "@/api/client";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { getProductImageUrl } from "@/utils/image";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 6;

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** Gửi tìm kiếm đầy đủ (Enter / nút Tìm kiếm / "Xem tất cả kết quả") */
  onSubmit: (value: string) => void;
}

export function SearchBox({ value, onChange, onSubmit }: SearchBoxProps) {
  const navigate = useNavigate();
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // Gợi ý: chờ người dùng ngừng gõ rồi mới gọi API, hủy request cũ
  useEffect(() => {
    const q = value.trim();
    if (q.length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      productAPI
        .list({ search: q, per_page: MAX_SUGGESTIONS, sort_by: "relevance" }, { signal: controller.signal })
        .then((res) => {
          setSuggestions((res.data as Product[]) || []);
          setTotal(res.meta?.total ?? 0);
          setHighlight(-1);
        })
        .catch(() => { if (!controller.signal.aborted) setSuggestions([]); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value]);

  // Đóng gợi ý khi bấm ra ngoài
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const showDropdown = open && value.trim().length >= MIN_CHARS;

  const submit = () => {
    setOpen(false);
    onSubmit(value);
  };

  const pick = (p: Product) => {
    setOpen(false);
    navigate(`/books/${p.id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && highlight >= 0 && suggestions[highlight]) pick(suggestions[highlight]);
      else submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <Search size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
      <input
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
        autoComplete="off"
        placeholder="Tìm theo tên sách, tác giả..."
        className="input-field pl-10 pr-9"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(""); onSubmit(""); setOpen(false); }}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          aria-label="Xóa từ khóa"
        >
          <X size={18} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute z-30 mt-2 w-full rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
          {loading && suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Đang tìm...</p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Không có sách nào khớp "{value.trim()}"</p>
          ) : (
            <ul id={listId} role="listbox" className="max-h-96 overflow-y-auto">
              {suggestions.map((p, i) => (
                <li
                  key={p.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => { e.preventDefault(); pick(p); }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${i === highlight ? "bg-gray-100" : ""}`}
                >
                  <img
                    src={getProductImageUrl(p.images?.[0]?.r2_key)}
                    alt=""
                    loading="lazy"
                    className="w-9 h-12 rounded object-cover bg-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    {p.author && <p className="text-xs text-gray-500 truncate">{p.author}</p>}
                  </div>
                  <span className="text-sm font-semibold text-accent whitespace-nowrap">{formatCurrency(p.price)}</span>
                </li>
              ))}
            </ul>
          )}
          {suggestions.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); submit(); }}
              className="w-full px-4 py-2.5 text-sm font-medium text-accent border-t border-gray-100 hover:bg-gray-50 text-left"
            >
              Xem tất cả {total} kết quả cho "{value.trim()}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
