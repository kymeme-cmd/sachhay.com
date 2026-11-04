// ============================================================
// Component: RelatedBooks - "Sách cùng thể loại" ở trang chi tiết sách
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "@/api/client";
import type { Product } from "@/types";
import { ViewedBookCard } from "./RecentlyViewed";

interface RelatedBooksProps {
  productId: string;
  categoryId: string;
  categoryName: string;
}

export function RelatedBooks({ productId, categoryId, categoryName }: RelatedBooksProps) {
  const [books, setBooks] = useState<Product[]>([]);

  useEffect(() => {
    productAPI
      .list({ category_id: categoryId, per_page: 9 })
      .then((res) => setBooks(((res.data as Product[]) || []).filter((p) => p.id !== productId).slice(0, 8)))
      .catch(() => setBooks([]));
  }, [productId, categoryId]);

  if (books.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Sách cùng thể loại</h2>
        <Link to={`/books?category=${categoryId}`} className="text-sm font-medium text-primary hover:underline">Xem tất cả {categoryName} →</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {books.map((p) => (
          <ViewedBookCard
            key={p.id}
            book={{ id: p.id, name: p.name, author: p.author, price: p.price, image_key: p.images?.[0]?.r2_key ?? null, viewed_at: 0 }}
          />
        ))}
      </div>
    </section>
  );
}
