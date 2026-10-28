// Component: OrderHistory - Lịch sử mua hàng (tab "Đơn đã mua" trong trang Lịch sử)

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Star } from "lucide-react";
import { orderAPI } from "@/api/client";
import { formatCurrency, formatDate } from "@/utils/formatCurrency";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, shortOrderId } from "@/utils/order";
import { fallbackImageUrl, getProductImageUrl } from "@/utils/image";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/common/Alert";
import type { Order, OrderStatusValue } from "@/types";

const FILTERS: Array<{ value: OrderStatusValue | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: ORDER_STATUS_LABELS.pending },
  { value: "confirmed", label: ORDER_STATUS_LABELS.confirmed },
  { value: "shipped", label: ORDER_STATUS_LABELS.shipped },
  { value: "delivered", label: ORDER_STATUS_LABELS.delivered },
  { value: "cancelled", label: ORDER_STATUS_LABELS.cancelled },
];

const MAX_THUMBS = 4;

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatusValue | "all">("all");

  useEffect(() => {
    orderAPI
      .list()
      .then((res) => setOrders((res.data as Order[]) || []))
      .catch((err) => setError(err.response?.data?.message || "Không thể tải danh sách đơn hàng"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải đơn hàng..." />;
  if (error) return <Alert type="error" title="Lỗi" description={error} />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={32} />}
        title="Bạn chưa có đơn hàng nào"
        description="Hãy chọn cho mình vài cuốn sách hay nhé."
        action={<Link to="/books" className="btn-primary inline-block">Xem sách</Link>}
      />
    );
  }

  const countOf = (v: OrderStatusValue | "all") => (v === "all" ? orders.length : orders.filter((o) => o.status === v).length);
  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const totalSpent = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {orders.length} đơn hàng · Đã chi cho sách đã nhận: <span className="font-semibold text-accent">{formatCurrency(totalSpent)}</span>
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.filter((f) => f.value === "all" || countOf(f.value) > 0).map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
              filter === f.value ? "bg-primary text-white border-primary" : "bg-light text-gray-700 border-gray-300 hover:border-primary"
            }`}
          >
            {f.label} ({countOf(f.value)})
          </button>
        ))}
      </div>

      {shown.map((order) => {
        const items = order.items ?? [];
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        return (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="card p-4 sm:p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex -space-x-4 flex-shrink-0">
              {items.slice(0, MAX_THUMBS).map((item) => (
                <img
                  key={item.id}
                  src={getProductImageUrl(item.image_key)}
                  alt={item.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = fallbackImageUrl(); }}
                  className="w-12 h-[72px] rounded-md object-cover border-2 border-light shadow-sm bg-gray-200"
                />
              ))}
              {items.length > MAX_THUMBS && (
                <div className="w-12 h-[72px] rounded-md border-2 border-light bg-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center">
                  +{items.length - MAX_THUMBS}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-gray-800">Đơn #{shortOrderId(order.id)}</span>
                <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
              </div>
              <p className="text-sm text-gray-700 truncate">{items.map((i) => i.name).join(", ")}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(order.created_at)} · {itemCount} cuốn
                {order.status === "delivered" && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-600"><Star size={12} className="fill-amber-400" /> Đánh giá được</span>
                )}
              </p>
            </div>
            <div className="text-right font-bold text-primary whitespace-nowrap">{formatCurrency(order.total_amount)}</div>
            <ChevronRight size={20} className="text-gray-400 hidden sm:block" />
          </Link>
        );
      })}

      {shown.length === 0 && <p className="text-center text-gray-500 py-8">Không có đơn hàng nào ở trạng thái này.</p>}
    </div>
  );
}
