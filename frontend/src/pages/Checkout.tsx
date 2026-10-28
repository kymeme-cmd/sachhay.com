// Page: Checkout - Thanh toan

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderAPI } from "@/api/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { SHIPPING_METHOD_LABELS } from "@/utils/order";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth";
import { ChevronLeft, Truck } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Alert";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, total, itemCount } = useCart();
  const [paymentMethod] = useState<"cod" | "bank_transfer" | "credit_card">("cod");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Shipping address form state
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    district: "",
    ward: "",
    note: "",
  });

  const handleAddressChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  // Validate required fields before submit
  const isValid = (["name", "phone", "address", "city", "district", "ward"] as const).every(
    (field) => shippingAddress[field].trim() !== ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError("Vui lòng nhập đầy đủ thông tin giao hàng");
      return;
    }

    if (itemCount === 0) {
      setError("Giỏ hàng đang trống");
      return;
    }

    setError("");
    setIsProcessing(true);
    try {
      const { note, ...address } = shippingAddress;
      const res = await orderAPI.create({
        items: items
          .filter((i) => i.product?.is_active !== 0)
          .map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: address,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        note: note || undefined,
      });
      // Backend đã tự xóa giỏ hàng sau khi tạo đơn
      const { order } = res.data as { order: { id: string } };
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Thanh toán thất bại");
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/cart" className="flex items-center gap-2 text-sm text-primary hover:underline mb-6">
        <ChevronLeft size={16} /> Về giỏ hàng
      </Link>

      {error && <Alert type="error" title="Lỗi" description={error} />}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">Thông tin giao hàng</h3>
            <div className="space-y-4">
              <Input
                label="Họ tên"
                value={shippingAddress.name}
                onChange={(e) => handleAddressChange("name", e.target.value)}
                required
              />
              <Input
                label="Số điện thoại"
                type="tel"
                value={shippingAddress.phone}
                onChange={(e) => handleAddressChange("phone", e.target.value)}
                required
              />
              <Input
                label="Địa chỉ (số nhà, đường)"
                value={shippingAddress.address}
                onChange={(e) => handleAddressChange("address", e.target.value)}
                placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
                required
              />
              <Input
                label="Thành phố / Tỉnh"
                value={shippingAddress.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="Ví dụ: Hồ Chí Minh, Hà Nội"
                required
              />
              <Input
                label="Quận / Hủyện"
                value={shippingAddress.district}
                onChange={(e) => handleAddressChange("district", e.target.value)}
                placeholder="Ví dụ: Quận 1, Ba Đình"
                required
              />
              <Input
                label="Phường / Xã"
                value={shippingAddress.ward}
                onChange={(e) => handleAddressChange("ward", e.target.value)}
                placeholder="Ví dụ: Phường Bến Nghé, Phường Định Công"
                required
              />
              <Input
                label="Ghi chú đơn hàng"
                value={shippingAddress.note}
                onChange={(e) => handleAddressChange("note", e.target.value)}
                placeholder="Ví dụ: Giao vào buổi chiều, gọi trước khi giao..."
              />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Truck size={20} /> Phương thức vận chuyển</h3>
            <div className="space-y-3">
              {[
                { value: "standard", label: SHIPPING_METHOD_LABELS.standard, icon: <ClockIcon size={18} /> },
                { value: "express", label: SHIPPING_METHOD_LABELS.express, icon: <RapidIcon size={18} /> },
                { value: "priority", label: SHIPPING_METHOD_LABELS.priority, icon: <FastForwardIcon size={18} /> },
              ].map((method) => (
                <label key={method.value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    name="shipping_method"
                    value={method.value}
                    checked={shippingMethod === method.value}
                    onChange={() => setShippingMethod(method.value)}
                    className="w-4 h-4 text-primary"
                  />
                  {method.icon}
                  <span className="font-medium text-gray-800">{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 card p-6">
          <h3 className="font-semibold text-gray-800 mb-6">Tổng tiền đơn hàng</h3>
          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính ({itemCount} món)</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí vận chuyển</span>
              <span>Miễn phí</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary pt-4 border-t border-gray-200">
              <span>Tổng thanh toán</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isProcessing} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-secondary disabled:opacity-50" isLoading={isProcessing}>
            Đặt hàng ngay
          </Button>
        </div>
      </div>
    </div>
  );
}

// Inline SVG icons for shipping methods
function ClockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RapidIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

function FastForwardIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4v16l7-4 7 4V4" /><path d="M9 9l6 2-2 6" />
    </svg>
  );
}