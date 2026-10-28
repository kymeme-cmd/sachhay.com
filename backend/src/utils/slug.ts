// ============================================================
// Slug helpers (hỗ trợ tiếng Việt có dấu)
// ============================================================

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Chuỗi tìm kiếm không dấu, chữ thường: "Đắc Nhân Tâm" → "dac nhan tam" */
export function normalizeSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Nội dung cột products.search_text */
export function buildSearchText(p: { name: string; author?: string | null; description?: string | null }): string {
  return normalizeSearch([p.name, p.author ?? "", p.description ?? ""].join(" "));
}

/** Slug duy nhất trong bảng: thêm hậu tố ngẫu nhiên nếu đã tồn tại */
export async function uniqueSlug(
  db: D1Database,
  table: "products" | "categories",
  name: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(name) || "item";
  const taken = await db
    .prepare(`SELECT 1 FROM ${table} WHERE slug = ? AND id != ?`)
    .bind(base, excludeId ?? "")
    .first();
  return taken ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base;
}
