import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";

export default function LabsLoading() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px] w-full mx-auto">
        <div className="space-y-3 mb-6">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
        <div className="flex gap-2 mb-6 overflow-hidden">
          {[1,2,3,4,5].map(i=> <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />)}
        </div>
        <div className="grid gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </AppShell>
  );
}
