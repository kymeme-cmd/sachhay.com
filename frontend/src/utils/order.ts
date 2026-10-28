// ============================================================
// Utils: nhãn hiển thị cho đơn hàng
// ============================================================

import type { Order, OrderStatusValue } from "@/types";

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

export const ORDER_STATUS_COLORS: Record<OrderStatusValue, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export const PAYMENT_METHOD_LABELS: Record<Order["payment_method"], string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  credit_card: "Thẻ tín dụng",
};

export const PAYMENT_STATUS_LABELS: Record<Order["payment_status"], string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán lỗi",
  refunded: "Đã hoàn tiền",
};

export const SHIPPING_METHOD_LABELS: Record<string, string> = {
  standard: "Tiêu chuẩn (2-3 ngày)",
  express: "Nhanh (1-2 ngày)",
  priority: "Hỏa tốc (trong ngày)",
};

/** Mã đơn ngắn gọn để hiển thị */
export function shortOrderId(id: string): string {
  return id.replace(/^order_/, "").slice(0, 8).toUpperCase();
}

export function formatAddress(address: Order["shipping_address"]): string {
  if (typeof address === "string") return address;
  return [address.address, address.ward, address.district, address.city].filter(Boolean).join(", ");
}
