import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDay,
  setDate,
  startOfDay,
} from "date-fns";

export function calculateNextRun(
  from: Date,
  frequency: string,
  interval: number,
  daysOfWeek: number[],
  dayOfMonth: number | null
): Date {
  const base = startOfDay(from);

  switch (frequency) {
    case "daily":
      return addDays(base, interval);

    case "weekly": {
      if (daysOfWeek.length === 0) return addWeeks(base, interval);
      const currentDay = base.getDay();
      const sorted = [...daysOfWeek].sort((a, b) => a - b);
      const nextDay = sorted.find((d) => d > currentDay);
      if (nextDay !== undefined) {
        return setDay(base, nextDay, { weekStartsOn: 0 });
      }
      return setDay(addWeeks(base, interval), sorted[0], { weekStartsOn: 0 });
    }

    case "biweekly":
      return addWeeks(base, 2 * interval);

    case "monthly": {
      const next = addMonths(base, interval);
      return dayOfMonth ? setDate(next, Math.min(dayOfMonth, 28)) : next;
    }

    case "quarterly":
      return addMonths(base, 3 * interval);

    case "yearly":
      return addYears(base, interval);

    default:
      return addDays(base, interval);
  }
}
