import { cn } from "@/lib/utils";
import { type TaskPriority } from "@/lib/constants";

const PRIORITY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  urgent: { icon: "▲▲", label: "긴급", color: "text-red-500" },
  high:   { icon: "▲",  label: "높음", color: "text-orange-500" },
  medium: { icon: "■",  label: "보통", color: "text-yellow-500" },
  low:    { icon: "▼",  label: "낮음", color: "text-blue-400" },
};

interface PriorityBadgeProps {
  priority: string;
  size?: "sm" | "default";
  className?: string;
}

export function PriorityBadge({ priority, size = "default", className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        config.color,
        size === "sm" ? "text-[10px]" : "text-[11px]",
        className
      )}
      title={config.label}
    >
      <span className={size === "sm" ? "text-[9px]" : "text-[10px]"}>{config.icon}</span>
      {config.label}
    </span>
  );
}
