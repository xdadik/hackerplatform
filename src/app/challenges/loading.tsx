import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";

export default function ChallengesLoading() {
  return (
    <AppShell withSidebar>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1280px] w-full mx-auto">
        <div className="space-y-3 mb-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-[70%]" />
        </div>
        <div className="flex gap-4">
          <div className="hidden lg:block w-[220px] space-y-3">
            <Skeleton className="h-48 w-full rounded-[12px]" />
            <Skeleton className="h-32 w-full rounded-[12px]" />
          </div>
          <div className="flex-1 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
