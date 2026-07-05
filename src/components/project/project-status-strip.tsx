"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface Summary {
  total: number;
  done: number;
  inReview: number;
  inProgress: number;
  todo: number;
  overdue: number;
}

/**
 * Always-visible project pulse — progress %, status distribution and overdue —
 * so the project's status is readable from every tab, not just the 흐름 view.
 */
export function ProjectStatusStrip({ projectId }: { projectId: string }) {
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/summary`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setS(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  if (!s || s.total === 0) return null;
  const pct = Math.round((s.done / s.total) * 100);
  const seg = (n: number) => `${(n / s.total) * 100}%`;

  return (
    <div className="ml-auto flex items-center gap-2.5 text-xs" title={`완료 ${s.done} · 검토 ${s.inReview} · 진행 ${s.inProgress} · 대기 ${s.todo}`}>
      <span className="font-semibold tabular-nums">{pct}%</span>
      <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:flex">
        <div className="h-full bg-emerald-500" style={{ width: seg(s.done) }} />
        <div className="h-full bg-violet-400" style={{ width: seg(s.inReview) }} />
        <div className="h-full bg-amber-400" style={{ width: seg(s.inProgress) }} />
        <div className="h-full bg-slate-400" style={{ width: seg(s.todo) }} />
      </div>
      <span className="hidden tabular-nums text-muted-foreground md:inline">{s.done}/{s.total}</span>
      {s.overdue > 0 && (
        <span className="flex items-center gap-0.5 font-medium text-red-500">
          <AlertTriangle className="h-3 w-3" />
          {s.overdue}
        </span>
      )}
    </div>
  );
}
