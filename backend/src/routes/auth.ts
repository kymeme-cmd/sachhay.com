// ============================================================
// Auth routes: register, login, refresh, logout, me
// ============================================================

import { Hono } from "hono";
import type { Context } from "hono";
import { createUser, findUserByEmail, findUserById, createSession, invalidateSession, findSessionByTokenHash } from "../db/client";
import { hashPassword, comparePassword } from "../auth/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth/jwt";
import { hashToken, generateId, nowSeconds, REFRESH_TOKEN_TTL_SECONDS } from "../auth/session";
import { RegisterSchema, LoginSchema, RefreshSchema, LogoutSchema, validate } from "../validation/schemas";
import type { DBUser } from "../types";
import { requireAuth, type AppEnv } from "../middleware/auth";

export const authRoutes = new Hono<AppEnv>();

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

function publicUser(user: Pick<DBUser, "id" | "email" | "name" | "phone" | "role" | "created_at">) {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, created_at: user.created_at };
}

/** Tạo cặp access/refresh token và lưu session vào D1 */
async function issueTokens(c: Context<AppEnv>, user: Pick<DBUser, "id" | "email" | "role">) {
  const accessToken = await signAccessToken(
    { userId: user.id, email: user.email, role: user.role },
    c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN
  );
  const refreshToken = await signRefreshToken(
    { userId: user.id, tokenId: generateId("token") },
    c.env.REFRESH_SECRET, c.env.REFRESH_TOKEN_EXPIRES_IN
  );

  await createSession(c.env.DB, {
    id: generateId("session"),
    userId: user.id,
    refreshTokenHash: await hashToken(refreshToken),
    userAgent: c.req.header("User-Agent") ?? null,
    ipAddress: c.req.header("CF-Connecting-IP") ?? null,
    expiresAt: nowSeconds() + REFRESH_TOKEN_TTL_SECONDS,
  });

  return { access_token: accessToken, refresh_token: refreshToken, expires_in: ACCESS_TOKEN_TTL_SECONDS };
}

// ---------- Register ----------
authRoutes.post("/register", validate("json", RegisterSchema), async (c) => {
  const { email, password, name, phone } = c.req.valid("json");

  const existing = await findUserByEmail(c.env.DB, email);
  if (existing) {
    return c.json({ error: { code: "EMAIL_EXISTS", message: "Email đã được sử dụng" } }, 409);
  }

  const user = await createUser(c.env.DB, {
    id: generateId("user"), email, password_hash: await hashPassword(password), name,
    phone: phone ?? null, role: "customer",
  });

  const tokens = await issueTokens(c, user);
  return c.json({ data: { user: publicUser(user), tokens } }, 201);
});

// ---------- Login ----------
authRoutes.post("/login", validate("json", LoginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await findUserByEmail(c.env.DB, email);
  if (!user || !(await comparePassword(password, user.password_hash))) {
    return c.json({ error: { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng" } }, 401);
  }

  const tokens = await issueTokens(c, user);
  return c.json({ data: { user: publicUser(user), tokens } });
});

// ---------- Refresh ----------
authRoutes.post("/refresh", validate("json", RefreshSchema), async (c) => {
  const { refresh_token } = c.req.valid("json");

  const payload = await verifyRefreshToken(refresh_token, c.env.REFRESH_SECRET);
  if (!payload) {
    return c.json({ error: { code: "INVALID_TOKEN", message: "Refresh token không hợp lệ" } }, 401);
  }

  const refreshHash = await hashToken(refresh_token);
  const session = await findSessionByTokenHash(c.env.DB, refreshHash);
  if (!session || session.expires_at < nowSeconds()) {
    await invalidateSession(c.env.DB, refreshHash);
    return c.json({ error: { code: "SESSION_EXPIRED", message: "Phiên làm việc đã hết hạn" } }, 401);
  }

  const user = await findUserById(c.env.DB, session.user_id);
  if (!user) {
    return c.json({ error: { code: "USER_NOT_FOUND", message: "Người dùng không tồn tại" } }, 404);
  }

  const accessToken = await signAccessToken(
    { userId: user.id, email: user.email, role: user.role },
    c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN
  );

  return c.json({
    data: { access_token: accessToken, refresh_token, expires_in: ACCESS_TOKEN_TTL_SECONDS },
  });
});

// ---------- Logout ----------
// Không yêu cầu access token còn hạn: chỉ cần refresh token để hủy đúng session
authRoutes.post("/logout", validate("json", LogoutSchema), async (c) => {
  const { refresh_token } = c.req.valid("json");
  if (refresh_token) {
    await invalidateSession(c.env.DB, await hashToken(refresh_token));
  }
  return c.json({ data: { message: "Đăng xuất thành công" } });
});

// ---------- Me ----------
authRoutes.get("/me", requireAuth, async (c) => {
  const dbUser = await findUserById(c.env.DB, c.get("user").userId);
  if (!dbUser) {
    return c.json({ error: { code: "USER_NOT_FOUND", message: "Người dùng không tồn tại" } }, 404);
  }
  return c.json({ data: { user: publicUser(dbUser) } });
});
