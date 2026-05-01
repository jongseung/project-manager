"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface WeeklyTrendProps {
  data: { week: string; created: number; completed: number }[];
}

export function WeeklyTrend({ data }: WeeklyTrendProps) {
  const hasData = data.some((d) => d.created > 0 || d.completed > 0);
  if (!hasData) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">주간 추이 (최근 8주)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="created" fill="#93c5fd" radius={[4, 4, 0, 0]} name="생성" />
          <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="완료" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
