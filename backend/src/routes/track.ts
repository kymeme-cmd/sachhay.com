// ============================================================
// Ghi nhận lượt truy cập → Basin catalog (Cloudflare Pipelines stream)
// Schema stream: id, country, device, time (ms), ip, meta (json)
// ============================================================

import { Hono } from "hono";
import type { AppEnv } from "../middleware/auth";

export const trackRoutes = new Hono<AppEnv>();

const BOT_UA = /bot|crawl|spider|slurp|curl|wget|python|httpclient|headless|lighthouse|preview/i;

function detectDevice(ua: string): string {
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
}

/** Không lưu IP gốc (dữ liệu cá nhân): băm SHA-256 kèm salt bí mật */
async function hashIp(ip: string, salt: string): Promise<string> {
  if (!ip) return "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
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
  const record = {
    id: crypto.randomUUID(),
    country: cf?.country ?? "XX", // Cloudflare tự xác định quốc gia theo IP
    device: detectDevice(ua),
    time: Date.now(), // giờ server (ms), không tin giờ máy khách
    ip: await hashIp(c.req.header("CF-Connecting-IP") ?? "", c.env.IP_SALT ?? c.env.JWT_SECRET),
    meta: {
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
