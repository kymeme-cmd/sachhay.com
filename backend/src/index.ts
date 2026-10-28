// ============================================================
// E-commerce Backend - Cloudflare Workers (Hono)
// ============================================================

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/error";
import { authRoutes } from "./routes/auth";
import { categoryRoutes } from "./routes/categories";
import { productRoutes } from "./routes/products";
import { reviewRoutes } from "./routes/reviews";
import { cartRoutes } from "./routes/cart";
import { orderRoutes } from "./routes/orders";
import { adminRoutes } from "./routes/admin";
import { uploadRoutes, imageRoutes } from "./routes/upload";
import { deleteExpiredSessions } from "./db/client";
import type { AppEnv } from "./middleware/auth";
import type { Env } from "./types";

const app = new Hono<AppEnv>();

// ---------- Global middleware ----------
app.onError(errorHandler);
app.use("*", logger());
app.use("/api/*", (c, next) => {
  // Cho phép thêm origin production qua biến môi trường CORS_ORIGINS (phân tách bằng dấu phẩy)
  const extra = (c.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return cors({
    origin: ["http://localhost:5173", "http://localhost:3000", ...extra],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })(c, next);
});

// ---------- Health check ----------
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "ecommerce-backend", env: c.env.ENVIRONMENT });
});

// ---------- API routes ----------
const api = app.basePath("/api");

api.route("/auth", authRoutes);             // public
api.route("/categories", categoryRoutes);   // public read, admin write
api.route("/products", productRoutes);      // public read, admin write
api.route("/products", reviewRoutes);       // /products/:id/reviews: public read, buyer write
api.route("/cart", cartRoutes);             // auth required
api.route("/orders", orderRoutes);          // auth required
api.route("/admin", adminRoutes);           // admin role required
api.route("/upload", uploadRoutes);         // R2 upload, admin required
api.route("/images", imageRoutes);          // R2 public read

// ---------- 404 ----------
app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: "API endpoint không tồn tại" } }, 404);
});

export default {
  fetch: app.fetch,

  // Cron (wrangler.toml: 2h sáng UTC mỗi ngày) - dọn session hết hạn
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      deleteExpiredSessions(env.DB).then((n) => console.log(`[cron] Đã xóa ${n} session hết hạn`))
    );
  },
} satisfies ExportedHandler<Env>;
