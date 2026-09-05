import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";

export default function ResearchLoading() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1080px] w-full mx-auto">
        <div className="space-y-3 mb-6">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
        <div className="flex gap-2 mb-6">
          {[1,2,3,4].map(i=> <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
        <div className="grid lg:grid-cols-[1.7fr_0.9fr] gap-6">
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-[12px]" />
            <Skeleton className="h-32 w-full rounded-[12px]" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
