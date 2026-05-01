"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "긴급", color: "#ef4444" },
  high: { label: "높음", color: "#f97316" },
  medium: { label: "보통", color: "#eab308" },
  low: { label: "낮음", color: "#3b82f6" },
  none: { label: "없음", color: "#9ca3af" },
};

const PRIORITY_ORDER = ["urgent", "high", "medium", "low", "none"];

interface PriorityDistributionProps {
  data: Record<string, number>;
}

export function PriorityDistribution({ data }: PriorityDistributionProps) {
  const chartData = PRIORITY_ORDER
    .filter((p) => (data[p] ?? 0) > 0)
    .map((p) => ({
      name: PRIORITY_CONFIG[p]?.label ?? p,
      value: data[p] ?? 0,
      color: PRIORITY_CONFIG[p]?.color ?? "#6b7280",
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">우선순위별 분포</h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={40} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`${value}건`, ""]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
