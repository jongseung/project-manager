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
                ? "bg-muted text-muted-foreground line-through"
                : "bg-blue-500/12 text-blue-700 dark:text-blue-400"
            )}
          >
            {task.title}
          </div>
        ))}
        {tasks.length > 3 && (
          <span className="text-xs text-muted-foreground px-1">+{tasks.length - 3}개</span>
        )}
      </div>
    </div>
  );
}
