"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BurnupChartProps {
  data: { date: string; completed: number; total: number }[];
}

export function BurnupChart({ data }: BurnupChartProps) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Burnup</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="total" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth={1.5} name="Scope" />
          <Area type="monotone" dataKey="completed" fill="#c7d2fe" stroke="#6366f1" strokeWidth={2} name="Done" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
