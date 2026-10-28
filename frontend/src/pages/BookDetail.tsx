// Page: BookDetail - Chi tiet sach

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { productAPI } from "@/api/client";
import { useAddToCart } from "@/hooks/useAddToCart";
import { recordViewed } from "@/hooks/useRecentlyViewed";
import type { Product, ReviewSummary } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { fallbackImageUrl, getProductImageUrl } from "@/utils/image";
import { StarRating } from "@/components/book/StarRating";
import { ReviewSection } from "@/components/book/ReviewSection";
import { RecentlyViewed } from "@/components/book/RecentlyViewed";
import { BookOpen, Mail, Phone, ChevronLeft } from "lucide-react";
import { Loading } from "@/components/common/Loading";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { useAuthStore } from "@/store/auth";
import { QuantityInput } from "@/components/common/QuantityInput";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState<{ average: number | null; count: number }>({ average: null, count: 0 });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setQuantity(1);
    productAPI.get(id).then((res) => {
      const p = res.data as Product;
      setProduct(p);
      setRating({ average: p.avg_rating ?? null, count: p.review_count ?? 0 });
      recordViewed(p);
    }).catch(() => setError("Không thể tải chi tiết sách")).finally(() => setLoading(false));
  }, [id]);

  // Liên kết "/books/:id#reviews" (từ đơn hàng) → cuộn tới phần đánh giá
  useEffect(() => {
    if (!loading && product && location.hash === "#reviews") {
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, product, location.hash]);

  const handleSummaryChange = useCallback((s: ReviewSummary) => setRating({ average: s.average, count: s.count }), []);

  const addToCart = useAddToCart();
  const [adding, setAdding] = useState(false);

  // Thêm vào giỏ và hiện thông báo nhỏ, không chuyển trang
  const handleAddToCart = async () => {
    if (!product) return;
    if (quantity > product.stock) { setError("Vượt quá số lượng tồn kho"); return; }
    setError(null);
    setAdding(true);
    if (await addToCart(product, quantity)) setQuantity(1);
    setAdding(false);
  };

  if (loading) return <Loading text="Đang tải chi tiết sách..." />;

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Alert type="error" title="Không tìm thấy sách" description={error || ""} />
        <Link to="/books" className="btn-primary mt-4 inline-block">Về danh sách sách</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <div>
      <Link to="/books" className="flex items-center gap-2 text-sm text-primary hover:underline mb-6">
        <ChevronLeft size={16} /> Danh mục sách
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-12">
        {/* Ảnh bìa: giữ đúng tỉ lệ sách 2:3, không bị cắt */}
        <div className="w-full max-w-sm mx-auto lg:max-w-none">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-200 border border-gray-200 shadow-md">
            {product.images && product.images.length > 0 ? (
              <img src={getProductImageUrl(product.images[0].r2_key)} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = fallbackImageUrl(); }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400"><BookOpen size={64} /></div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            {product.category ? (
              <Link to={`/books?category=${product.category.id}`} className="text-xs font-medium text-primary uppercase tracking-wider mb-2 block hover:underline">{product.category.name}</Link>
            ) : (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Chưa phân loại</span>
            )}
            <h1 className="text-3xl font-bold text-gray-800 mb-1">{product.name}</h1>
            {product.author && <p className="text-gray-600 mb-2">Tác giả: <span className="font-medium text-gray-800">{product.author}</span></p>}
            <a href="#reviews" onClick={(e) => { e.preventDefault(); document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-3">
              {rating.count > 0 ? (
                <><StarRating value={rating.average ?? 0} /> <span className="font-medium text-gray-800">{rating.average?.toFixed(1)}</span> ({rating.count} đánh giá)</>
              ) : (
                <><StarRating value={0} /> Chưa có đánh giá</>
              )}
            </a>
            <p className="text-gray-600 whitespace-pre-line">{product.description || "Không có mô tả chi tiết."}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-600">Giá:</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-600">Tồn kho:</span>
              <span className={`font-medium ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                {product.stock > 0 ? `Còn ${product.stock} cuốn` : "Hết hàng"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng:</label>
            <div className="flex items-center gap-3">
              <QuantityInput value={quantity} onChange={setQuantity} max={product.stock} disabled={product.stock <= 0} />
              {product.stock > 0 && <span className="text-sm text-gray-500">Tối đa {product.stock} cuốn</span>}
            </div>
          </div>

          {error && <Alert type="error" title="Lỗi" description={error} />}

          <div className="flex gap-3">
            {isAuthenticated ? (
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || loading}
                isLoading={adding}
                className="flex-1 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-secondary disabled:opacity-50"
              >
                {product.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
              </Button>
            ) : (
              <Link
                to="/login"
                state={{ from: `/books/${product.id}` }}
                className="flex-1 inline-flex items-center justify-center bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-secondary"
              >
                Đăng nhập để mua
              </Link>
            )}
            <Button variant="outline" onClick={() => navigate("/books")} className="flex-1">Trở về</Button>
          </div>

          <div className="pt-6 border-t border-gray-200 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Mail size={16} /> support@sachhay.vn</div>
            <div className="flex items-center gap-2 text-gray-600"><Phone size={16} /> 0909 123 456</div>
          </div>
        </div>
      </div>
      </div>

      <ReviewSection productId={product.id} onSummaryChange={handleSummaryChange} />

      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}