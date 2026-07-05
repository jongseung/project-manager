import { Skeleton } from "@/components/ui/skeleton";

export default function GoalsLoading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
