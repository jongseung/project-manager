"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberWorkload {
  id: string;
  name: string;
  color: string;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  overdue: number;
}

interface MemberWorkloadProps {
  members: MemberWorkload[];
}

export function MemberWorkload({ members }: MemberWorkloadProps) {
  if (members.length === 0) return null;

  const maxTotal = Math.max(...members.map((m) => m.todo + m.inProgress + m.inReview + m.overdue), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5" />
          멤버별 업무 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => {
          const active = member.todo + member.inProgress + member.inReview + member.overdue;
          const barWidth = (active / maxTotal) * 100;

          return (
            <div key={member.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: member.color }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium">{member.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {member.overdue > 0 && <span className="text-red-500 font-medium">{member.overdue} 지연</span>}
                  <span>{active} 활성</span>
                  <span className="text-green-600">{member.done} 완료</span>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="h-2 rounded-full bg-muted overflow-hidden flex" style={{ width: `${Math.max(barWidth, 8)}%` }}>
                {member.overdue > 0 && <div className="h-full bg-red-500" style={{ width: `${active > 0 ? (member.overdue / active) * 100 : 0}%` }} />}
                {member.inProgress > 0 && <div className="h-full bg-yellow-500" style={{ width: `${active > 0 ? (member.inProgress / active) * 100 : 0}%` }} />}
                {member.inReview > 0 && <div className="h-full bg-purple-500" style={{ width: `${active > 0 ? (member.inReview / active) * 100 : 0}%` }} />}
                {member.todo > 0 && <div className="h-full bg-blue-400" style={{ width: `${active > 0 ? (member.todo / active) * 100 : 0}%` }} />}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />지연</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" />진행</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" />검토</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" />할 일</span>
        </div>
      </CardContent>
    </Card>
  );
}
