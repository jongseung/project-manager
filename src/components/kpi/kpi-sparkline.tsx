"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface KPISparklineProps {
  entries: { value: number; recordedAt: Date }[];
  direction?: string;
  targetValue: number;
}

export function KPISparkline({ entries, direction = "increase", targetValue }: KPISparklineProps) {
  if (entries.length < 2) return null;

  const data = entries.map((e) => ({ value: e.value }));
  const lastValue = data[data.length - 1].value;
  const isGood = direction === "decrease" ? lastValue <= targetValue : lastValue >= targetValue;
  const color = isGood ? "#10b981" : "#6366f1";

  return (
    <div className="h-10 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
