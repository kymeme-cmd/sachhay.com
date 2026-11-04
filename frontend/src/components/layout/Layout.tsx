// Component: Layout - Bố cục chung cho trang

import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/common/Navbar";
import { Toaster } from "@/components/common/Toaster";
import { ChatWidget } from "@/components/chat/ChatWidget";

export function Layout() {
  // Trang quản trị không cần trợ lý AI (nút nổi che bảng dữ liệu)
  const isAdminPage = useLocation().pathname.startsWith("/admin");
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      {/* pb-24: chừa chỗ cho nút "Hỏi trợ lý AI" để không che nội dung cuối trang */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isAdminPage ? "" : "pb-24"}`}>
        <Outlet />
      </main>
      <Toaster />
      {!isAdminPage && <ChatWidget />}
    </div>
  );
}
