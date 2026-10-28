// Page: BookDetail - Chi tiet sach

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { productAPI } from "@/api/client";
import { useAddToCart } from "@/hooks/useAddToCart";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { getProductImageUrl } from "@/utils/image";
import { BookOpen, Mail, Phone, ChevronLeft } from "lucide-react";
import { Loading } from "@/components/common/Loading";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { useAuthStore } from "@/store/auth";
import { QuantityInput } from "@/components/common/QuantityInput";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) return;
    productAPI.get(id).then((res) => {
      setProduct(res.data as Product);
    }).catch(() => setError("Không thể tải chi tiết sách")).finally(() => setLoading(false));
  }, [id]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/books" className="flex items-center gap-2 text-sm text-primary hover:underline mb-6">
        <ChevronLeft size={16} /> Danh mục sách
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="card h-full">
          <div className="h-80 bg-gray-100 flex items-center justify-center relative overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img src={getProductImageUrl(product.images[0].r2_key)} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='16'%3ENo image%3C/text%3E%3C/svg%3E"; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400"><BookOpen size={64} /></div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-medium text-primary uppercase tracking-wider mb-2 block">{product.category?.name || "Chưa phân loại"}</span>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-gray-600">{product.description || "Không có mô tả chi tiết."}</p>
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
  );
}