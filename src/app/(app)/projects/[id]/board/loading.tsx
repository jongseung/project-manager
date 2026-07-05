import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <div className="p-6">
      <div className="flex gap-3 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0">
            <div className="mb-1 flex items-center gap-2 px-1.5 py-1">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2 rounded-xl bg-muted/30 p-1.5">
              {Array.from({ length: i === 0 ? 2 : 3 }).map((_, j) => (
                <Skeleton key={j} className="h-[72px] w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
