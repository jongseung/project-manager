"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { differenceInDays, parseISO, addDays, format } from "date-fns";

interface BurndownChartProps {
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedByDay: { date: string; remaining: number }[];
}

export function BurndownChart({ startDate, endDate, totalTasks, completedByDay }: BurndownChartProps) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const totalDays = differenceInDays(end, start) + 1;

  const data = [];
  for (let i = 0; i <= totalDays; i++) {
    const date = format(addDays(start, i), "MM/dd");
    const ideal = Math.round(totalTasks * (1 - i / totalDays));
    const actual = completedByDay.find(d => d.date === format(addDays(start, i), "yyyy-MM-dd"));
    data.push({ date, ideal, actual: actual?.remaining ?? (i === 0 ? totalTasks : undefined) });
  }

  if (totalTasks === 0) return <p className="text-xs text-muted-foreground text-center py-4">태스크가 없습니다</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
        <Line type="monotone" dataKey="ideal" stroke="var(--color-muted-foreground)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="목표" />
        <Line type="monotone" dataKey="actual" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 2 }} name="실제" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
