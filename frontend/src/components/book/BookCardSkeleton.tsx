// ============================================================
// Component: BookCardSkeleton - Khung chờ có cùng kích thước với BookCard
// ============================================================

export function BookCardSkeleton() {
  return (
    <div className="card flex flex-col h-full animate-pulse" aria-hidden="true">
      <div className="aspect-[2/3] bg-gray-200" />
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        <div className="h-4 bg-gray-200 rounded w-11/12" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-1" />
        <div className="mt-auto pt-3 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-9 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6" role="status" aria-label="Đang tải danh sách sách">
      {Array.from({ length: count }, (_, i) => <BookCardSkeleton key={i} />)}
    </div>
  );
}
