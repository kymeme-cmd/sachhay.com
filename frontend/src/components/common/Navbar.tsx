// Component: Navbar - Thanh điều hướng
// Trái: logo + menu chính. Phải: tìm kiếm, giỏ hàng, menu tài khoản (Lịch sử / Quản trị / Đăng xuất).
// Dưới lg: gom vào nút ☰.

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, History, LayoutDashboard, LogOut, LogIn, UserPlus, ChevronDown, Package } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { SearchBox } from "@/components/book/SearchBox";

/** Menu chính: trang hiện tại chữ đậm + gạch chân vàng */
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative py-1 text-sm transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-amber-500 after:transition-all ${
    isActive ? "font-semibold text-primary after:w-full" : "font-medium text-gray-600 hover:text-primary after:w-0 hover:after:w-full"
  }`;

const menuItemClass =
  "flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user, isAuthenticated } = useAuthStore();
  const { itemCount } = useCart();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Đổi trang → đóng mọi menu
  useEffect(() => { setMobileOpen(false); setAccountOpen(false); }, [location.pathname, location.search]);

  // Bấm ra ngoài / Esc → đóng menu tài khoản
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => { if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAccountOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [accountOpen]);

  const submitSearch = (q: string) => {
    const term = q.trim();
    if (term) navigate(`/books?search=${encodeURIComponent(term)}`);
  };

  const handleLogout = () => { setAccountOpen(false); setMobileOpen(false); logout(); };

  return (
    <nav className="sticky top-0 z-50 bg-light/95 backdrop-blur border-b border-gray-200" aria-label="Điều hướng chính">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 h-16">
          {/* Trái: logo + menu chính */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 rounded-lg" aria-label="Sách Hay - Trang chủ">
            <span aria-hidden className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-amber-300 font-serif font-bold text-xl leading-none">S</span>
            <span className="text-xl font-serif font-bold text-primary tracking-tight">Sách Hay</span>
          </Link>
          <div className="hidden lg:flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>Trang chủ</NavLink>
            <NavLink to="/books" className={navLinkClass}>Danh sách sách</NavLink>
          </div>

          {/* Phải: tìm kiếm + giỏ + tài khoản */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block w-72 xl:w-80">
              <SearchBox compact value={search} onChange={setSearch} onSubmit={submitSearch} />
            </div>

            <Link
              to="/cart"
              className="relative p-2 rounded-full text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
              aria-label={`Giỏ hàng (${itemCount} cuốn)`}
            >
              <ShoppingCart size={22} strokeWidth={2} />
              <CartBadge count={itemCount} />
            </Link>

            {/* Menu tài khoản */}
            <div ref={accountRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="Tài khoản"
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-gray-700 hover:bg-primary/5 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {isAuthenticated && user?.name ? user.name.trim().charAt(0).toUpperCase() : <User size={18} />}
                </span>
                <ChevronDown size={16} className={`transition-transform ${accountOpen ? "rotate-180" : ""}`} />
              </button>

              {accountOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl bg-light border border-gray-200 shadow-xl overflow-hidden animate-fade-in">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link role="menuitem" to="/history?tab=orders" className={menuItemClass}><Package size={17} /> Lịch sử đơn hàng</Link>
                      <Link role="menuitem" to="/history" className={menuItemClass}><History size={17} /> Sách đã xem</Link>
                      {isAdmin && <Link role="menuitem" to="/admin" className={menuItemClass}><LayoutDashboard size={17} /> Quản trị</Link>}
                      <button role="menuitem" type="button" onClick={handleLogout} className={`${menuItemClass} border-t border-gray-200`}>
                        <LogOut size={17} /> Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <Link role="menuitem" to="/login" state={{ from: location.pathname }} className={menuItemClass}><LogIn size={17} /> Đăng nhập</Link>
                      <Link role="menuitem" to="/register" className={menuItemClass}><UserPlus size={17} /> Đăng ký</Link>
                      <Link role="menuitem" to="/history" className={`${menuItemClass} border-t border-gray-200`}><History size={17} /> Sách đã xem</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-primary/5"
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu điện thoại / tablet */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-light px-4 py-4 space-y-1 animate-fade-in">
          <div className="pb-3">
            <SearchBox compact value={search} onChange={setSearch} onSubmit={submitSearch} />
          </div>
          <MobileLink to="/" end>Trang chủ</MobileLink>
          <MobileLink to="/books">Danh sách sách</MobileLink>
          <MobileLink to="/cart">Giỏ hàng{itemCount > 0 ? ` (${itemCount})` : ""}</MobileLink>
          <MobileLink to="/history">Lịch sử</MobileLink>
          <div className="pt-3 mt-2 border-t border-gray-200 space-y-1">
            {isAuthenticated ? (
              <>
                <p className="px-3 pb-1 text-xs text-gray-500 truncate">Đăng nhập: {user?.email}</p>
                {isAdmin && <MobileLink to="/admin">Quản trị</MobileLink>}
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-primary/5 hover:text-primary">
                  <LogOut size={18} /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login">Đăng nhập</MobileLink>
                <MobileLink to="/register">Đăng ký</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileLink({ to, end, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg text-base transition-colors ${isActive ? "bg-primary/10 text-primary font-semibold" : "font-medium text-gray-700 hover:bg-primary/5 hover:text-primary"}`
      }
    >
      {children}
    </NavLink>
  );
}

/** Huy hiệu số lượng trên icon giỏ hàng */
function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span aria-hidden className="absolute top-0 right-0 min-w-[1.25rem] h-5 px-1 rounded-full bg-accent text-[11px] font-bold leading-none text-white flex items-center justify-center ring-2 ring-light">
      {count > 99 ? "99+" : count}
    </span>
  );
}
