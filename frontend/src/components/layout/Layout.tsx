// Component: Layout - Bố cục chung cho trang

import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/common/Navbar";
import { Toaster } from "@/components/common/Toaster";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Footer } from "@/components/layout/Footer";

export function Layout() {
  // Trang quản trị không cần trợ lý AI (nút nổi che bảng dữ liệu)
  const isAdminPage = useLocation().pathname.startsWith("/admin");
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Navbar />
      {/* flex-1: trang ít nội dung thì chân trang vẫn nằm sát đáy màn hình */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isAdminPage ? "" : "pb-12"}`}>
        <Outlet />
      </main>
      {!isAdminPage && <Footer />}
      <Toaster />
      {!isAdminPage && <ChatWidget />}
    </div>
  );
}
