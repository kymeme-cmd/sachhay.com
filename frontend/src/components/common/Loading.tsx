// Component: Loading - Trang thai tai

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

export function Loading({ fullScreen = false, text = "Đang tải..." }: LoadingProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-3 text-gray-600",
        fullScreen ? "min-h-[60vh]" : "",
      ].join(" ").trim()}
    >
      <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading fullScreen text="Đang tải trang..." />
    </div>
  );
}