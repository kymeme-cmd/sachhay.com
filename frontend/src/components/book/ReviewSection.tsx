// ============================================================
// Component: ReviewSection - Đánh giá của một cuốn sách
// Tổng quan sao, form viết/sửa (chỉ người đã nhận hàng), danh sách đánh giá
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Trash2 } from "lucide-react";
import { reviewAPI } from "@/api/client";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";
import { formatDate } from "@/utils/formatCurrency";
import type { Review, ReviewSummary } from "@/types";
import { StarRating } from "./StarRating";
import { Button } from "@/components/common/Button";

interface ReviewSectionProps {
  productId: string;
  /** Báo cho trang cha khi điểm trung bình thay đổi (sau khi viết/xóa) */
  onSummaryChange?: (summary: ReviewSummary) => void;
}

export function ReviewSection({ productId, onSummaryChange }: ReviewSectionProps) {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [canReview, setCanReview] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async (p: number) => {
    const res = await reviewAPI.list(productId, p);
    const data = res.data as { summary: ReviewSummary; reviews: Review[] };
    setSummary(data.summary);
    onSummaryChange?.(data.summary);
    setReviews((prev) => (p === 1 ? data.reviews : [...prev, ...data.reviews]));
    setPage(p);
    setTotalPages(res.meta?.total_pages ?? 1);
  }, [productId, onSummaryChange]);

  useEffect(() => {
    setLoading(true);
    loadReviews(1).catch(() => setSummary({ average: null, count: 0, distribution: {} })).finally(() => setLoading(false));
  }, [loadReviews]);

  useEffect(() => {
    if (!isAuthenticated) { setCanReview(false); setMyReview(null); return; }
    reviewAPI.mine(productId).then((res) => {
      const data = res.data as { can_review: boolean; review: Review | null };
      setCanReview(data.can_review);
      setMyReview(data.review);
    }).catch(() => {});
  }, [productId, isAuthenticated]);

  const startEdit = () => {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    if (rating < 1) { toast.error("Vui lòng chọn số sao"); return; }
    setSaving(true);
    try {
      const res = await reviewAPI.save(productId, { rating, comment: comment.trim() || undefined });
      setMyReview(res.data as Review);
      setEditing(false);
      toast.success(myReview ? "Đã cập nhật đánh giá" : "Cảm ơn bạn đã đánh giá!");
      await loadReviews(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMine = async () => {
    if (!window.confirm("Xóa đánh giá của bạn?")) return;
    try {
      await reviewAPI.remove(productId);
      setMyReview(null);
      setEditing(false);
      toast.success("Đã xóa đánh giá");
      await loadReviews(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa đánh giá");
    }
  };

  const handleAdminDelete = async (review: Review) => {
    if (!window.confirm(`Xóa đánh giá của "${review.user_name}"?`)) return;
    try {
      await reviewAPI.adminRemove(productId, review.id);
      if (review.user_id === user?.id) setMyReview(null);
      toast.success("Đã xóa đánh giá");
      await loadReviews(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể xóa đánh giá");
    }
  };

  const count = summary?.count ?? 0;
  // Đánh giá của mình đã hiện ở ô "Đánh giá của bạn" → không lặp lại trong danh sách
  const others = myReview ? reviews.filter((r) => r.id !== myReview.id) : reviews;

  return (
    <section id="reviews" className="card p-6 scroll-mt-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Đánh giá từ bạn đọc</h2>

      {loading ? (
        <p className="text-gray-500">Đang tải đánh giá...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Tổng quan */}
          <div>
            {count > 0 ? (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-gray-800">{summary!.average?.toFixed(1)}</span>
                  <span className="text-gray-500 mb-1">/ 5</span>
                </div>
                <StarRating value={summary!.average ?? 0} size={20} />
                <p className="text-sm text-gray-500 mt-1">{count} đánh giá</p>
                <div className="mt-4 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const n = summary!.distribution[star] ?? 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-8 text-gray-600">{star} ★</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${(n / count) * 100}%` }} />
                        </div>
                        <span className="w-6 text-right text-gray-500">{n}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-gray-500">Chưa có đánh giá nào cho cuốn sách này.</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Viết / sửa đánh giá */}
            {!isAuthenticated ? (
              <p className="text-sm text-gray-600 bg-gray-100 rounded-xl p-4">
                <Link to="/login" state={{ from: `/books/${productId}#reviews` }} className="font-semibold text-primary hover:underline">Đăng nhập</Link>
                {" "}để đánh giá sách bạn đã mua.
              </p>
            ) : editing ? (
              <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="font-medium text-gray-800">{myReview ? "Sửa đánh giá của bạn" : "Viết đánh giá"}</p>
                <StarRating value={rating} onChange={setRating} size={28} />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Bạn thấy cuốn sách này thế nào? (không bắt buộc)"
                  className="input-field resize-y"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} isLoading={saving} size="sm">Gửi đánh giá</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
                </div>
              </div>
            ) : myReview ? (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm font-medium text-primary mb-1">Đánh giá của bạn</p>
                <StarRating value={myReview.rating} />
                {myReview.comment && <p className="text-gray-700 mt-2 whitespace-pre-line">{myReview.comment}</p>}
                <div className="flex gap-4 mt-3 text-sm">
                  <button type="button" onClick={startEdit} className="font-medium text-primary hover:underline">Sửa</button>
                  <button type="button" onClick={handleDeleteMine} className="font-medium text-red-600 hover:underline">Xóa</button>
                </div>
              </div>
            ) : canReview ? (
              <Button onClick={startEdit} className="inline-flex items-center gap-2">
                <MessageSquare size={18} /> Viết đánh giá
              </Button>
            ) : (
              <p className="text-sm text-gray-600 bg-gray-100 rounded-xl p-4">
                Bạn có thể đánh giá sau khi mua và <strong>nhận được</strong> cuốn sách này (đơn hàng ở trạng thái "Đã giao").
              </p>
            )}

            {/* Danh sách đánh giá */}
            {others.length > 0 && (
              <ul className="divide-y divide-gray-200">
                {others.map((r) => (
                  <li key={r.id} className="py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center font-semibold">
                          {r.user_name?.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {r.user_name}
                            <span className="ml-2 badge bg-green-100 text-green-700">Đã mua hàng</span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <StarRating value={r.rating} size={14} />
                            <span>{formatDate(r.updated_at)}{r.updated_at - r.created_at > 60 ? " (đã sửa)" : ""}</span>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button type="button" onClick={() => handleAdminDelete(r)} className="p-2 text-gray-400 hover:text-red-600" aria-label="Xóa đánh giá" title="Xóa đánh giá (quản trị)">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {r.comment && <p className="text-gray-700 mt-2 whitespace-pre-line">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}

            {page < totalPages && (
              <Button variant="outline" size="sm" onClick={() => loadReviews(page + 1)}>Xem thêm đánh giá</Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
