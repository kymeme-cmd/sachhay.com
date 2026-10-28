// ============================================================
// Component: QuantityInput - Chọn số lượng: nút −/+ và gõ trực tiếp
// ============================================================

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
}

export function QuantityInput({ value, onChange, min = 1, max, disabled }: QuantityInputProps) {
  // Giữ chuỗi riêng để người dùng xóa trắng rồi gõ lại mà không bị nhảy về 1 ngay
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);

  const clamp = (n: number) => Math.min(Math.max(n, min), Math.max(min, max));

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    const next = clamp(isNaN(n) ? value : n);
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const btn =
    "w-10 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="inline-flex items-center rounded-xl border border-gray-300 bg-light overflow-hidden">
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} aria-label="Giảm số lượng">
        <Minus size={16} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Số lượng"
        value={text}
        disabled={disabled}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
          const n = parseInt(digits, 10);
          if (!isNaN(n) && n > max) {
            // Vượt tồn kho → giới hạn ngay để người dùng thấy số tối đa
            setText(String(max));
            if (max !== value) onChange(max);
            return;
          }
          setText(digits);
          if (!isNaN(n) && n >= min) onChange(n);
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
        className="w-14 h-11 text-center text-base font-semibold text-gray-800 border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} aria-label="Tăng số lượng">
        <Plus size={16} />
      </button>
    </div>
  );
}
