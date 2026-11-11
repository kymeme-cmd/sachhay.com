// ============================================================
// Ghi nhận lượt truy cập → Basin catalog (Cloudflare Pipelines stream)
// Schema stream: id, country, device, time (ms), ip, meta (json)
// ============================================================

import { Hono } from "hono";
import type { AppEnv } from "../middleware/auth";

export const trackRoutes = new Hono<AppEnv>();

const BOT_UA = /bot|crawl|spider|slurp|curl|wget|python|httpclient|headless|lighthouse|preview/i;

/**
 * Thiết bị / hệ điều hành: android, iphone, ipad, windows, macos, linux, chromeos, other.
 * iPad đời mới gửi User-Agent giống máy Mac → frontend gửi kèm số điểm chạm (touch) để phân biệt.
 */
export function detectDevice(ua: string, touchPoints = 0): string {
  if (/iphone|ipod/i.test(ua)) return "iphone";
  if (/ipad/i.test(ua)) return "ipad";
  if (/android/i.test(ua)) return "android";
  if (/windows/i.test(ua)) return "windows";
  if (/cros/i.test(ua)) return "chromeos";
  if (/macintosh|mac os x/i.test(ua)) return touchPoints > 1 ? "ipad" : "macos";
  if (/linux|x11/i.test(ua)) return "linux";
  return "other";
}

/** Loại thiết bị: mobile / tablet / desktop (lưu thêm trong meta) */
function deviceType(ua: string, device: string): string {
  if (device === "ipad" || /tablet|playbook|silk/i.test(ua) || (device === "android" && !/mobile/i.test(ua))) return "tablet";
  if (device === "iphone" || device === "android" || /mobi/i.test(ua)) return "mobile";
  return "desktop";
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

trackRoutes.post("/", async (c) => {
  const streamUrl = c.env.STREAM_URL;
  if (!streamUrl) return c.body(null, 204); // máy local / chưa cấu hình → bỏ qua

  // Frontend gửi bằng sendBeacon dạng text/plain (tránh preflight CORS) → tự parse JSON
  let body: Record<string, unknown> = {};
  try {
    const text = await c.req.text();
    if (text.length <= 2000) body = JSON.parse(text);
  } catch {
    /* body hỏng → vẫn ghi nhận lượt truy cập với meta rỗng */
  }

  const ua = c.req.header("User-Agent") ?? "";
  const cf = c.req.raw.cf as { country?: string } | undefined;
  const device = detectDevice(ua, Number(body.touch) || 0);
  const record = {
    id: c.env.TRACK_GROUP ?? "nhóm 13", // tên nhóm: nhận biết dữ liệu của nhóm trên stream dùng chung
    country: cf?.country ?? "XX", // Cloudflare tự xác định quốc gia theo IP
    device, // android / iphone / ipad / windows / macos / linux / chromeos / other
    time: Date.now(), // giờ server (ms), không tin giờ máy khách
    ip: c.req.header("CF-Connecting-IP") ?? "", // IP thật của người truy cập (Cloudflare cung cấp)
    meta: {
      event_id: crypto.randomUUID(), // mã riêng của từng lượt truy cập
      device_type: deviceType(ua, device), // mobile / tablet / desktop
      path: clip(body.path, 200),
      referrer: clip(body.referrer, 300),
      session_id: clip(body.session_id, 64),
      user_agent: ua.slice(0, 300),
      is_bot: BOT_UA.test(ua),
    },
  };

  // Gửi sau khi đã trả response → không làm chậm trang
  const job = fetch(streamUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([record]),
  })
    .then(async (res) => {
      if (!res.ok) console.error(`[track] stream trả về ${res.status}: ${await res.text()}`);
    })
    .catch((e) => console.error("[track] lỗi gửi stream:", e));
  try {
    c.executionCtx.waitUntil(job);
  } catch {
    /* môi trường test không có executionCtx */
  }

  return c.body(null, 204);
});
