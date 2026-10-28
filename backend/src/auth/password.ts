// ============================================================
// Password hashing with PBKDF2-SHA256 (Web Crypto, chạy được trên Workers)
// Định dạng lưu: pbkdf2$<iterations>$<saltB64>$<hashB64>
// ============================================================

const ITERATIONS = 100_000; // Giới hạn tối đa của Workers
const SALT_BYTES = 16;
const HASH_BITS = 256;

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    HASH_BITS
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function comparePassword(plainPassword: string, stored: string): Promise<boolean> {
  const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterStr || !saltB64 || !hashB64) return false;

  const expected = fromB64(hashB64);
  const actual = await derive(plainPassword, fromB64(saltB64), parseInt(iterStr, 10));
  if (actual.length !== expected.length) return false;

  // So sánh thời gian hằng
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
