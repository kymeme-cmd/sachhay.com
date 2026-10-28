// Page: History - Lịch sử: sách đã xem (mọi người) + đơn đã mua (cần đăng nhập)

import { Link, useSearchParams } from "react-router-dom";
import { Eye, Package, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ViewedBookCard } from "@/components/book/RecentlyViewed";
import { EmptyState } from "@/components/common/EmptyState";
import { OrderHistory } from "@/components/order/OrderHistory";

type Tab = "viewed" | "orders";

export default function History() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "orders" ? "orders" : "viewed";
  const { isAuthenticated } = useAuthStore();

  const tabs: Array<{ id: Tab; label: string; icon: JSX.Element }> = [
    { id: "viewed", label: "Sách đã xem", icon: <Eye size={18} /> },
    { id: "orders", label: "Đơn đã mua", icon: <Package size={18} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Lịch sử</h1>

      <div className="flex gap-1 border-b border-gray-200 mb-6" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === "viewed" ? {} : { tab: t.id }, { replace: true })}
            className={`inline-flex items-center gap-2 px-4 py-2.5 -mb-px border-b-2 text-sm font-medium transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "viewed" ? (
        <ViewedTab />
      ) : isAuthenticated ? (
        <OrderHistory />
      ) : (
        <EmptyState
          icon={<Package size={32} />}
          title="Đăng nhập để xem đơn đã mua"
          description="Lịch sử mua hàng được lưu theo tài khoản của bạn."
          action={<Link to="/login" state={{ from: "/history?tab=orders" }} className="btn-primary inline-block">Đăng nhập</Link>}
        />
      )}
    </div>
  );
}

function ViewedTab() {
  const { items, remove, clear } = useRecentlyViewed();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Eye size={32} />}
        title="Bạn chưa xem cuốn sách nào"
        description="Những cuốn sách bạn mở sẽ được lưu lại ở đây để tiện xem lại."
        action={<Link to="/books" className="btn-primary inline-block">Khám phá sách</Link>}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">{items.length} cuốn sách · lưu trên trình duyệt này</p>
        <button
          type="button"
          onClick={() => { if (window.confirm("Xóa toàn bộ lịch sử xem?")) clear(); }}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Xóa lịch sử
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((b) => (
          <div key={b.id} className="relative group/item">
            <ViewedBookCard book={b} className="block" />
            <button
              type="button"
              onClick={() => remove(b.id)}
              aria-label={`Xóa "${b.name}" khỏi lịch sử`}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-gray-900/70 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
