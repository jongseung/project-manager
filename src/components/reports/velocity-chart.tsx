"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface VelocityChartProps {
  data: { sprint: string; completed: number }[];
}

export function VelocityChart({ data }: VelocityChartProps) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No sprint data available.</p>;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Velocity (Tasks per Sprint)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
