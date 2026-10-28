// Component: Navbar - Thanh dieu huong

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { itemCount } = useCart();
  const { logout } = useAuth();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <nav className="sticky top-0 z-50 bg-light border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">Sách Hay</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-primary">Trang chủ</Link>
            <Link to="/books" className="text-sm font-medium text-gray-600 hover:text-primary">Danh sách sách</Link>
            <Link to="/cart" className="text-sm font-medium text-gray-600 hover:text-primary">Giỏ hàng</Link>
            <Link to="/history" className="text-sm font-medium text-gray-600 hover:text-primary">Lịch sử</Link>

            <div className="hidden sm:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-primary">Quản trị</Link>
                  )}
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary">Đăng nhập</Link>
                  <Link to="/register" className="text-sm font-medium text-gray-600 hover:text-primary">Đăng ký</Link>
                </>
              )}
              <Link to="/cart" className="relative group p-1" aria-label={`Giỏ hàng (${itemCount} cuốn)`}>
                <ShoppingCart size={20} strokeWidth={2} />
                <CartBadge count={itemCount} />
              </Link>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <Link to="/cart" className="relative p-1" aria-label={`Giỏ hàng (${itemCount} cuốn)`}>
              <ShoppingCart size={20} strokeWidth={2} />
              <CartBadge count={itemCount} />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-primary"
            >
              {isOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-light px-4 py-4 space-y-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary">Trang chủ</Link>
          <Link to="/books" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary">Danh sách sách</Link>
          <Link to="/cart" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary">Giỏ hàng</Link>
          <Link to="/history" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary">Lịch sử</Link>
          <div className="pt-4 border-t border-gray-100">
            {isAuthenticated ? (
              <>
                {isAdmin && <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary">Quản trị</Link>}
                <button onClick={logout} className="block w-full px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary">Đăng nhập</Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
/** Huy hiệu số lượng trên icon giỏ hàng */
function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-accent text-[11px] font-bold leading-none text-white flex items-center justify-center ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
