// Đặt lại mật khẩu, hoặc tạo tài khoản admin mới (mật khẩu cũ không xem lại được vì chỉ lưu mã băm).
// Cách dùng (trong thư mục backend):
//   node seed/reset-password.mjs <email> <mật-khẩu-mới>                     → đổi mật khẩu (máy local)
//   node seed/reset-password.mjs <email> <mật-khẩu-mới> --remote            → đổi mật khẩu (production)
//   node seed/reset-password.mjs <email> <mật-khẩu-mới> --admin --remote    → tạo/nâng thành admin (production)
// Mã băm cùng định dạng với src/auth/password.ts: pbkdf2$<iterations>$<saltB64>$<hashB64>

import { webcrypto as crypto } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [rawEmail, password] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const remote = process.argv.includes("--remote");
const makeAdmin = process.argv.includes("--admin");
if (!rawEmail || !password) {
  console.error("Cách dùng: node seed/reset-password.mjs <email> <mật-khẩu-mới> [--admin] [--remote]");
  process.exit(1);
}
const email = rawEmail.trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Email không hợp lệ.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Mật khẩu nên có ít nhất 8 ký tự.");
  process.exit(1);
}

const ITERATIONS = 100_000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256);
const b64 = (u8) => Buffer.from(u8).toString("base64");
const hash = `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;

const esc = (s) => s.replace(/'/g, "''");
const E = esc(email);
const H = esc(hash);
const sql = makeAdmin
  ? // Chưa có → tạo mới với quyền admin; đã có → đổi mật khẩu và nâng lên admin (giữ nguyên super_admin)
    `INSERT INTO users (id, email, password_hash, name, role) VALUES ('user_${crypto.randomUUID()}', '${E}', '${H}', 'Quản trị viên', 'admin') ` +
    `ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, ` +
    `role = CASE WHEN role = 'super_admin' THEN role ELSE 'admin' END, updated_at = unixepoch(); ` +
    `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = '${E}');`
  : `UPDATE users SET password_hash = '${H}', updated_at = unixepoch() WHERE email = '${E}'; ` +
    `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = '${E}');`;

// Ghi SQL ra file tạm (truyền qua --command trên Windows dễ bị shell tách sai dấu cách / dấu nháy)
const dir = mkdtempSync(join(tmpdir(), "reset-pw-"));
const file = join(dir, "reset.sql");
writeFileSync(file, sql, "utf8");

const args = ["wrangler", "d1", "execute", remote ? "d1" : "ecommerce", `--file=${file}`, "--yes"];
if (remote) args.push("--env", "production", "--remote");
else args.push("--local");

console.log(`${makeAdmin ? "Tạo/cập nhật admin" : "Đặt lại mật khẩu"} cho ${email} (${remote ? "production" : "local"})...`);
try {
  execFileSync("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
} finally {
  rmSync(dir, { recursive: true, force: true }); // file chứa mã băm mật khẩu → xóa ngay
}
console.log(makeAdmin ? "Xong. Đăng nhập bằng email và mật khẩu vừa đặt." : "Xong. Nếu báo \"changes: 0\" thì email không tồn tại.");
