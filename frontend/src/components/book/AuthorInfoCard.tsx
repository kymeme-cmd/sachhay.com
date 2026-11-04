// ============================================================
// Component: AuthorInfoCard - Mục "Về tác giả" ở trang chi tiết sách (dữ liệu bảng authors)
// ============================================================

import { Link } from "react-router-dom";
import { Feather, Globe, CalendarDays } from "lucide-react";
import type { AuthorInfo } from "@/types";

export function AuthorInfoCard({ author }: { author: AuthorInfo }) {
  const years = author.born_year ? `${author.born_year}${author.died_year ? ` – ${author.died_year}` : ""}` : null;
  const works = author.notable_works?.split(";").map((w) => w.trim()).filter(Boolean) ?? [];

  return (
    <section className="card p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-5">Về tác giả</h2>
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-amber-300 flex items-center justify-center flex-shrink-0">
          <Feather size={28} />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{author.name}</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm text-gray-600">
              {author.nationality && <span className="inline-flex items-center gap-1.5"><Globe size={15} /> {author.nationality}</span>}
              {years && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> {years}</span>}
            </div>
          </div>
          {author.bio && <p className="text-gray-700 leading-relaxed">{author.bio}</p>}
          {works.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Tác phẩm tiêu biểu</p>
              <div className="flex flex-wrap gap-2">
                {works.map((w) => <span key={w} className="badge bg-primary/10 text-primary text-sm">{w}</span>)}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link to={`/books?search=${encodeURIComponent(author.name)}`} className="text-sm font-semibold text-primary hover:underline">
              Xem sách của {author.name} tại Sách Hay →
            </Link>
            <p className="text-xs text-gray-400">Thông tin tham khảo, tổng hợp từ nguồn phổ biến.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
