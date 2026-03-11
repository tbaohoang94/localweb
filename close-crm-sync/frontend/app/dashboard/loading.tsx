import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[220px] bg-sidebar-bg border-r border-sidebar-border p-4 space-y-3 shrink-0">
        <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg bg-white/5" />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-14 border-b bg-card px-6 flex items-center justify-between shrink-0">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Content skeleton */}
        <div className="p-6 space-y-6">
          {/* Filter bar */}
          <div className="flex gap-3">
            <Skeleton className="h-8 w-[140px] rounded-md" />
            <Skeleton className="h-8 w-[140px] rounded-md" />
            <Skeleton className="h-8 w-[100px] rounded-md" />
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-5 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* Chart placeholders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border p-5">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-[280px] w-full rounded" />
            </div>
            <div className="bg-card rounded-lg border p-5">
              <Skeleton className="h-4 w-40 mb-4" />
              <Skeleton className="h-[280px] w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
