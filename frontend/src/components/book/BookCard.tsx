// ============================================================
// Component: BookCard - Thẻ sách trong lưới danh sách
// ============================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { fallbackImageUrl, getProductImageUrl } from "@/utils/image";
import { StarRating } from "./StarRating";

/** Dưới ngưỡng này hiển thị cảnh báo "Chỉ còn X cuốn" */
export const LOW_STOCK_THRESHOLD = 5;

interface BookCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<void>;
}

export function BookCard({ product: p, onAddToCart }: BookCardProps) {
  const [adding, setAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const outOfStock = p.stock <= 0;
  const lowStock = !outOfStock && p.stock < LOW_STOCK_THRESHOLD;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAddToCart(p);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card group flex flex-col h-full">
      <Link
        to={`/books/${p.id}`}
        className={`block relative aspect-[2/3] bg-gray-200 overflow-hidden ${imageLoaded ? "" : "animate-pulse"}`}
      >
        {/* Ảnh tải lười (lazy) khi cuộn tới; hiện dần khi tải xong */}
        <img
          src={getProductImageUrl(p.images?.[0]?.r2_key)}
          alt={p.name}
          loading="lazy"
          decoding="async"
          width={400}
          height={600}
          ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !imageLoaded) setImageLoaded(true); }}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackImageUrl(); setImageLoaded(true); }}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? (outOfStock ? "opacity-60 grayscale" : "opacity-100") : "opacity-0"
          }`}
        />
        {outOfStock && (
          <span className="absolute top-2 left-2 badge bg-gray-900/80 text-white">Hết hàng</span>
        )}
      </Link>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link to={`/books/${p.id}`} className="font-semibold text-gray-800 text-sm sm:text-base leading-snug line-clamp-2 hover:text-accent transition-colors">
          {p.name}
        </Link>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">{p.author || " "}</p>
        {(p.review_count ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <StarRating value={p.avg_rating ?? 0} size={13} />
            <span>({p.review_count})</span>
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-accent font-bold text-base sm:text-lg">{formatCurrency(p.price)}</span>
            {lowStock && <span className="text-xs font-medium text-orange-600">Chỉ còn {p.stock} cuốn</span>}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock || adding}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-medium py-2 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
            {outOfStock ? "Hết hàng" : adding ? "Đang thêm..." : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </div>
  );
}
