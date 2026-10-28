// ============================================================
// Component: Alert - Thông báo lỗi/thành công
// ============================================================

import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface AlertProps {
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

const icons: Record<string, React.ReactNode> = {
  success: <CheckCircle size={20} strokeWidth={2.5} />,
  error: <AlertCircle size={20} strokeWidth={2.5} />,
  info: <Info size={20} strokeWidth={2.5} />,
};

const colors: Record<string, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function Alert({ type, title, description }: AlertProps) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${colors[type]}`}>
      <div className="mt-0.5">{icons[type]}</div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        {description && <p className="mt-1 text-sm">{description}</p>}
      </div>
    </div>
  );
}