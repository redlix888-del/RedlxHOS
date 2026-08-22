export default function TeamDashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6 animate-pulse">
      <div className="bg-white border border-zinc-200 p-5 flex justify-between items-center shadow-sm">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-zinc-200 rounded-none"></div>
          <div className="h-6 w-48 bg-zinc-200 rounded-none"></div>
        </div>
        <div className="h-8 w-24 bg-zinc-200 rounded-none"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-white border border-zinc-200 p-6 shadow-sm space-y-4">
          <div className="h-4 w-32 bg-zinc-200"></div>
          <div className="h-16 bg-zinc-100"></div>
        </div>
        <div className="h-48 bg-white border border-zinc-200 p-6 shadow-sm space-y-4">
          <div className="h-4 w-32 bg-zinc-200"></div>
          <div className="h-16 bg-zinc-100"></div>
        </div>
      </div>
    </div>
  );
}
