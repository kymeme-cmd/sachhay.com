// ============================================================
// Authentication & authorization middleware
// ============================================================

import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyAccessToken } from "../auth/jwt";
import type { Env } from "../types";

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export type AppEnv = { Bindings: Env; Variables: { user: AuthUser } };

/** Xác thực Bearer token; trả về user hoặc null */
export async function authenticate(c: Context<AppEnv>): Promise<AuthUser | null> {
  const existing = c.get("user");
  if (existing) return existing;

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const payload = await verifyAccessToken(authHeader.substring(7), c.env.JWT_SECRET);
  if (!payload) return null;

  const user = payload as unknown as AuthUser;
  c.set("user", user);
  return user;
}

const unauthorized = (c: Context<AppEnv>) =>
  c.json({ error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập để tiếp tục" } }, 401);

/**
 * Require valid access token. Sets c.set("user", payload).
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!(await authenticate(c))) return unauthorized(c);
  return next();
});

/**
 * Require admin or super_admin role (tự xác thực token nếu chưa có).
 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const user = await authenticate(c);
  if (!user) return unauthorized(c);
  if (user.role !== "admin" && user.role !== "super_admin") {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Yêu cầu quyền quản trị hệ thống" } },
      403
    );
  }
  return next();
});

/**
 * Require super_admin only.
 */
export const requireSuperAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const user = await authenticate(c);
  if (!user) return unauthorized(c);
  if (user.role !== "super_admin") {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Yêu cầu quyền super_admin" } },
      403
    );
  }
  return next();
});
