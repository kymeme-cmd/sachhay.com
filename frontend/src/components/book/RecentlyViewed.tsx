// ============================================================
// Component: RecentlyViewed - Dải "Sách bạn đã xem gần đây"
// ============================================================

import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { useRecentlyViewed, type ViewedBook } from "@/hooks/useRecentlyViewed";
import { formatCurrency } from "@/utils/formatCurrency";
import { fallbackImageUrl, getProductImageUrl } from "@/utils/image";

interface RecentlyViewedProps {
  /** Ẩn cuốn đang xem (trang chi tiết) */
  excludeId?: string;
  limit?: number;
}

export function RecentlyViewed({ excludeId, limit = 8 }: RecentlyViewedProps) {
  const { items } = useRecentlyViewed();
  const shown = items.filter((b) => b.id !== excludeId).slice(0, limit);
  if (shown.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <History size={22} className="text-primary" /> Sách bạn đã xem gần đây
        </h2>
        <Link to="/history" className="text-sm font-medium text-primary hover:underline">Xem lịch sử →</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {shown.map((b) => <ViewedBookCard key={b.id} book={b} />)}
      </div>
    </section>
  );
}

export function ViewedBookCard({ book, className = "w-36 flex-shrink-0 snap-start" }: { book: ViewedBook; className?: string }) {
  return (
    <Link to={`/books/${book.id}`} className={`group ${className}`}>
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-200 border border-gray-200">
        <img
          src={getProductImageUrl(book.image_key)}
          alt={book.name}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackImageUrl(); }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-accent">{book.name}</p>
      <p className="text-sm font-semibold text-accent">{formatCurrency(book.price)}</p>
    </Link>
  );
}
