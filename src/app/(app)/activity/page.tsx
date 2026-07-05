import { Activity, CheckCircle2, Edit3, Plus, Trash2, RefreshCw, ArchiveRestore, Archive, Shuffle } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { EmptyState } from "@/components/shared/empty-state";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/session";
import { format, startOfDay } from "date-fns";
import { formatRelativeDate } from "@/lib/utils";

const PAGE_SIZE = 100;

const ACTION_ICONS: Record<string, { icon: typeof Plus; tone: string; label: string }> = {
  created: { icon: Plus, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", label: "생성" },
  updated: { icon: Edit3, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10", label: "수정" },
  deleted: { icon: Trash2, tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10", label: "삭제" },
  purged: { icon: Trash2, tone: "text-red-600 dark:text-red-400 bg-red-500/10", label: "영구 삭제" },
  restored: { icon: ArchiveRestore, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", label: "복원" },
  archived: { icon: Archive, tone: "text-muted-foreground bg-muted", label: "보관" },
  status_changed: { icon: RefreshCw, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10", label: "상태 변경" },
  completed: { icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", label: "완료" },
  moved: { icon: Shuffle, tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10", label: "이동" },
};

const ENTITY_LABELS: Record<string, string> = {
  task: "태스크",
  project: "프로젝트",
  epic: "에픽",
  goal: "목표",
  milestone: "마일스톤",
  sprint: "스프린트",
  kpi: "KPI",
  recurring: "반복",
  story: "스토리",
  objective: "OKR",
};

function parseDetails(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
}

function describeEvent(entityType: string, action: string, details: Record<string, unknown> | null): string {
  const label = ENTITY_LABELS[entityType] ?? entityType;
  const actionLabel = ACTION_ICONS[action]?.label ?? action;
  const name = (details?.title as string) ?? (details?.name as string) ?? null;
  if (action === "status_changed" && details?.from && details?.to) {
    return `${label} 상태가 "${details.from}" → "${details.to}"로 변경됨`;
  }
  if (name) return `${label} "${name}" ${actionLabel}`;
  return `${label} ${actionLabel}`;
}

function entityHref(entityType: string, entityId: string): string | null {
  // Not all entities have dedicated pages; link where we can.
  switch (entityType) {
    case "task": return `/api/tasks/${entityId}`; // fallback — tasks typically open via panel
    case "project": return `/projects/${entityId}/board`;
    case "goal": return `/goals/${entityId}`;
    case "epic":
    case "story":
    case "sprint":
    case "milestone":
    case "objective":
    case "kpi":
    case "recurring":
    default:
      return null;
  }
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const ctx = await requireOrganization();
  const params = await searchParams;
  const typeFilter = params.type;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const where = {
    organizationId: ctx.organization.id,
    ...(typeFilter && typeFilter !== "all" ? { entityType: typeFilter } : {}),
  };

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.activityLog.count({ where }),
  ]);

  // Group by day
  const groups = new Map<string, typeof logs>();
  for (const log of logs) {
    const day = format(startOfDay(log.occurredAt), "yyyy-MM-dd");
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(log);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterTypes = ["all", ...Object.keys(ENTITY_LABELS)];

  return (
    <div>
      <Header title="활동 로그" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {filterTypes.map((t) => {
            const active = (typeFilter ?? "all") === t;
            const href = t === "all" ? "/activity" : `/activity?type=${t}`;
            return (
              <Link
                key={t}
                href={href}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
                }`}
              >
                {t === "all" ? "전체" : ENTITY_LABELS[t]}
              </Link>
            );
          })}
        </div>

        {/* Feed */}
        {logs.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-12 w-12" />}
            title="아직 활동이 없습니다"
            description={typeFilter && typeFilter !== "all" ? "다른 필터를 시도해 보세요." : "태스크를 만들고 움직여 보면 여기에 기록됩니다."}
          />
        ) : (
          <div className="space-y-8">
            {[...groups.entries()].map(([day, entries]) => (
              <section key={day} className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {format(new Date(day), "yyyy년 M월 d일")}
                </h2>
                <div className="space-y-2">
                  {entries.map((log) => {
                    const details = parseDetails(log.details);
                    const icon = ACTION_ICONS[log.action];
                    const Icon = icon?.icon ?? Activity;
                    const description = describeEvent(log.entityType, log.action, details);
                    const href = entityHref(log.entityType, log.entityId);

                    const content = (
                      <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/40 transition-colors">
                        <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${icon?.tone ?? "bg-accent"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeDate(log.occurredAt)} · {format(log.occurredAt, "HH:mm:ss")}
                          </p>
                        </div>
                      </div>
                    );

                    return href ? (
                      <Link key={log.id} href={href} className="block">
                        {content}
                      </Link>
                    ) : (
                      <div key={log.id}>{content}</div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {page > 1 && (
              <Link
                href={`/activity?${new URLSearchParams({ ...(typeFilter ? { type: typeFilter } : {}), page: String(page - 1) }).toString()}`}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
              >
                이전
              </Link>
            )}
            <span className="px-3 py-1.5 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/activity?${new URLSearchParams({ ...(typeFilter ? { type: typeFilter } : {}), page: String(page + 1) }).toString()}`}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
              >
                다음
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
