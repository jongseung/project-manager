import { CheckCircle2, Circle } from "lucide-react";

interface DailySummaryProps {
  total: number;
  completed: number;
}

export function DailySummary({ total, completed }: DailySummaryProps) {
  const remaining = total - completed;

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>{completed} completed</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Circle className="h-4 w-4" />
        <span>{remaining} remaining</span>
      </div>
      {total > 0 && (
        <div className="ml-auto text-xs">
          {Math.round((completed / total) * 100)}% done
        </div>
      )}
    </div>
  );
}
