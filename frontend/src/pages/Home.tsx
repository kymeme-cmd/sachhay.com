// ============================================================
// Page: Home - Trang chủ
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "@/api/client";
import type { Product } from "@/types";
import { BookOpen, Truck, Tag, ShieldCheck, Sparkles, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { getProductImageUrl } from "@/utils/image";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/common/Alert";
import { useCart } from "@/hooks/useCart";
import { RecentlyViewed } from "@/components/book/RecentlyViewed";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBooks, setTotalBooks] = useState(0);
  const { itemCount } = useCart();

  useEffect(() => {
    productAPI
      .list({ per_page: 8 })
      .then((res) => {
        setProducts((res.data as Product[]) || []);
        setTotalBooks(res.meta?.total ?? 0);
      })
      .catch(() => setError("Không thể tải sách nổi bật"))
      .finally(() => setLoading(false));
  }, []);

  const features = [
    { icon: <BookOpen size={32} />, title: "Hàng ngàn sách", desc: "Văn học, kinh tế, kỹ năng, thiếu nhi..." },
    { icon: <Truck size={32} />, title: "Giao hàng nhanh", desc: "Giao hàng toàn quốc trong 2-3 ngày" },
    { icon: <Tag size={32} />, title: "Giá tốt nhất", desc: "Khuyến mãi thường xuyên, giá cả cạnh tranh" },
    { icon: <ShieldCheck size={32} />, title: "An toàn thanh toán", desc: "Hỗ trợ COD, chuyển khoản, thẻ tín dụng" },
  ];

  const heroCovers = products.filter((p) => p.images && p.images.length > 0).slice(0, 3);

  if (loading) return <Loading text="Đang tải sách nổi bật..." />;

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-dark via-primary to-secondary p-8 md:p-12 text-white overflow-hidden shadow-xl">
        {/* Trang trí: đốm sáng + vân giấy chấm */}
        <div aria-hidden className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-accent/30 blur-3xl" />
        <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative z-10 grid lg:grid-cols-[minmax(0,1fr)_auto] items-center gap-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-sm font-medium text-amber-200 mb-5">
              <Sparkles size={16} /> Hiệu sách trực tuyến · Giao toàn quốc
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Khám phá{" "}
              <span className="relative whitespace-nowrap text-amber-300">
                thế giới sách
                <svg aria-hidden viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute left-0 -bottom-2 w-full h-3 text-amber-400/80">
                  <path d="M2 9 C 80 2, 220 2, 298 8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Tuyển chọn sách hay, giá cả phải chăng, giao hàng nhanh chóng đến tận tay bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/books" className="inline-flex items-center justify-center gap-2 bg-amber-400 text-dark px-7 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/30 hover:bg-amber-300 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                <BookOpen size={20} /> Xem tất cả sách
              </Link>
              <Link to="/cart" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold border-2 border-paper/70 text-white hover:bg-white/10 transition-colors w-full sm:w-auto">
                <ShoppingCart size={20} /> Giỏ hàng ({itemCount || 0})
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8 pt-6 border-t border-white/15 text-sm">
              <div><span className="block text-2xl font-bold text-amber-300">{totalBooks || "60"}+</span><span className="text-gray-300">đầu sách</span></div>
              <div><span className="block text-2xl font-bold text-amber-300">4</span><span className="text-gray-300">thể loại</span></div>
              <div><span className="block text-2xl font-bold text-amber-300">2–3 ngày</span><span className="text-gray-300">giao hàng</span></div>
            </div>
          </div>

          {/* Chồng sách xòe: lấy bìa của 3 cuốn nổi bật */}
          {heroCovers.length === 3 && (
            <div aria-hidden className="hidden lg:block relative w-[300px] h-[340px] mr-4">
              {heroCovers.map((p, i) => (
                <img
                  key={p.id}
                  src={getProductImageUrl(p.images![0].r2_key)}
                  alt=""
                  className={`absolute top-1/2 left-1/2 w-44 aspect-[2/3] object-cover rounded-lg shadow-2xl ring-1 ring-black/20 transition-transform duration-500 hover:-translate-y-[60%] ${
                    ["-translate-x-[95%] -translate-y-1/2 -rotate-12", "-translate-x-1/2 -translate-y-[55%] z-10", "-translate-x-[5%] -translate-y-1/2 rotate-12"][i]
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, idx) => (
          <div key={idx} className="card p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              {f.icon}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <RecentlyViewed />

      {/* Featured books */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Sách nổi bật</h2>
          <Link to="/books" className="text-sm font-medium text-primary hover:underline">Xem tất cả →</Link>
        </div>

        {error && <Alert type="error" title="Lỗi" description={error} />}

        {products.length === 0 ? (
          <EmptyState title="Không có sách nổi bật" description="Hãy quay lại sau." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/books/${p.id}`}
                className="card group cursor-pointer"
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={getProductImageUrl(p.images[0].r2_key)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <BookOpen size={32} />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-semibold text-gray-800">
                    {formatCurrency(p.price)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{p.name}</h3>
                  <p className="text-primary font-bold">{formatCurrency(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}