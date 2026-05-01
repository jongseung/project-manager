"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CompletionTrendProps {
  data: { week: string; completed: number }[];
}

export function CompletionTrend({ data }: CompletionTrendProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">완료 데이터가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">주간 완료 현황</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="completed" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
