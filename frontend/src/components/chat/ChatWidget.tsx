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
                <Bubble role={m.role} error={m.error}>{m.content}</Bubble>
                {m.books && m.books.length > 0 && (
                  <div className="space-y-2 pl-1">
                    {m.books.map((b) => <ChatBookCard key={b.id} book={b} onOpen={() => setOpen(window.innerWidth >= 640)} />)}
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

function ChatBookCard({ book, onOpen }: { book: ChatBook; onOpen: () => void }) {
  return (
    <Link to={`/books/${book.id}`} onClick={onOpen} className="flex gap-3 p-2 rounded-xl bg-light border border-gray-200 hover:border-primary hover:shadow-sm transition-all">
      <img
        src={getProductImageUrl(book.images?.[0]?.r2_key)}
        alt={book.name}
        onError={(e) => { (e.target as HTMLImageElement).src = fallbackImageUrl(); }}
        className="w-12 h-[72px] rounded-md object-cover bg-gray-200 flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2">{book.name}</p>
        {book.author && <p className="text-xs text-gray-500 truncate">{book.author}</p>}
        <RatingLine product={book} size={12} />
        <p className="text-sm font-bold text-accent">
          {formatCurrency(book.price)}
          {book.stock <= 0 && <span className="ml-2 text-xs font-medium text-gray-500">Hết hàng</span>}
        </p>
      </div>
    </Link>
  );
}
