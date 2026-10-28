// Page: Login - Dang nhap

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getRedirectTarget } from "@/utils/redirect";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email, password });
      // Quay lại trang đang xem trước khi bị yêu cầu đăng nhập (ví dụ /checkout)
      navigate(getRedirectTarget(location), { replace: true });
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">B</div>
            <span className="text-xl font-bold text-primary tracking-tight">Sách Hay</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Đăng nhập</h2>
          <p className="text-gray-600">Chào mừng quay lại!</p>
        </div>

        {error && <Alert type="error" title="Lỗi" description={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail size={18} className="text-gray-400" />}
          />
          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock size={18} className="text-gray-400" />}
          />
          <Button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-secondary" isLoading={isLoading}>
            Đăng nhập <ArrowRight size={18} />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">Đăng ký tài khoản</Link>
        </p>
      </div>
    </div>
  );
}