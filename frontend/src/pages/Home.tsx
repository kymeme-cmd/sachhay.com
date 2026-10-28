// ============================================================
// Page: Home - Trang chủ
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productAPI } from "@/api/client";
import type { Product } from "@/types";
import { BookOpen, Truck, Tag, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { getProductImageUrl } from "@/utils/image";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/common/Alert";
import { useCart } from "@/hooks/useCart";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { itemCount } = useCart();

  useEffect(() => {
    productAPI
      .list({ per_page: 8 })
      .then((res) => {
        setProducts((res.data as Product[]) || []);
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

  if (loading) return <Loading text="Đang tải sách nổi bật..." />;

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 md:p-12 text-white overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Khám phá thế giới sách
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Tuyển chọn sách hay, giá cả phải chăng, giao hàng nhanh chóng đến tận tay bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/books" className="inline-flex justify-center bg-paper text-primary px-6 py-2.5 rounded-xl font-semibold hover:bg-white transition-colors w-full sm:w-auto">
              Xem tất cả sách
            </Link>
            <Link to="/cart" className="inline-flex justify-center px-6 py-2.5 rounded-xl font-medium border-2 border-paper/80 text-white hover:bg-white/10 transition-colors w-full sm:w-auto">
              Giỏ hàng ({itemCount || 0})
            </Link>
          </div>
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