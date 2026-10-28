// ============================================================
// Global error handler (dùng với app.onError)
// ============================================================

import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: "HTTP_ERROR", message: err.message || "Yêu cầu không hợp lệ" } },
      err.status
    );
  }

  // Lỗi nghiệp vụ được ném ra có chủ đích (ví dụ: hết hàng khi tạo đơn)
  if (err instanceof BusinessError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status);
  }

  console.error("[UNEXPECTED_ERROR]", err);
  return c.json(
    { error: { code: "INTERNAL_SERVER_ERROR", message: "Có lỗi xảy ra trên server" } },
    500
  );
};

export class BusinessError extends Error {
  constructor(public code: string, message: string, public status: 400 | 404 | 409 = 400) {
    super(message);
  }
}
