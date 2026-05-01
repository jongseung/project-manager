import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
    </div>
  );
}
