import { Skeleton } from "@/components/ui/skeleton";

export default function RemindersLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}
