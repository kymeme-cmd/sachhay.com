// ============================================================
// D1 Database Client Wrapper for E-commerce
// ============================================================
// Provides typed query helpers with transaction support.
// All methods return plain objects / arrays, NO Hono responses here.
// ============================================================

import type {
  DBUser,
  DBCategory,
  DBProduct,
  DBProductImage,
  DBOrder,
  DBInventoryTransaction,
  DBSession,
  Role,
  InventoryType,
} from "../types";
import { BusinessError } from "../middleware/error";
import { buildSearchText, normalizeSearch } from "../utils/slug";

const DB_TABLES = {
  USERS: "users",
  CATEGORIES: "categories",
  PRODUCTS: "products",
  PRODUCT_IMAGES: "product_images",
  CARTS: "carts",
  CART_ITEMS: "cart_items",
  ORDERS: "orders",
  ORDER_ITEMS: "order_items",
  INVENTORY_TRANSACTIONS: "inventory_transactions",
  SESSIONS: "sessions",
  SETTINGS: "settings",
} as const;

// ---------- USER ----------

export async function findUserById(db: D1Database, id: string): Promise<DBUser | null> {
  const { results } = await db.prepare(
    `SELECT id, email, password_hash, name, phone, role, created_at, updated_at FROM ${DB_TABLES.USERS} WHERE id = ?`
  ).bind(id).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBUser;
}

export async function findUserByEmail(db: D1Database, email: string): Promise<DBUser | null> {
  const { results } = await db.prepare(
    `SELECT id, email, password_hash, name, phone, role, created_at, updated_at FROM ${DB_TABLES.USERS} WHERE email = ?`
  ).bind(email).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBUser;
}

export async function createUser(db: D1Database, data: {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone?: string | null;
  role?: Role;
}): Promise<DBUser> {
  const { results } = await db.prepare(
    `INSERT INTO ${DB_TABLES.USERS} (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id, email, name, phone, role, created_at, updated_at`
  )
    .bind(data.id, data.email, data.password_hash, data.name, data.phone ?? null, data.role ?? "customer")
    .all();
  return results[0] as unknown as DBUser;
}

// ---------- CATEGORY ----------

export async function createCategory(db: D1Database, data: {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  sort_order?: number;
}): Promise<DBCategory> {
  const { results } = await db.prepare(
    `INSERT INTO ${DB_TABLES.CATEGORIES} (id, name, slug, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)
     RETURNING id, name, slug, parent_id, sort_order, created_at, updated_at`
  )
    .bind(data.id, data.name, data.slug, data.parent_id ?? null, data.sort_order ?? 0)
    .all();
  return results[0] as unknown as DBCategory;
}

export async function updateCategory(db: D1Database, id: string, data: {
  name?: string;
  slug?: string;
  parent_id?: string | null;
}): Promise<DBCategory | null> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); params.push(data.name); }
  if (data.slug !== undefined) { fields.push("slug = ?"); params.push(data.slug); }
  if (data.parent_id !== undefined) { fields.push("parent_id = ?"); params.push(data.parent_id); }

  if (fields.length === 0) {
    return findCategoryById(db, id);
  }

  fields.push("updated_at = unixepoch()");
  params.push(id);

  await db.prepare(
    `UPDATE ${DB_TABLES.CATEGORIES} SET ${fields.join(", ")} WHERE id = ?`
  ).bind(...params).run();

  return findCategoryById(db, id);
}

export async function deleteCategory(db: D1Database, id: string): Promise<boolean> {
  const { meta } = await db.prepare(
    `DELETE FROM ${DB_TABLES.CATEGORIES} WHERE id = ?`
  ).bind(id).run();
  return meta.changes > 0;
}

export async function findCategoryById(db: D1Database, id: string): Promise<DBCategory | null> {
  const { results } = await db.prepare(
    `SELECT id, name, slug, parent_id, sort_order, created_at, updated_at FROM ${DB_TABLES.CATEGORIES} WHERE id = ?`
  ).bind(id).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBCategory;
}

export async function findCategoryBySlug(db: D1Database, slug: string): Promise<DBCategory | null> {
  const { results } = await db.prepare(
    `SELECT id, name, slug, parent_id, sort_order, created_at, updated_at FROM ${DB_TABLES.CATEGORIES} WHERE slug = ?`
  ).bind(slug).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBCategory;
}

export async function listCategories(db: D1Database): Promise<DBCategory[]> {
  const { results } = await db.prepare(
    `SELECT id, name, slug, parent_id, sort_order, created_at, updated_at FROM ${DB_TABLES.CATEGORIES} ORDER BY sort_order ASC, created_at ASC`
  ).all();
  return results as unknown as DBCategory[];
}

// ---------- PRODUCT ----------

/** Cột sản phẩm + điểm đánh giá trung bình và số lượt đánh giá (bảng reviews) */
const PRODUCT_COLUMNS = `id, category_id, name, slug, author, description, price, stock, sku, is_active, created_at, updated_at,
  (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE reviews.product_id = products.id) AS avg_rating,
  (SELECT COUNT(*) FROM reviews WHERE reviews.product_id = products.id) AS review_count`;

export async function findProductById(db: D1Database, id: string): Promise<DBProduct | null> {
  const { results } = await db.prepare(
    `SELECT ${PRODUCT_COLUMNS} FROM ${DB_TABLES.PRODUCTS} WHERE id = ?`
  ).bind(id).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBProduct;
}

/** Nhiều sách theo id (giữ đúng thứ tự ids; bỏ qua id không tồn tại) */
export async function findProductsByIds(db: D1Database, ids: string[]): Promise<DBProduct[]> {
  if (ids.length === 0) return [];
  const { results } = await db.prepare(
    `SELECT ${PRODUCT_COLUMNS} FROM ${DB_TABLES.PRODUCTS} WHERE id IN (${ids.map(() => "?").join(", ")})`
  ).bind(...ids).all();
  const byId = new Map((results as unknown as DBProduct[]).map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is DBProduct => !!p);
}

export async function findProductBySlug(db: D1Database, slug: string): Promise<DBProduct | null> {
  const { results } = await db.prepare(
    `SELECT ${PRODUCT_COLUMNS} FROM ${DB_TABLES.PRODUCTS} WHERE slug = ?`
  ).bind(slug).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBProduct;
}

export async function listProducts(db: D1Database, filters: {
  page?: number;
  per_page?: number;
  category_id?: string;
  is_active?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  sortBy?: "created_at" | "price" | "name" | "relevance";
  sortDir?: "ASC" | "DESC";
}): Promise<{ products: Array<DBProduct & { images: DBProductImage[] }>; meta: { page: number; per_page: number; total: number; total_pages: number } }> {
  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? 20;
  const offset = (page - 1) * perPage;

  let where = "";
  let searchPhrase = "";
  let params: any[] = [];

  if (filters.category_id) {
    where += ` AND category_id = ?`;
    params.push(filters.category_id);
  }
  if (filters.is_active !== undefined) {
    where += ` AND is_active = ?`;
    params.push(filters.is_active);
  }
  if (filters.search) {
    // Tìm không dấu: "dac nhan" khớp "Đắc Nhân Tâm".
    // Mỗi từ khóa phải khớp ĐẦU một từ (gõ dở "harr" vẫn ra "Harry", nhưng "anh" không khớp "thành")
    await ensureSearchText(db);
    const terms = normalizeSearch(filters.search).split(" ").filter(Boolean).slice(0, 8);
    searchPhrase = terms.join(" ");
    for (const term of terms) {
      where += ` AND (' ' || search_text) LIKE ? ESCAPE '\\'`;
      params.push(`% ${term.replace(/[\\%_]/g, (ch) => "\\" + ch)}%`);
    }
  }
  if (filters.min_price !== undefined) {
    where += ` AND price >= ?`;
    params.push(filters.min_price);
  }
  if (filters.max_price !== undefined) {
    where += ` AND price <= ?`;
    params.push(filters.max_price);
  }

  // Count total
  const countParams = [...params];
  const { results: countResults } = await db.prepare(
    `SELECT COUNT(*) as total FROM ${DB_TABLES.PRODUCTS} WHERE 1=1 ${where}`
  ).bind(...countParams).all();

  const total = Number(countResults[0]?.total ?? 0);

  // Fetch page (whitelist cột sắp xếp để tránh SQL injection)
  const sortDir = filters.sortDir === "ASC" ? "ASC" : "DESC";
  let orderClause: string;
  const orderParams: unknown[] = [];
  if (filters.sortBy === "relevance" && searchPhrase) {
    // Liên quan: cụm từ khớp càng sớm càng tốt (search_text bắt đầu bằng tên sách, rồi tác giả, rồi mô tả)
    orderClause = `CASE WHEN instr(' ' || search_text, ?) = 0 THEN 1 ELSE 0 END, instr(' ' || search_text, ?), created_at DESC`;
    orderParams.push(" " + searchPhrase, " " + searchPhrase);
  } else {
    const orderBy = ["created_at", "price", "name"].includes(filters.sortBy ?? "") ? filters.sortBy : "created_at";
    orderClause = `${orderBy} ${sortDir}, rowid ${sortDir}`;
  }

  const { results } = await db.prepare(
    `SELECT ${PRODUCT_COLUMNS} FROM ${DB_TABLES.PRODUCTS} WHERE 1=1 ${where} ORDER BY ${orderClause} LIMIT ? OFFSET ?`
  ).bind(...params, ...orderParams, perPage, offset).all();

  const products = await attachImages(db, results as unknown as DBProduct[]);

  return {
    products,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

/**
 * Điền cột search_text cho các sách chưa có (dữ liệu seed/migration cũ).
 * SQLite không bỏ dấu được nên phải tính ở Worker; sau lần đầu truy vấn này gần như không tốn gì.
 */
async function ensureSearchText(db: D1Database): Promise<void> {
  const { results } = await db.prepare(
    `SELECT id, name, author, description FROM ${DB_TABLES.PRODUCTS} WHERE search_text IS NULL LIMIT 500`
  ).all<{ id: string; name: string; author: string | null; description: string | null }>();
  if (results.length === 0) return;
  await db.batch(
    results.map((p) =>
      db.prepare(`UPDATE ${DB_TABLES.PRODUCTS} SET search_text = ? WHERE id = ?`).bind(buildSearchText(p), p.id)
    )
  );
}

/** Gắn danh sách ảnh (ảnh chính trước) vào từng sản phẩm bằng 1 truy vấn */
export async function attachImages<P extends { id: string }>(
  db: D1Database,
  products: P[]
): Promise<Array<P & { images: DBProductImage[] }>> {
  if (products.length === 0) return [];
  const placeholders = products.map(() => "?").join(", ");
  const { results } = await db.prepare(
    `SELECT id, product_id, r2_key, alt_text, is_primary, sort_order, created_at FROM ${DB_TABLES.PRODUCT_IMAGES}
     WHERE product_id IN (${placeholders}) ORDER BY is_primary DESC, sort_order ASC`
  ).bind(...products.map((p) => p.id)).all();

  const byProduct = new Map<string, DBProductImage[]>();
  for (const img of results as unknown as DBProductImage[]) {
    const list = byProduct.get(img.product_id) ?? [];
    list.push(img);
    byProduct.set(img.product_id, list);
  }
  return products.map((p) => ({ ...p, images: byProduct.get(p.id) ?? [] }));
}

// ---------- PRODUCT IMAGE ----------

export async function createProductImage(db: D1Database, data: {
  id: string;
  product_id: string;
  r2_key: string;
  alt_text?: string;
  is_primary?: number;
  sort_order?: number;
}): Promise<DBProductImage> {
  const { results } = await db.prepare(
    `INSERT INTO ${DB_TABLES.PRODUCT_IMAGES} (id, product_id, r2_key, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id, product_id, r2_key, alt_text, is_primary, sort_order, created_at`
  )
    .bind(data.id, data.product_id, data.r2_key, data.alt_text ?? null, data.is_primary ?? 0, data.sort_order ?? 0)
    .all();
  return results[0] as unknown as DBProductImage;
}

export async function findPrimaryImageByProduct(db: D1Database, productId: string): Promise<DBProductImage | null> {
  const { results } = await db.prepare(
    `SELECT id, product_id, r2_key, alt_text, is_primary, sort_order, created_at FROM ${DB_TABLES.PRODUCT_IMAGES} WHERE product_id = ? AND is_primary = 1 ORDER BY sort_order ASC LIMIT 1`
  ).bind(productId).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBProductImage;
}

export async function findImagesByProduct(db: D1Database, productId: string): Promise<DBProductImage[]> {
  const { results } = await db.prepare(
    `SELECT id, product_id, r2_key, alt_text, is_primary, sort_order, created_at FROM ${DB_TABLES.PRODUCT_IMAGES} WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC`
  ).bind(productId).all();
  return results as unknown as DBProductImage[];
}

// ---------- PRODUCT CRUD ----------

export async function createProduct(db: D1Database, data: {
  id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  stock: number;
  sku?: string | null;
  is_active?: boolean;
}): Promise<DBProduct> {
  const { results } = await db.prepare(
    `INSERT INTO ${DB_TABLES.PRODUCTS} (id, category_id, name, slug, description, price, stock, sku, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id, category_id, name, slug, author, description, price, stock, sku, is_active, created_at, updated_at`
  )
    .bind(
      data.id,
      data.category_id ?? null,
      data.name,
      data.slug,
      data.description ?? null,
      data.price,
      data.stock,
      data.sku ?? null,
      data.is_active !== false ? 1 : 0
    )
    .all();
  return results[0] as unknown as DBProduct;
}

export async function updateProduct(db: D1Database, id: string, data: {
  category_id?: string | null;
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  sku?: string | null;
  is_active?: boolean;
}): Promise<DBProduct | null> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.category_id !== undefined) { fields.push("category_id = ?"); params.push(data.category_id); }
  if (data.name !== undefined) {
    fields.push("name = ?");
    fields.push("slug = ?");
    params.push(data.name);
    params.push(data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
  }
  if (data.description !== undefined) { fields.push("description = ?"); params.push(data.description); }
  if (data.price !== undefined) { fields.push("price = ?"); params.push(data.price); }
  if (data.stock !== undefined) { fields.push("stock = ?"); params.push(data.stock); }
  if (data.sku !== undefined) { fields.push("sku = ?"); params.push(data.sku); }
  if (data.is_active !== undefined) { fields.push("is_active = ?"); params.push(data.is_active ? 1 : 0); }

  if (fields.length === 0) {
    return findProductById(db, id);
  }

  fields.push("updated_at = unixepoch()");
  params.push(id);

  await db.prepare(
    `UPDATE ${DB_TABLES.PRODUCTS} SET ${fields.join(", ")} WHERE id = ?`
  ).bind(...params).run();

  return findProductById(db, id);
}

export async function deleteProduct(db: D1Database, id: string): Promise<boolean> {
  const { meta } = await db.prepare(
    `DELETE FROM ${DB_TABLES.PRODUCTS} WHERE id = ?`
  ).bind(id).run();
  return meta.changes > 0;
}

// ---------- CART ----------

export async function getOrCreateCart(db: D1Database, userId: string): Promise<{ cartId: string }> {
  const { results } = await db.prepare(
    `SELECT id FROM ${DB_TABLES.CARTS} WHERE user_id = ?`
  ).bind(userId).all();

  if (results.length > 0) {
    return { cartId: results[0].id as string };
  }

  const { results: created } = await db.prepare(
    `INSERT INTO ${DB_TABLES.CARTS} (id, user_id) VALUES (?, ?) RETURNING id`
  ).bind(`cart_${userId}_${Date.now()}`, userId).all();

  const newCartId = created[0].id as string;
  return { cartId: newCartId };
}

export async function addCartItem(db: D1Database, data: {
  cart_id: string;
  product_id: string;
  quantity: number;
}): Promise<{ success: boolean; message?: string }> {
  const product = await findProductById(db, data.product_id);
  if (!product) {
    return { success: false, message: "Sản phẩm không tồn tại" };
  }
  if (!product.is_active) {
    return { success: false, message: "Sản phẩm đang không hoạt động" };
  }
  if (product.stock < data.quantity) {
    return { success: false, message: `Số lượng tồn kho không đủ. Còn ${product.stock}` };
  }

  try {
    await db.prepare(
      `INSERT INTO ${DB_TABLES.CART_ITEMS} (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)`
    ).bind(`item_${Date.now()}_${Math.random()}`, data.cart_id, data.product_id, data.quantity).run();
    return { success: true };
  } catch (e: any) {
    await db.prepare(
      `UPDATE ${DB_TABLES.CART_ITEMS} SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?`
    ).bind(data.quantity, data.cart_id, data.product_id).run();
    return { success: true, message: "Đã cập nhật số lượng trong giỏ" };
  }
}

export async function updateCartItemQuantity(db: D1Database, data: {
  cart_id: string;
  product_id: string;
  quantity: number;
}): Promise<boolean> {
  const { meta } = await db.prepare(
    `UPDATE ${DB_TABLES.CART_ITEMS} SET quantity = ? WHERE cart_id = ? AND product_id = ?`
  ).bind(data.quantity, data.cart_id, data.product_id).run();

  return meta.changes > 0;
}

export async function removeCartItem(db: D1Database, data: {
  cart_id: string;
  product_id: string;
}): Promise<boolean> {
  const { meta } = await db.prepare(
    `DELETE FROM ${DB_TABLES.CART_ITEMS} WHERE cart_id = ? AND product_id = ?`
  ).bind(data.cart_id, data.product_id).run();

  return meta.changes > 0;
}

export async function clearCart(db: D1Database, cartId: string): Promise<boolean> {
  const { meta } = await db.prepare(
    `DELETE FROM ${DB_TABLES.CART_ITEMS} WHERE cart_id = ?`
  ).bind(cartId).run();

  return meta.changes > 0;
}

export async function getCartItems(db: D1Database, cartId: string): Promise<{
  items: Array<{ product: DBProduct; quantity: number; subtotal: number }>;
  total: number;
}> {
  const { results } = await db.prepare(
    `SELECT ci.id, ci.product_id, ci.quantity, p.id as pid, p.name, p.slug, p.description, p.price, p.stock, p.sku, p.is_active, p.created_at, p.updated_at
     FROM ${DB_TABLES.CART_ITEMS} ci
     JOIN ${DB_TABLES.PRODUCTS} p ON p.id = ci.product_id
     WHERE ci.cart_id = ? AND p.is_active = 1`
  ).bind(cartId).all();

  const items = results as unknown as Array<{
    id: string;
    product_id: string;
    quantity: number;
    pid: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    sku: string | null;
    is_active: number;
    created_at: number;
    updated_at: number;
  }>;

  let total = 0;
  const formatted = items.map((item: any) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    return {
      product: {
        id: item.pid,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        stock: item.stock,
        sku: item.sku,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      } as unknown as DBProduct,
      quantity: item.quantity,
      subtotal,
    };
  });

  return { items: formatted, total };
}

// ---------- ORDER ----------

export async function createOrder(db: D1Database, data: {
  userId: string;
  items: Array<{ product_id: string; quantity: number }>;
  total_amount: number;
  shipping_address: string; // JSON string
  shipping_method: string;
  payment_method: string;
  note?: string;
}): Promise<{ order: DBOrder }> {
  // D1 không hỗ trợ BEGIN/COMMIT; db.batch() chạy tất cả câu lệnh trong 1 transaction.
  // Lấy giá hiện tại của sản phẩm (route đã kiểm tra tồn tại / tồn kho trước đó).
  const products = new Map<string, DBProduct>();
  for (const item of data.items) {
    const product = await findProductById(db, item.product_id);
    if (!product) throw new BusinessError("NOT_FOUND", `Sản phẩm ${item.product_id} không tồn tại`, 404);
    products.set(item.product_id, product);
  }

  const orderId = `order_${crypto.randomUUID()}`;
  const statements: D1PreparedStatement[] = [
    db.prepare(
      `INSERT INTO ${DB_TABLES.ORDERS} (id, user_id, status, total_amount, shipping_address, shipping_method, payment_method, payment_status, note)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, 'unpaid', ?)`
    ).bind(orderId, data.userId, data.total_amount, data.shipping_address, data.shipping_method, data.payment_method, data.note ?? null),
  ];

  for (const item of data.items) {
    const product = products.get(item.product_id)!;
    statements.push(
      db.prepare(
        `INSERT INTO ${DB_TABLES.ORDER_ITEMS} (id, order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(`orderitem_${crypto.randomUUID()}`, orderId, item.product_id, item.quantity, product.price, product.price * item.quantity),
      // Điều kiện stock >= ? chống bán vượt tồn kho khi có đơn đồng thời
      db.prepare(
        `UPDATE ${DB_TABLES.PRODUCTS} SET stock = stock - ?, updated_at = unixepoch() WHERE id = ? AND stock >= ?`
      ).bind(item.quantity, item.product_id, item.quantity),
      db.prepare(
        `INSERT INTO ${DB_TABLES.INVENTORY_TRANSACTIONS} (id, product_id, type, quantity, reference_id, note)
         VALUES (?, ?, 'sale', ?, ?, ?)`
      ).bind(`inv_${crypto.randomUUID()}`, item.product_id, -item.quantity, orderId, `Bán theo đơn #${orderId}`),
    );
  }

  const results = await db.batch(statements);

  // Nếu có UPDATE tồn kho nào không ảnh hưởng dòng nào => hết hàng, hoàn tác thủ công
  const stockUpdates = results.filter((_, i) => i > 0 && (i - 1) % 3 === 1);
  if (stockUpdates.some((r) => r.meta.changes === 0)) {
    const rollback: D1PreparedStatement[] = [];
    stockUpdates.forEach((r, idx) => {
      if (r.meta.changes > 0) {
        const item = data.items[idx];
        rollback.push(db.prepare(`UPDATE ${DB_TABLES.PRODUCTS} SET stock = stock + ? WHERE id = ?`).bind(item.quantity, item.product_id));
      }
    });
    rollback.push(db.prepare(`DELETE FROM ${DB_TABLES.INVENTORY_TRANSACTIONS} WHERE reference_id = ?`).bind(orderId));
    rollback.push(db.prepare(`DELETE FROM ${DB_TABLES.ORDERS} WHERE id = ?`).bind(orderId)); // order_items xóa theo CASCADE
    await db.batch(rollback);
    throw new BusinessError("INSUFFICIENT_STOCK", "Một số sản phẩm không đủ tồn kho, vui lòng thử lại");
  }

  const order = await db.prepare(
    `SELECT id, user_id, status, total_amount, shipping_address, shipping_method, payment_method, payment_status, note, created_at, updated_at
     FROM ${DB_TABLES.ORDERS} WHERE id = ?`
  ).bind(orderId).first<DBOrder>();

  return { order: order! };
}

export async function findOrderItems(db: D1Database, orderId: string) {
  const { results } = await db.prepare(
    `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal, p.name, p.slug, p.author,
            (SELECT r2_key FROM ${DB_TABLES.PRODUCT_IMAGES} pi WHERE pi.product_id = oi.product_id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_key
     FROM ${DB_TABLES.ORDER_ITEMS} oi
     JOIN ${DB_TABLES.PRODUCTS} p ON p.id = oi.product_id
     WHERE oi.order_id = ?`
  ).bind(orderId).all();
  return results;
}

export async function findOrdersByUser(db: D1Database, userId: string, statusFilter?: string): Promise<DBOrder[]> {
  let where = `WHERE user_id = ?`;
  const params: any[] = [userId];

  if (statusFilter) {
    where += ` AND status = ?`;
    params.push(statusFilter);
  }

  const { results } = await db.prepare(
    `SELECT id, user_id, status, total_amount, shipping_address, shipping_method, payment_method, payment_status, note, created_at, updated_at FROM ${DB_TABLES.ORDERS} ${where} ORDER BY created_at DESC`
  ).bind(...params).all();

  return results as unknown as DBOrder[];
}

// ---------- INVENTORY TRANSACTION ----------

export async function createInventoryTransaction(db: D1Database, data: {
  product_id: string;
  type: InventoryType;
  quantity: number;
  reference_id?: string;
  note?: string;
}): Promise<DBInventoryTransaction> {
  const { results } = await db.prepare(
    `INSERT INTO ${DB_TABLES.INVENTORY_TRANSACTIONS} (id, product_id, type, quantity, reference_id, note)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id, product_id, type, quantity, reference_id, note, created_at`
  )
    .bind(`inv_${crypto.randomUUID()}`, data.product_id, data.type, data.quantity, data.reference_id ?? null, data.note ?? null)
    .all();
  return results[0] as unknown as DBInventoryTransaction;
}

export async function findInventoryTransactionsByProduct(db: D1Database, productId: string): Promise<DBInventoryTransaction[]> {
  const { results } = await db.prepare(
    `SELECT id, product_id, type, quantity, reference_id, note, created_at FROM ${DB_TABLES.INVENTORY_TRANSACTIONS} WHERE product_id = ? ORDER BY created_at DESC`
  ).bind(productId).all();
  return results as unknown as DBInventoryTransaction[];
}

// ---------- SETTINGS ----------

export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const { results } = await db.prepare(
    `SELECT value FROM ${DB_TABLES.SETTINGS} WHERE key = ?`
  ).bind(key).all();
  return results.length > 0 ? (results[0] as { value: string }).value : null;
}

export async function setSetting(db: D1Database, key: string, value: string, description?: string): Promise<void> {
  await db.prepare(
    `INSERT INTO ${DB_TABLES.SETTINGS} (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = unixepoch()`
  ).bind(key, value, description ?? null, value).run();
}

// ---------- SESSION ----------

export async function findSessionByTokenHash(db: D1Database, hash: string): Promise<DBSession | null> {
  const { results } = await db.prepare(
    `SELECT id, user_id, refresh_token_hash, user_agent, ip_address, expires_at, created_at FROM ${DB_TABLES.SESSIONS} WHERE refresh_token_hash = ?`
  ).bind(hash).all();
  if (!results || results.length === 0) return null;
  return results[0] as unknown as DBSession;
}

export async function createSession(db: D1Database, data: {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: number;
}): Promise<DBSession> {
  const { results } = await db.prepare(
    `INSERT INTO ${DB_TABLES.SESSIONS} (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id, user_id, refresh_token_hash, user_agent, ip_address, expires_at, created_at`
  )
    .bind(data.id, data.userId, data.refreshTokenHash, data.userAgent ?? null, data.ipAddress ?? null, data.expiresAt)
    .all();
  return results[0] as unknown as DBSession;
}

export async function invalidateSession(db: D1Database, hash: string): Promise<boolean> {
  const { meta } = await db.prepare(
    `DELETE FROM ${DB_TABLES.SESSIONS} WHERE refresh_token_hash = ?`
  ).bind(hash).run();
  return meta.changes > 0;
}

export async function invalidateAllUserSessions(db: D1Database, userId: string): Promise<boolean> {
  const { meta } = await db.prepare(
    `DELETE FROM ${DB_TABLES.SESSIONS} WHERE user_id = ?`
  ).bind(userId).run();
  return meta.changes > 0;
}

export async function deleteExpiredSessions(db: D1Database): Promise<number> {
  const { meta } = await db.prepare(
    `DELETE FROM ${DB_TABLES.SESSIONS} WHERE expires_at < unixepoch()`
  ).run();
  return meta.changes;
}