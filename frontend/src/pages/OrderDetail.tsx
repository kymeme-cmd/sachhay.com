// Page: OrderDetail - Chi tiết đơn hàng

import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, Truck, CreditCard } from "lucide-react";
import { orderAPI } from "@/api/client";
import { formatCurrency, formatDate } from "@/utils/formatCurrency";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  SHIPPING_METHOD_LABELS,
  formatAddress,
  shortOrderId,
} from "@/utils/order";
import { Loading } from "@/components/common/Loading";
import { Alert } from "@/components/common/Alert";
import type { Order, OrderStatusValue } from "@/types";

const PROGRESS: OrderStatusValue[] = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justPlaced = (location.state as { justPlaced?: boolean } | null)?.justPlaced;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    orderAPI
      .get(id)
      .then((res) => setOrder(res.data as Order))
      .catch((err) => setError(err.response?.data?.message || "Không thể tải đơn hàng"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading text="Đang tải đơn hàng..." />;

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Alert type="error" title="Lỗi" description={error || "Không tìm thấy đơn hàng"} />
        <Link to="/orders" className="btn-primary mt-4 inline-block">Về danh sách đơn hàng</Link>
      </div>
    );
  }

  const address = typeof order.shipping_address === "string" ? null : order.shipping_address;
  const step = PROGRESS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/orders" className="flex items-center gap-2 text-sm text-primary hover:underline mb-6">
        <ChevronLeft size={16} /> Đơn hàng của tôi
      </Link>

      {justPlaced && (
        <Alert type="success" title="Đặt hàng thành công!" description="Cảm ơn bạn. Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm." />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn #{shortOrderId(order.id)}</h1>
          <p className="text-sm text-gray-500">Đặt ngày {formatDate(order.created_at)}</p>
        </div>
        <span className={`badge text-sm ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
      </div>

      {step >= 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center">
            {PROGRESS.map((s, i) => (
              <div key={s} className="flex-1 flex items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                    {i + 1}
                  </div>
                  <span className={`mt-2 text-xs text-center ${i <= step ? "text-primary font-medium" : "text-gray-500"}`}>{ORDER_STATUS_LABELS[s]}</span>
                </div>
                {i < PROGRESS.length - 1 && <div className={`flex-1 h-1 mx-2 mb-6 rounded ${i < step ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Sản phẩm</h3>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between gap-4">
                <div>
                  <Link to={`/books/${item.product_id}`} className="font-medium text-gray-800 hover:text-primary">{item.name}</Link>
                  <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                </div>
                <span className="font-medium text-gray-800">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4 mt-2 border-t border-gray-200 text-lg font-bold">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={18} /> Giao đến</h3>
            {address && <p className="font-medium text-gray-800">{address.name} · {address.phone}</p>}
            <p className="text-sm text-gray-600">{formatAddress(order.shipping_address)}</p>
            {order.note && <p className="text-sm text-gray-500 mt-2 italic">Ghi chú: {order.note}</p>}
          </div>
          <div className="card p-6 space-y-3 text-sm">
            <p className="flex items-center gap-2 text-gray-700">
              <Truck size={18} /> {SHIPPING_METHOD_LABELS[order.shipping_method ?? ""] ?? order.shipping_method ?? "—"}
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <CreditCard size={18} /> {PAYMENT_METHOD_LABELS[order.payment_method]}
            </p>
            <p className="text-gray-500">{PAYMENT_STATUS_LABELS[order.payment_status]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
