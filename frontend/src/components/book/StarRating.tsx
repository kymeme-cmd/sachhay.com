// ============================================================
// Component: StarRating - Hiển thị sao (hỗ trợ nửa sao) hoặc chọn sao
// ============================================================

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  size?: number;
  /** Có onChange → chế độ chọn sao (1–5) */
  onChange?: (value: number) => void;
}

const LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Hay", "Rất hay"];

/** Dòng sao gọn cho thẻ sách: "★★★★☆ 4.0 (12)" hoặc "☆☆☆☆☆ Chưa có đánh giá" */
export function RatingLine({ product, size = 14 }: { product: { avg_rating?: number | null; review_count?: number }; size?: number }) {
  const count = product.review_count ?? 0;
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <StarRating value={count > 0 ? product.avg_rating ?? 0 : 0} size={size} />
      {count > 0 ? (
        <span><span className="font-semibold text-gray-700">{product.avg_rating?.toFixed(1)}</span> ({count})</span>
      ) : (
        <span>Chưa có đánh giá</span>
      )}
    </div>
  );
}

export function StarRating({ value, size = 16, onChange }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  if (onChange) {
    const shown = hover || value;
    return (
      <div className="flex items-center gap-2">
        <div className="flex" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Chọn số sao">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} sao`}
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange(n)}
              className="p-0.5"
            >
              <Star size={size} className={n <= shown ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
            </button>
          ))}
        </div>
        {shown > 0 && <span className="text-sm text-gray-600">{LABELS[shown]}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - n + 1)); // 0, 0.5, 1...
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-gray-300" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
