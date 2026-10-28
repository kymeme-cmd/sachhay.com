// Page: Cart - Gio hang

import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuthStore } from "@/store/auth";
import { ShoppingCart, ChevronLeft, Trash2 } from "lucide-react";
import { QuantityInput } from "@/components/common/QuantityInput";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { getProductImageUrl } from "@/utils/image";

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { items, loading, error, total, itemCount, removeItem, updateItem, clearCart } = useCart();

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={<ShoppingCart size={32} />}
        title="Vui lòng đăng nhập"
        description="Đăng nhập để xem và quản lý giỏ hàng của bạn."
        action={<Link to="/login" className="btn-primary inline-block">Đăng nhập</Link>}
      />
    );
  }

  if (loading) return <Loading text="Đang tải giỏ hàng..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/books" className="flex items-center gap-2 text-sm text-primary hover:underline mb-6">
        <ChevronLeft size={16} /> Tiếp tục mua sắm
      </Link>

      {error && <Alert type="error" title="Lỗi" description={error} />}

      {itemCount === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={32} />}
          title="Giỏ hàng đang trống"
          description="Chưa có sản phẩm nào trong giỏ hàng của bạn."
          action={
            <Link to="/books" className="btn-primary mt-6 inline-block">Tìm sách để mua</Link>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng ({itemCount} món)</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="card p-4 flex gap-4 items-center">
                  <Link to={`/books/${item.product_id}`} className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                    <img src={getProductImageUrl(item.product?.images?.[0]?.r2_key)} alt={item.product?.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1">
                    <Link to={`/books/${item.product_id}`} className="font-semibold text-gray-800 mb-1 hover:text-primary block">{item.product?.name || "Sản phẩm"}</Link>
                    {item.product?.is_active === 0 && <p className="text-xs text-red-600">Sản phẩm đã ngừng bán</p>}
                    <p className="text-primary font-medium">{formatCurrency((item.product?.price || 0) * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <QuantityInput
                      value={item.quantity}
                      max={item.product?.stock ?? item.quantity}
                      onChange={(q) => updateItem(item.id, q)}
                    />
                    <Button variant="danger" size="sm" onClick={() => removeItem(item.id)} className="p-1.5">
                      <Trash2 size={16} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 card p-6">
            <h3 className="font-semibold text-gray-800 mb-6">Tổng tiền</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Tổng thanh toán</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
            </div>
            <Button
              onClick={() => navigate("/checkout")}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-secondary disabled:opacity-50"
            >
              Tiến hành thanh toán
            </Button>
            <Button variant="outline" onClick={() => clearCart()} className="w-full mt-3 text-red-600 border-red-200 hover:bg-red-50">
              Xóa tất cả
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}