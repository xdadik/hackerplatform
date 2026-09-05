import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";

export default function ToolsLoading() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px] w-full mx-auto">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 max-w-[640px] space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-[9px]" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </div>
            <Skeleton className="w-full sm:w-[320px] h-9 rounded-[8px]" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-24 rounded-[8px]" />
        </div>

        {/* Cards grid */}
        <div className="grid lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
