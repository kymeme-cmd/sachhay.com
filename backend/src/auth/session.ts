// ============================================================
// Session / refresh token helpers (D1 + KV cache)
// ============================================================

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** Thời điểm hiện tại theo giây (khớp với unixepoch() trong D1) */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const SESSION_CACHE_TTL = 60 * 30; // 30 minutes

export async function getCachedSession(
  KV: KVNamespace,
  userId: string
): Promise<{ userId: string; tokenId: string } | null> {
  const raw = await KV.get(`session:${userId}`, "json");
  if (!raw) return null;
  return raw as { userId: string; tokenId: string };
}

export async function setCachedSession(
  KV: KVNamespace,
  userId: string,
  data: { userId: string; tokenId: string },
  ttl: number = SESSION_CACHE_TTL
): Promise<void> {
  await KV.put(`session:${userId}`, JSON.stringify(data), { expirationTtl: ttl });
}

export async function deleteCachedSession(KV: KVNamespace, userId: string): Promise<void> {
  await KV.delete(`session:${userId}`);
}
