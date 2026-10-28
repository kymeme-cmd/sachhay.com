// Page: Orders - Đơn hàng của tôi

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { orderAPI } from "@/api/client";
import { formatCurrency, formatDate } from "@/utils/formatCurrency";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, shortOrderId } from "@/utils/order";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { Alert } from "@/components/common/Alert";
import type { Order } from "@/types";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orderAPI
      .list()
      .then((res) => setOrders((res.data as Order[]) || []))
      .catch((err) => setError(err.response?.data?.message || "Không thể tải danh sách đơn hàng"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải đơn hàng..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đơn hàng của tôi</h1>

      {error && <Alert type="error" title="Lỗi" description={error} />}

      {!error && orders.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title="Bạn chưa có đơn hàng nào"
          description="Hãy chọn cho mình vài cuốn sách hay nhé."
          action={<Link to="/books" className="btn-primary inline-block">Xem sách</Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Package size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">Đơn #{shortOrderId(order.id)}</span>
                    <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {formatDate(order.created_at)} · {itemCount} cuốn
                    {order.items && order.items.length > 0 && ` · ${order.items.map((i) => i.name).join(", ")}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{formatCurrency(order.total_amount)}</div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
