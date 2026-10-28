// ============================================================
// Tải ảnh bìa mẫu (seed/covers/*.png) lên R2 và gắn vào sách mẫu
//   npm run seed:covers          -> môi trường local
//   npm run seed:covers:remote   -> Cloudflare thật
// Tên file = id sách (ví dụ book_mat_biec.png). Chạy lại nhiều lần an toàn.
// ============================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUCKET = "ecommerce-assets";
const DATABASE = "ecommerce";
const target = process.argv.includes("--remote") ? "--remote" : "--local";

const seedDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(seedDir, "..");
const coversDir = path.join(seedDir, "covers");

const wrangler = (args) =>
  execFileSync("npx", ["wrangler", ...args], { cwd: backendDir, stdio: "pipe", shell: true }).toString();

const files = fs.readdirSync(coversDir).filter((f) => f.endsWith(".png"));
const statements = [];

for (const file of files) {
  const productId = path.basename(file, ".png");
  const key = `products/covers/${file}`;

  process.stdout.write(`Tải lên ${key} ... `);
  wrangler(["r2", "object", "put", `${BUCKET}/${key}`, "--file", path.join(coversDir, file), "--content-type", "image/png", target]);
  console.log("xong");

  // Bỏ ảnh chính cũ của sách rồi gắn ảnh bìa mới làm ảnh chính
  statements.push(
    `UPDATE product_images SET is_primary = 0 WHERE product_id = '${productId}';`,
    `INSERT OR REPLACE INTO product_images (id, product_id, r2_key, alt_text, is_primary, sort_order)
     SELECT 'img_cover_${productId}', id, '${key}', name, 1, 0 FROM products WHERE id = '${productId}';`
  );
}

const sqlFile = path.join(seedDir, ".covers.sql");
fs.writeFileSync(sqlFile, statements.join("\n"));
try {
  wrangler(["d1", "execute", DATABASE, target, `--file=${sqlFile}`]);
} finally {
  fs.unlinkSync(sqlFile);
}

console.log(`\nĐã gắn ${files.length} ảnh bìa vào sách (${target.slice(2)}).`);
