import { Bell, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { db } from "@/lib/db";
import { format, addDays } from "date-fns";
import { formatDate, cn } from "@/lib/utils";

function TaskList({ tasks }: { tasks: { id: string; title: string; dueDate: string | null; priority: string; project: { name: string; color: string }; member: { name: string } | null }[] }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 text-sm">
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: task.project.color }} />
          <span className="flex-1 truncate">{task.title}</span>
          {task.member && <Badge variant="outline" className="text-xs">{task.member.name}</Badge>}
          <span className="text-xs text-muted-foreground">{task.project.name}</span>
          <span className={cn("text-xs font-medium", task.dueDate && task.dueDate < format(new Date(), "yyyy-MM-dd") ? "text-red-500" : "text-muted-foreground")}>
            {formatDate(task.dueDate)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function RemindersPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const threeDaysLater = format(addDays(new Date(), 3), "yyyy-MM-dd");
  const weekLater = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const [overdue, dueSoon, upcoming, recentlyCompleted] = await Promise.all([
    db.task.findMany({
      where: { dueDate: { lt: today }, status: { not: "done" }, archivedAt: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.task.findMany({
      where: { dueDate: { gte: today, lte: threeDaysLater }, status: { not: "done" }, archivedAt: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.task.findMany({
      where: { dueDate: { gt: threeDaysLater, lte: weekLater }, status: { not: "done" }, archivedAt: null },
      include: { project: { select: { name: true, color: true } }, member: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.task.findMany({
      where: { status: "done", completedAt: { gte: new Date(today + "T00:00:00") } },
      include: { project: { select: { name: true } }, member: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
  ]);

  const hasNothing = overdue.length === 0 && dueSoon.length === 0 && upcoming.length === 0;

  return (
    <div>
      <Header title="마감 알림" />
      <div className="p-6 max-w-full space-y-6">
        {hasNothing ? (
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="모든 업무가 정상입니다"
            description="지연되거나 임박한 업무가 없습니다."
          />
        ) : (
          <>
            {overdue.length > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    지연 ({overdue.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskList tasks={overdue} />
                </CardContent>
              </Card>
            )}

            {dueSoon.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    곧 마감 — 3일 이내 ({dueSoon.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskList tasks={dueSoon} />
                </CardContent>
              </Card>
            )}

            {upcoming.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    이번 주 마감 ({upcoming.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskList tasks={upcoming} />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {recentlyCompleted.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                오늘 완료 ({recentlyCompleted.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentlyCompleted.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span className="flex-1 line-through text-muted-foreground">{task.title}</span>
                    <span className="text-xs text-muted-foreground">{task.project.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
