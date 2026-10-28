// ============================================================
// Tìm sách theo TỪ KHÓA cho chatbot (chạy song song với Vectorize)
// Bắt được các kiểu gõ ngắn / thiếu chữ / không dấu / sai 1 ký tự: "cona", "conna", "hary poter".
// Phần chấm điểm là hàm thuần (không đụng D1) để test bằng dữ liệu giả: keyword.test.ts
// ============================================================

/** Chữ thường, "đ" → "d", bỏ dấu tiếng Việt, bỏ ký tự đặc biệt: "Thám Tử Lừng Danh Conan" → "tham tu lung danh conan" */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Từ thừa trong câu hỏi, không dùng để tìm ("goi y" là cụm 2 từ) */
const STOPWORDS = new Set([
  "sach", "quyen", "cuon", "cho", "toi", "minh", "ban", "shop", "co", "khong", "ko", "nao", "gi", "la", "ve", "cua",
  "voi", "va", "hay", "tim", "muon", "mua", "can", "xem", "hoi", "nhung", "cac", "mot", "nay", "nhe", "vay",
]);
/**
 * Bổ sung ngoài danh sách gốc: từ để hỏi giá / tác giả / thể loại.
 * Thiếu chúng thì "Mắt Biếc giá bao nhiêu" khớp nhầm "Tuổi Trẻ Đáng Giá Bao Nhiêu" (3/5 từ khóa trùng).
 * Khoảng giá đã được parsePriceRange (rag.ts) xử lý riêng.
 */
const QUESTION_WORDS = new Set([
  "gia", "bao", "nhieu", "tac", "the", "loai", "ai", "dau", "duoc", "khoang", "duoi", "tren", "tu", "den", "re", "hon",
  "k", "nghin", "ngan", "dong",
]);
const STOP_PHRASES = [/\bgoi y\b/g];

export function extractKeywords(question: string): string[] {
  let text = normalize(question);
  for (const re of STOP_PHRASES) text = text.replace(re, " ");
  return [...new Set(text.split(" ").filter((w) => w && !STOPWORDS.has(w) && !QUESTION_WORDS.has(w) && !/^\d+k?$/.test(w)))];
}

/** Sai đúng 1 ký tự (thêm / bớt / thay) hoặc đảo 2 ký tự cạnh nhau */
export function isOneTypo(a: string, b: string): boolean {
  if (a === b) return false;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  if (la === lb) {
    const diff: number[] = [];
    for (let i = 0; i < la && diff.length <= 2; i++) if (a[i] !== b[i]) diff.push(i);
    if (diff.length === 1) return true; // thay 1 ký tự
    return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]; // đảo cạnh nhau
  }
  const [s, l] = la < lb ? [a, b] : [b, a]; // thêm / bớt 1 ký tự
  let i = 0, j = 0, skipped = false;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) { i++; j++; continue; }
    if (skipped) return false;
    skipped = true;
    j++;
  }
  return true;
}

/**
 * Điểm tốt nhất của 1 từ khóa so với danh sách từ của một trường.
 * allowTypo = false khi từ khóa là một từ có thật trong kho sách (gõ đúng),
 * để "thieu" (thiếu nhi) không bị coi là gõ sai của "nhieu".
 */
function wordScore(keyword: string, words: string[], allowTypo: boolean): number {
  // Từ khóa 1–3 ký tự chỉ tính khi trùng nguyên từ: "nhi" (thiếu nhi) không được khớp tiền tố "nhieu"
  if (keyword.length <= 3) return words.includes(keyword) ? 4 : 0;
  let best = 0;
  for (const w of words) {
    if (w === keyword) return 4; // trùng nguyên từ
    if (w.startsWith(keyword)) best = Math.max(best, 3); // "cona" → "conan"
    else if (w.includes(keyword)) best = Math.max(best, 2); // nằm giữa chữ
    else if (allowTypo && keyword.length >= 4 && w.length >= 4 && isOneTypo(keyword, w)) best = Math.max(best, 1.5); // "conna", "hary"
  }
  return best;
}

export interface KeywordBook {
  id: string;
  name: string; // đã normalize
  meta: string; // tác giả + thể loại, đã normalize
}

export interface KeywordHit {
  id: string;
  score: number;
  matched: number;
}

const NAME_WEIGHT = 2; // khớp trong tên sách được nhân 2 so với tác giả / thể loại
export const MAX_KEYWORD_HITS = 8;
/** Giữ sách có điểm ≥ 40% điểm của cuốn đứng đầu */
const MIN_RELATIVE_SCORE = 0.4;

/** Chấm điểm từng sách; giữ sách khớp ít nhất một nửa số từ khóa, xếp theo điểm, tối đa 8 cuốn */
export function scoreBooks(books: KeywordBook[], keywords: string[]): KeywordHit[] {
  if (keywords.length === 0) return [];
  const vocabulary = new Set(books.flatMap((b) => `${b.name} ${b.meta}`.split(" ")));
  const allowTypo = new Map(keywords.map((k) => [k, !vocabulary.has(k)]));
  const hits: KeywordHit[] = [];
  for (const b of books) {
    const nameWords = b.name.split(" ");
    const metaWords = b.meta.split(" ");
    let score = 0, matched = 0;
    for (const k of keywords) {
      const typo = allowTypo.get(k)!;
      const s = Math.max(wordScore(k, nameWords, typo) * NAME_WEIGHT, wordScore(k, metaWords, typo));
      if (s > 0) { score += s; matched++; }
    }
    if (matched * 2 >= keywords.length) hits.push({ id: b.id, score, matched });
  }
  // Đã có sách khớp ĐỦ mọi từ khóa → bỏ sách chỉ khớp một phần ("mat biec" không kéo theo "Bí Mật ...")
  const full = hits.filter((h) => h.matched === keywords.length);
  const pool = full.length > 0 ? full : hits;
  pool.sort((a, b) => b.score - a.score || b.matched - a.matched);
  // Bỏ đuôi nhiễu: "hary poter" → Harry Potter (6 điểm) chứ không kéo theo tác giả "Harv"/"Peter" (1.5 điểm)
  const minScore = (pool[0]?.score ?? 0) * MIN_RELATIVE_SCORE;
  return pool.filter((h) => h.score >= minScore).slice(0, MAX_KEYWORD_HITS);
}

// ---------- Đọc catalog từ D1 (cache 5 phút trong bộ nhớ của Worker) ----------

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; books: KeywordBook[] } | null = null;

/** Gọi khi đồng bộ lại dữ liệu AI hoặc khi admin sửa sách */
export function clearKeywordCache() {
  cache = null;
}

async function loadCatalog(db: D1Database): Promise<KeywordBook[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.books;
  const { results } = await db.prepare(
    `SELECT p.id, p.name, p.author, c.name AS category
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1`
  ).all<{ id: string; name: string; author: string | null; category: string | null }>();
  const books = results.map((r) => ({ id: r.id, name: normalize(r.name), meta: normalize(`${r.author ?? ""} ${r.category ?? ""}`) }));
  cache = { at: Date.now(), books };
  return books;
}

/** Tìm sách theo từ khóa trong câu hỏi; trả về id (đã xếp hạng) và số từ khóa */
export async function keywordSearch(db: D1Database, question: string): Promise<{ ids: string[]; keywordCount: number }> {
  const keywords = extractKeywords(question);
  if (keywords.length === 0) return { ids: [], keywordCount: 0 };
  const hits = scoreBooks(await loadCatalog(db), keywords);
  return { ids: hits.map((h) => h.id), keywordCount: keywords.length };
}
