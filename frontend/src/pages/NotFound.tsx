// Page: NotFound - Trang 404

import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      icon={<BookOpen size={32} />}
      title="Không tìm thấy trang"
      description="Trang bạn tìm có thể đã bị xóa hoặc đường dẫn không đúng."
      action={<Link to="/" className="btn-primary inline-block">Về trang chủ</Link>}
    />
  );
}
