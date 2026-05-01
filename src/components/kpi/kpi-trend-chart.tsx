"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface KPITrendChartProps {
  entries: { value: number; recordedAt: Date }[];
  targetValue: number;
  unit: string;
  direction?: string;
}

export function KPITrendChart({ entries, targetValue, unit, direction = "increase" }: KPITrendChartProps) {
  const data = entries.map((e) => ({
    date: format(new Date(e.recordedAt), "MM/dd"),
    value: e.value,
  }));

  // direction에 따라 마지막 값이 목표 대비 좋은/나쁜 방향인지 판단
  const lastValue = data.length > 0 ? data[data.length - 1].value : 0;
  const isGood = direction === "decrease" ? lastValue <= targetValue : lastValue >= targetValue;
  const lineColor = isGood ? "var(--color-chart-2)" : "var(--color-chart-1)"; // green if good, indigo if not

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        아직 데이터가 없습니다. 항목을 추가하면 트렌드를 확인할 수 있습니다.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
          formatter={(value: number) => [`${value}${unit}`, "값"]}
        />
        <ReferenceLine y={targetValue} stroke="var(--color-destructive)" strokeDasharray="5 5" label={{ value: "목표", fontSize: 11 }} />
        <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
