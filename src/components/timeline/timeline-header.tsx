"use client";

import { format, eachDayOfInterval, differenceInDays, isToday, isMonday, getDate } from "date-fns";

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  offsetDays: number;
}

export function TimelineHeader({ startDate, endDate, dayWidth }: TimelineHeaderProps) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalWidth = days.length * dayWidth;

  // Group days by month for top row
  const months: { label: string; days: number }[] = [];
  let currentMonth = "";
  days.forEach((day) => {
    const label = format(day, "yyyy MMM");
    if (label !== currentMonth) {
      months.push({ label: format(day, "MMM yyyy"), days: 1 });
      currentMonth = label;
    } else {
      months[months.length - 1].days++;
    }
  });

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      {/* Month row */}
      <div className="flex h-6 border-b" style={{ width: totalWidth }}>
        {months.map((m, i) => (
          <div key={i} className="text-xs font-medium text-muted-foreground px-1 border-r flex items-center" style={{ width: m.days * dayWidth }}>
            {m.label}
          </div>
        ))}
      </div>
      {/* Day row */}
      <div className="flex h-5" style={{ width: totalWidth }}>
        {days.map((day) => {
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const todayMark = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`text-[10px] text-center border-r flex items-center justify-center shrink-0 ${
                todayMark ? "bg-primary/10 text-primary font-bold" :
                isWeekend ? "bg-muted/40 text-muted-foreground/50" :
                isMonday(day) ? "text-muted-foreground font-medium" :
                "text-muted-foreground/70"
              }`}
              style={{ width: dayWidth }}
            >
              {getDate(day)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
