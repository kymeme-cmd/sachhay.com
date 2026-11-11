// Component: Footer - Chân trang: khám phá, hỗ trợ khách hàng, mạng xã hội, giới thiệu cửa hàng

import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, Truck, CreditCard } from "lucide-react";

// Thông tin liên hệ giống bảng chính sách (migrations/0007_chatbot.sql) để chatbot và chân trang khớp nhau
const CONTACT_EMAIL = "support@sachhay.vn";
const CONTACT_PHONE = "0909 123 456";

// TODO: thay bằng đường dẫn trang mạng xã hội thật của Sách Hay
const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/", icon: <Facebook size={20} /> },
  { label: "Instagram", href: "https://www.instagram.com/", icon: <Instagram size={20} /> },
  { label: "YouTube", href: "https://www.youtube.com/", icon: <Youtube size={20} /> },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/",
    icon: (
      <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.37-2.48V9.66a5.73 5.73 0 0 0-.77-.05A5.68 5.68 0 0 0 4.18 15.3 5.68 5.68 0 0 0 9.86 21a5.68 5.68 0 0 0 5.68-5.68V9.01a7.35 7.35 0 0 0 4.28 1.37V7.3a4.28 4.28 0 0 1-3.22-1.48Z" />
      </svg>
    ),
  },
];

const EXPLORE_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/books", label: "Danh sách sách" },
  { to: "/cart", label: "Giỏ hàng" },
  { to: "/history?tab=orders", label: "Đơn đã mua" },
];

const headingClass = "text-sm font-bold tracking-wider uppercase text-primary mb-4";
const linkClass = "text-gray-600 hover:text-primary transition-colors";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Giới thiệu */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span aria-hidden className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-amber-300 font-serif font-bold text-xl leading-none">S</span>
            <span className="text-xl font-serif font-bold text-primary tracking-tight">Sách Hay</span>
          </Link>
          <p className="text-sm text-gray-600 leading-relaxed">
            Hiệu sách trực tuyến dành cho người yêu đọc: truyện thiếu nhi, văn học, kỹ năng sống. Mỗi cuốn sách là một chuyến phiêu lưu mới.
          </p>
        </div>

        {/* Khám phá */}
        <nav aria-label="Khám phá">
          <h2 className={headingClass}>Khám phá</h2>
          <ul className="space-y-2.5 text-sm">
            {EXPLORE_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hỗ trợ khách hàng */}
        <div>
          <h2 className={headingClass}>Hỗ trợ khách hàng</h2>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Truck size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <span>Giao hàng toàn quốc, miễn phí vận chuyển</span>
            </li>
            <li className="flex items-start gap-2">
              <CreditCard size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <span>COD, chuyển khoản, thẻ tín dụng</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-gray-400" />
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-gray-400" />
              <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className={linkClass}>{CONTACT_PHONE}</a>
            </li>
          </ul>
        </div>

        {/* Mạng xã hội */}
        <div>
          <h2 className={headingClass}>Theo dõi chúng tôi</h2>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">Cập nhật sách mới và ưu đãi mỗi tuần.</p>
        </div>
      </div>

      {/* Bản quyền — pb-24 chừa chỗ cho nút "Hỏi trợ lý AI" nổi ở góc phải */}
      <div className="border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 text-center text-sm text-gray-500 space-y-2">
          <p>© {new Date().getFullYear()} Sách Hay. Bảo lưu mọi quyền.</p>
          <p className="text-xs leading-relaxed">
            Sách Hay là hiệu sách trực tuyến. Giá và tồn kho hiển thị được cập nhật trực tiếp từ cửa hàng; ảnh bìa có thể khác đôi chút so với ấn bản thực tế.
          </p>
        </div>
      </div>
    </footer>
  );
}
