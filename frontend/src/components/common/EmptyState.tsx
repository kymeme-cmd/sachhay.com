// Component: EmptyState - Trang thai trong

import React from "react";
import { ShoppingCart, Search } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {description && <p className="mt-1 text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function EmptyBooks() {
  return (
    <EmptyState
      icon={<Search size={32} />}
      title="Không có sách nào"
      description="Hiện tại chưa có sách trong danh mục này."
    />
  );
}

export function EmptyCart() {
  return (
    <EmptyState
      icon={<ShoppingCart size={32} />}
      title="Giỏ hàng đang trống"
      description="Hãy chọn sách đầu tiên để thêm vào giỏ hàng."
    />
  );
}