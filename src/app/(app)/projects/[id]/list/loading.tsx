import { Skeleton } from "@/components/ui/skeleton";

export default function ListLoading() {
  return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
