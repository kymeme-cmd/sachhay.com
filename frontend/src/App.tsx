// ============================================================
// App - Cấu hình routing cho toàn bộ ứng dụng
// ============================================================

import React, { Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageLoading } from "@/components/common/Loading";
import { useAuthStore } from "@/store/auth";
import { useAuth } from "@/hooks/useAuth";
import { getRedirectTarget } from "@/utils/redirect";

// Lazy load pages
const Home = React.lazy(() => import("@/pages/Home"));
const BookList = React.lazy(() => import("@/pages/BookList"));
const BookDetail = React.lazy(() => import("@/pages/BookDetail"));
const Cart = React.lazy(() => import("@/pages/Cart"));
const Checkout = React.lazy(() => import("@/pages/Checkout"));
const History = React.lazy(() => import("@/pages/History"));
const OrderDetail = React.lazy(() => import("@/pages/OrderDetail"));
const Login = React.lazy(() => import("@/pages/Login"));
const Register = React.lazy(() => import("@/pages/Register"));
const Admin = React.lazy(() => import("@/pages/Admin"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  if (isLoading) return <PageLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function AdminRoute({ children }: { children: React.ReactElement }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoading />;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/** Trang login/register: đã đăng nhập thì về trang chủ */
function GuestRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  if (isLoading) return <PageLoading />;
  if (isAuthenticated) return <Navigate to={getRedirectTarget(location)} replace />;
  return children;
}

export default function App() {
  const { fetchMe } = useAuth();

  // Khôi phục phiên đăng nhập khi tải lại trang (xác minh token với server)
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public routes (no layout) */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        {/* Routes with layout */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="books" element={<BookList />} />
          <Route path="books/:id" element={<BookDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="history" element={<History />} />
          {/* Trang đơn hàng cũ nay là tab "Đơn đã mua" trong Lịch sử */}
          <Route path="orders" element={<Navigate to="/history?tab=orders" replace />} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
