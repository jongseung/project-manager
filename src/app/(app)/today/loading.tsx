import { Skeleton } from "@/components/ui/skeleton";

export default function TodayLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <Skeleton className="h-9 w-full" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-1 px-2 pb-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
