// ============================================================
// Chat routes: POST /api/chat — chatbot RAG (công khai, đăng nhập tùy chọn)
// ============================================================

import { Hono } from "hono";
import { authenticate, type AppEnv } from "../middleware/auth";
import { ChatSchema, validate } from "../validation/schemas";
import { answerQuestion, loadBookCards } from "../ai/rag";

export const chatRoutes = new Hono<AppEnv>();

const USER_LIMIT = 20; // tin nhắn / người / khung
const USER_WINDOW = 10 * 60; // 10 phút
const GLOBAL_DAILY_LIMIT = 2000; // giữ hạn mức Workers AI miễn phí

/** Tăng bộ đếm và trả về số lần đã dùng trong khung hiện tại */
async function bump(db: D1Database, key: string, windowSec: number): Promise<number> {
  const windowStart = Math.floor(Date.now() / 1000 / windowSec) * windowSec;
  const row = await db.prepare(
    `INSERT INTO chat_usage (key, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1
     RETURNING count`
  ).bind(key, windowStart).first<{ count: number }>();
  return row?.count ?? 1;
}

chatRoutes.post("/", validate("json", ChatSchema), async (c) => {
  if (!c.env.AI || !c.env.VECTORIZE) {
    return c.json({ error: { code: "AI_DISABLED", message: "Trợ lý AI chưa được bật trên máy chủ này" } }, 503);
  }

  const { message, history } = c.req.valid("json");
  const user = await authenticate(c).catch(() => null); // token sai/hết hạn → coi như khách

  const who = user ? `user:${user.userId}` : `ip:${c.req.header("CF-Connecting-IP") ?? "unknown"}`;
  const [mine, global] = await Promise.all([
    bump(c.env.DB, who, USER_WINDOW),
    bump(c.env.DB, "global", 24 * 60 * 60),
  ]);
  if (mine > USER_LIMIT) {
    return c.json({ error: { code: "RATE_LIMITED", message: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau ít phút." } }, 429);
  }
  if (global > GLOBAL_DAILY_LIMIT) {
    return c.json({ error: { code: "RATE_LIMITED", message: "Trợ lý AI đã hết lượt trong hôm nay. Vui lòng quay lại vào ngày mai." } }, 429);
  }

  try {
    const result = await answerQuestion(c.env, message.trim(), history ?? [], user);
    return c.json({ data: { answer: result.answer, grounded: result.grounded, books: await loadBookCards(c.env, result.books) } });
  } catch (e) {
    console.error("[chat] lỗi:", e);
    return c.json({ error: { code: "AI_ERROR", message: "Trợ lý AI tạm thời không trả lời được. Vui lòng thử lại." } }, 502);
  }
});
