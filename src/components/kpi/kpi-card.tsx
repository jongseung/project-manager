import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  direction: string;
}

export function KPICard({ name, currentValue, targetValue, unit, direction }: KPICardProps) {
  const range = Math.abs(targetValue - (direction === "decrease" ? targetValue * 2 : 0));
  const progress = direction === "decrease"
    ? (targetValue > 0 ? Math.round(Math.max(0, Math.min(100, ((range - currentValue) / (range - targetValue)) * 100))) : 0)
    : (targetValue > 0 ? Math.round(Math.max(0, Math.min(100, (currentValue / targetValue) * 100))) : 0);
  const isGood = direction === "increase" ? currentValue >= targetValue : currentValue <= targetValue;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="text-xs">{name}</CardDescription>
        <div className="flex items-center gap-2">
          <CardTitle className="text-2xl">
            {currentValue}{unit}
          </CardTitle>
          <span className="text-sm text-muted-foreground">/ {targetValue}{unit}</span>
          {direction === "increase" ? (
            <TrendingUp className={cn("h-4 w-4", isGood ? "text-green-500" : "text-red-500")} />
          ) : (
            <TrendingDown className={cn("h-4 w-4", isGood ? "text-green-500" : "text-red-500")} />
          )}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
          <div
            className={cn("h-full rounded-full transition-all", isGood ? "bg-green-500" : "bg-blue-500")}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </CardHeader>
    </Card>
  );
}
