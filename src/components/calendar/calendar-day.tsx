import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@prisma/client";

interface CalendarDayProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function CalendarDay({ date, tasks, isCurrentMonth, isToday }: CalendarDayProps) {
  return (
    <div
      className={cn(
        "min-h-[100px] bg-background p-1.5",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
          isToday && "bg-primary text-primary-foreground font-bold"
        )}
      >
        {format(date, "d")}
      </span>
      <div className="mt-1 space-y-0.5">
        {tasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className={cn(
              "truncate rounded px-1 py-0.5 text-xs",
              task.status === "done"
                ? "bg-green-100 text-green-700 line-through"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {task.title}
          </div>
        ))}
        {tasks.length > 3 && (
          <span className="text-xs text-muted-foreground px-1">+{tasks.length - 3} more</span>
        )}
      </div>
    </div>
  );
}
