// ============================================================
// R2 image routes: upload/delete (admin) + public image serving
// ============================================================

import { Hono } from "hono";
import { requireAdmin, type AppEnv } from "../middleware/auth";

export const uploadRoutes = new Hono<AppEnv>();
export const imageRoutes = new Hono<AppEnv>();

const VALID_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE = 5 * 1024 * 1024;

// ---------- Upload image to R2 ----------
uploadRoutes.post("/image", requireAdmin, async (c) => {
  if (!c.env.R2) {
    return c.json({ error: { code: "R2_DISABLED", message: "Chưa cấu hình kho ảnh (R2) trên server" } }, 503);
  }
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return c.json({ error: { code: "VALIDATION", message: "Vui lòng chọn file hình ảnh" } }, 400);
  }

  const ext = VALID_TYPES[file.type];
  if (!ext) {
    return c.json(
      { error: { code: "VALIDATION", message: "Chỉ chấp nhận file ảnh (jpg, png, webp, gif)" } },
      400
    );
  }

  if (file.size > MAX_SIZE) {
    return c.json({ error: { code: "VALIDATION", message: "File quá lớn (tối đa 5MB)" } }, 400);
  }

  // Phần mở rộng lấy theo MIME type, không tin tên file từ client
  const r2Key = `products/${crypto.randomUUID()}.${ext}`;
  await c.env.R2.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({
    data: {
      r2_key: r2Key,
      url: `/api/images/${r2Key}`,
      filename: file.name,
      size: file.size,
      content_type: file.type,
    },
  }, 201);
});

// ---------- Delete image from R2 ----------
uploadRoutes.delete("/image/*", requireAdmin, async (c) => {
  const key = c.req.path.replace(/^.*?\/upload\/image\//, "");
  if (!key) {
    return c.json({ error: { code: "VALIDATION", message: "Thiếu key hình ảnh" } }, 400);
  }

  await c.env.R2?.delete(decodeURIComponent(key));
  return c.json({ data: { message: "Đã xóa hình ảnh" } });
});

// ---------- Serve image from R2 (public) ----------
imageRoutes.get("/*", async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^.*?\/images\//, ""));
  // Chưa có R2 (ví dụ production chưa bật) → 404, frontend tự hiện ảnh mặc định
  if (!key.startsWith("products/") || !c.env.R2) {
    return c.json({ error: { code: "NOT_FOUND", message: "Không tìm thấy hình ảnh" } }, 404);
  }

  const object = await c.env.R2.get(key);
  if (!object) {
    return c.json({ error: { code: "NOT_FOUND", message: "Không tìm thấy hình ảnh" } }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  // Key chứa UUID nên nội dung không đổi => cache lâu dài
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
});
