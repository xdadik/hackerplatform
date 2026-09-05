import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center px-4 sm:px-6">
        <Skeleton className="h-6 w-24" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20 rounded-[8px]" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-[40%]" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
