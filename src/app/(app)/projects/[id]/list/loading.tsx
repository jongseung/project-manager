import { Skeleton } from "@/components/ui/skeleton";

export default function ListLoading() {
  return (
    <div className="p-6">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="ml-auto h-9 w-24" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="ml-auto h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
