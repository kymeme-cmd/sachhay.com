// ============================================================
// Utils: trang cần quay lại sau khi đăng nhập
// ============================================================

import type { Location } from "react-router-dom";

/** Lấy đường dẫn từ location.state.from hoặc ?from=, chỉ chấp nhận đường dẫn nội bộ */
export function getRedirectTarget(location: Location): string {
  const fromState = (location.state as { from?: string } | null)?.from;
  const fromQuery = new URLSearchParams(location.search).get("from");
  const target = fromState || fromQuery || "/";
  // Chặn open redirect: phải bắt đầu bằng "/" nhưng không phải "//"
  return target.startsWith("/") && !target.startsWith("//") ? target : "/";
}
