export default function OrganizerDashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border border-zinc-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-zinc-200 rounded-none"></div>
          <div className="h-6 w-56 bg-zinc-200 rounded-none"></div>
        </div>
        <div className="h-9 w-44 bg-zinc-200 rounded-none"></div>
      </div>

      {/* Main Content Skeleton Grid */}
      <div className="bg-white border border-zinc-200 p-6 space-y-6 shadow-sm">
        <div className="h-4 w-48 bg-zinc-200 rounded-none"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-zinc-100 rounded-none border border-zinc-200"></div>
          <div className="h-32 bg-zinc-100 rounded-none border border-zinc-200"></div>
          <div className="h-32 bg-zinc-100 rounded-none border border-zinc-200"></div>
        </div>
      </div>
    </div>
  );
}
