"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  backlog: { label: "백로그", color: "#9ca3af" },
  todo: { label: "할 일", color: "#3b82f6" },
  in_progress: { label: "진행 중", color: "#eab308" },
  in_review: { label: "리뷰", color: "#8b5cf6" },
  done: { label: "완료", color: "#22c55e" },
  cancelled: { label: "취소", color: "#ef4444" },
};

interface StatusDistributionProps {
  data: Record<string, number>;
}

export function StatusDistribution({ data }: StatusDistributionProps) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label ?? status,
      value: count,
      color: STATUS_CONFIG[status]?.color ?? "#6b7280",
    }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">상태별 분포</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
              {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value}건`, ""]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="flex-1">{d.name}</span>
              <span className="font-medium">{d.value}</span>
              <span className="text-muted-foreground w-8 text-right">{Math.round((d.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
