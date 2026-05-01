import { Skeleton } from "@/components/ui/skeleton";

export default function SprintsLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-10 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
