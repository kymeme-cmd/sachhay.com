// ============================================================
// Component: ChatWidget - Trợ lý AI (nút nổi góc phải + khung chat)
// Câu trả lời đến từ /api/chat (RAG trên dữ liệu cửa hàng); thẻ sách là dữ liệu D1 thật.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, MessageCircle, Send, X, Trash2, ShieldCheck } from "lucide-react";
import { chatAPI, type ChatTurn } from "@/api/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { fallbackImageUrl, getProductImageUrl } from "@/utils/image";
import { RatingLine } from "@/components/book/StarRating";

interface ChatBook {
  id: string;
  name: string;
  author?: string | null;
  price: number;
  stock: number;
  avg_rating?: number | null;
  review_count?: number;
  images?: { r2_key: string }[];
}

interface Message extends ChatTurn {
  books?: ChatBook[];
  error?: boolean;
}

const STORAGE_KEY = "chat_history";
const SUGGESTIONS = [
  "Gợi ý sách thiếu nhi dưới 100k",
  "Có sách của Nguyễn Nhật Ánh không?",
  "Phí giao hàng thế nào?",
  "Đơn hàng của tôi đang ở đâu?",
];

function loadHistory(): Message[] {
  try {
    const list = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* bỏ qua */ }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // Trên điện thoại khung chat che cả màn hình → đóng lại khi mở trang sách
  const closeOnMobile = () => { if (window.innerWidth < 640) setOpen(false); };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    // Lịch sử gửi lên: 6 lượt gần nhất, bỏ tin báo lỗi
    const history: ChatTurn[] = messages.filter((m) => !m.error).slice(-6).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setSending(true);
    try {
      const res = await chatAPI.send(message, history);
      const data = res.data as { answer: string; books: ChatBook[] };
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, books: data.books }]);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Trợ lý AI tạm thời không trả lời được. Vui lòng thử lại.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg, error: true }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Nút mở */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý AI"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary text-white pl-4 pr-5 py-3.5 shadow-xl shadow-primary/30 hover:bg-secondary hover:-translate-y-0.5 transition-all"
        >
          <MessageCircle size={22} className="text-amber-300" />
          <span className="font-semibold text-sm hidden sm:inline">Hỏi trợ lý AI</span>
        </button>
      )}

      {/* Khung chat */}
      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý AI Sách Hay"
          className="fixed z-50 inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px] sm:h-[580px] sm:max-h-[calc(100vh-2.5rem)] flex flex-col bg-light sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-dark to-secondary text-white">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-dark flex items-center justify-center"><Bot size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight">Trợ lý Sách Hay</p>
              <p className="text-xs text-amber-200 flex items-center gap-1"><ShieldCheck size={12} /> Trả lời dựa trên dữ liệu cửa hàng</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => setMessages([])} className="p-2 rounded-lg hover:bg-white/10" aria-label="Xóa cuộc trò chuyện" title="Xóa cuộc trò chuyện">
                <Trash2 size={18} />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Đóng">
              <X size={20} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-paper">
            {messages.length === 0 && (
              <div className="space-y-3">
                <Bubble role="assistant">
                  Xin chào! Mình là trợ lý của Sách Hay. Mình có thể gợi ý sách theo nhu cầu, cho biết giá và tình trạng còn hàng, giải đáp về giao hàng, thanh toán, và tra cứu đơn hàng của bạn.
                </Bubble>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="text-sm px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-light hover:bg-primary hover:text-white transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className="space-y-2">
                <Bubble role={m.role} error={m.error}>
                  {m.role === "assistant" && !m.error ? <RichText text={m.content} books={m.books ?? []} onOpen={closeOnMobile} /> : m.content}
                </Bubble>
                {m.books && m.books.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                    {m.books.map((b) => <ChatBookCard key={b.id} book={b} onOpen={closeOnMobile} />)}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-1.5 px-4 py-3 w-fit rounded-2xl rounded-bl-sm bg-light border border-gray-200" aria-label="Đang trả lời">
                {[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2 p-3 border-t border-gray-200 bg-light"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              rows={1}
              maxLength={500}
              placeholder="Hỏi về sách, giá, giao hàng..."
              className="flex-1 resize-none max-h-28 px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <button type="submit" disabled={!input.trim() || sending} aria-label="Gửi" className="p-3 rounded-xl bg-primary text-white hover:bg-secondary disabled:opacity-40 transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, error, children }: { role: ChatTurn["role"]; error?: boolean; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          mine
            ? "bg-primary text-white rounded-br-sm"
            : error
              ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
              : "bg-light text-gray-800 border border-gray-200 rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/** Thẻ sách dạng bìa đứng, xếp thành dải vuốt ngang dưới câu trả lời */
function ChatBookCard({ book, onOpen }: { book: ChatBook; onOpen: () => void }) {
  return (
    <Link to={`/books/${book.id}`} onClick={onOpen} className="group w-[124px] flex-shrink-0 snap-start rounded-xl bg-light border border-gray-200 p-2 hover:border-primary hover:shadow-md transition-all">
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-200">
        <img
          src={getProductImageUrl(book.images?.[0]?.r2_key)}
          alt={book.name}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackImageUrl(); }}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${book.stock <= 0 ? "grayscale opacity-70" : ""}`}
        />
      </div>
      <p className="mt-1.5 text-xs font-semibold text-gray-800 leading-snug line-clamp-2 min-h-[2rem]">{book.name}</p>
      {(book.review_count ?? 0) > 0 && <RatingLine product={book} size={10} />}
      <p className="text-sm font-bold text-accent">{formatCurrency(book.price)}</p>
      {book.stock <= 0 && <p className="text-[11px] text-gray-500">Hết hàng</p>}
    </Link>
  );
}

/**
 * Hiển thị câu trả lời có định dạng nhẹ: **đậm**, gạch đầu dòng (*, -, •).
 * Tên sách in đậm khớp với thẻ sách → thành liên kết tới trang sách. Không dùng HTML thô (an toàn).
 */
function RichText({ text, books, onOpen }: { text: string; books: ChatBook[]; onOpen: () => void }) {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/["“”]/g, "").trim();
  const bookByName = new Map(books.map((b) => [norm(b.name), b]));

  const inline = (line: string, key: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      const m = part.match(/^\*\*([^*]+)\*\*$/);
      if (!m) return <span key={`${key}-${i}`}>{part.replace(/\*/g, "")}</span>;
      const book = bookByName.get(norm(m[1]));
      return book ? (
        <Link key={`${key}-${i}`} to={`/books/${book.id}`} onClick={onOpen} className="font-semibold text-primary underline decoration-amber-400 decoration-2 underline-offset-2 hover:text-accent">
          {m[1].replace(/["“”]/g, "")}
        </Link>
      ) : (
        <strong key={`${key}-${i}`} className="font-semibold text-gray-900">{m[1]}</strong>
      );
    });

  // Gom các dòng gạch đầu dòng liên tiếp thành 1 danh sách
  const blocks: Array<{ type: "p" | "ul"; lines: string[] }> = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^(?:[*•-]|\d+\.)\s+(.*)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.lines.push(bullet[1]);
      else blocks.push({ type: "ul", lines: [bullet[1]] });
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }

  return (
    <div className="space-y-2 whitespace-normal">
      {blocks.map((b, i) =>
        b.type === "ul" ? (
          <ul key={i} className="space-y-1.5">
            {b.lines.map((l, j) => (
              <li key={j} className="flex gap-2">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span>{inline(l, `${i}-${j}`)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{inline(b.lines[0], `${i}`)}</p>
        )
      )}
    </div>
  );
}
