export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] p-6">
      <div className="flex items-center gap-3 text-sm text-stone-500" role="status">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
        กำลังโหลดข้อมูล...
      </div>
    </main>
  );
}
