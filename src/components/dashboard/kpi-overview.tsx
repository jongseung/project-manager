"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface KPIOverviewProps {
  objectives: {
    id: string;
    title: string;
    projectId: string;
    projectName: string;
    keyResults: {
      id: string;
      title: string;
      currentValue: number;
      targetValue: number;
      startValue: number;
      unit: string;
      direction: string;
    }[];
  }[];
}

export function KPIOverview({ objectives }: KPIOverviewProps) {
  if (objectives.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5" />
          OKR 진행 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {objectives.map((obj) => {
          const totalProgress = obj.keyResults.length > 0
            ? Math.round(obj.keyResults.reduce((sum, kr) => {
                const range = Math.abs(kr.targetValue - kr.startValue);
                if (range === 0) return sum + 100;
                const moved = kr.direction === "decrease"
                  ? kr.startValue - kr.currentValue
                  : kr.currentValue - kr.startValue;
                return sum + Math.max(0, Math.min(100, (moved / range) * 100));
              }, 0) / obj.keyResults.length)
            : 0;

          return (
            <Link key={obj.id} href={`/projects/${obj.projectId}/okr`} className="block">
              <div className="space-y-1.5 hover:bg-accent/50 rounded p-2 -mx-2 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{obj.title}</span>
                  <span className="text-xs text-muted-foreground">{obj.projectName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${totalProgress >= 80 ? "bg-green-500" : totalProgress >= 40 ? "bg-blue-500" : "bg-yellow-500"}`}
                      style={{ width: `${totalProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{totalProgress}%</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {obj.keyResults.map((kr) => {
                    const Icon = kr.direction === "decrease" ? TrendingDown : TrendingUp;
                    return (
                      <span key={kr.id} className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {kr.currentValue}{kr.unit}/{kr.targetValue}{kr.unit}
                      </span>
                    );
                  })}
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
