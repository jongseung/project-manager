"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MemberWorkloadProps {
  data: { name: string; color: string; done: number; active: number; todo: number; total: number }[];
}

export function MemberWorkload({ data }: MemberWorkloadProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">멤버별 작업량</h3>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="done" stackId="a" fill="#22c55e" name="완료" barSize={20} />
          <Bar dataKey="active" stackId="a" fill="#eab308" name="진행 중" barSize={20} />
          <Bar dataKey="todo" stackId="a" fill="#93c5fd" name="할 일" barSize={20} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
