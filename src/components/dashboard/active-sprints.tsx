"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { differenceInDays, parseISO, isAfter } from "date-fns";
import Link from "next/link";

interface ActiveSprintsProps {
  sprints: {
    id: string;
    name: string;
    projectId: string;
    projectName: string;
    startDate: string;
    endDate: string;
    total: number;
    done: number;
  }[];
}

export function ActiveSprints({ sprints }: ActiveSprintsProps) {
  if (sprints.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5" />
          진행 중 스프린트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sprints.map((s) => {
          const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
          const endDate = parseISO(s.endDate);
          const daysLeft = Math.max(0, differenceInDays(endDate, new Date()) + 1);
          const isOverdue = isAfter(new Date(), endDate);
          const totalDays = differenceInDays(endDate, parseISO(s.startDate)) + 1;
          const timePct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 100;

          return (
            <Link key={s.id} href={`/projects/${s.projectId}/sprints`} className="block hover:bg-accent/50 rounded-md p-2 -mx-2 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.projectName}</span>
              </div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium w-16 text-right">{s.done}/{s.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs", isOverdue ? "text-red-500 font-medium" : daysLeft <= 3 ? "text-yellow-600" : "text-muted-foreground")}>
                  {isOverdue ? "지연됨" : `${daysLeft}일 남음`}
                </span>
                {timePct > pct + 20 && (
                  <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-300">주의</Badge>
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
