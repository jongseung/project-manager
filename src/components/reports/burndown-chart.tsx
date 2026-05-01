"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface BurndownChartProps {
  data: { date: string; remaining: number; ideal: number }[];
}

export function BurndownChart({ data }: BurndownChartProps) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No sprint data available.</p>;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Sprint Burndown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="ideal" stroke="#d4d4d8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Ideal" />
          <Line type="monotone" dataKey="remaining" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} name="Remaining" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
