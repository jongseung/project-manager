import { Trash2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { EmptyState } from "@/components/shared/empty-state";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/session";
import { formatRelativeDate } from "@/lib/utils";
import { TrashRow } from "./trash-row";

const PURGE_AFTER_DAYS = 30;

export default async function TrashPage() {
  const ctx = await requireOrganization();
  const orgId = ctx.organization.id;

  const [workspaces, projects, goals, tasks, epics, stories, sprints, milestones] = await Promise.all([
    db.workspace.findMany({
      where: { organizationId: orgId, archivedAt: { not: null } },
      select: { id: true, name: true, archivedAt: true },
      orderBy: { archivedAt: "desc" },
    }),
    db.project.findMany({
      where: { archivedAt: { not: null }, workspace: { organizationId: orgId } },
      select: { id: true, name: true, archivedAt: true, workspace: { select: { name: true } } },
      orderBy: { archivedAt: "desc" },
    }),
    db.goal.findMany({
      where: { archivedAt: { not: null }, workspace: { organizationId: orgId } },
      select: { id: true, title: true, archivedAt: true, workspace: { select: { name: true } } },
      orderBy: { archivedAt: "desc" },
    }),
    db.task.findMany({
      where: { archivedAt: { not: null }, project: { workspace: { organizationId: orgId } } },
      select: { id: true, title: true, archivedAt: true, project: { select: { name: true } } },
      orderBy: { archivedAt: "desc" },
      take: 100,
    }),
    db.epic.findMany({
      where: { archivedAt: { not: null }, project: { workspace: { organizationId: orgId } } },
      select: { id: true, name: true, archivedAt: true, project: { select: { name: true } } },
      orderBy: { archivedAt: "desc" },
    }),
    db.story.findMany({
      where: { archivedAt: { not: null }, project: { workspace: { organizationId: orgId } } },
      select: { id: true, title: true, archivedAt: true, project: { select: { name: true } } },
      orderBy: { archivedAt: "desc" },
    }),
    db.sprint.findMany({
      where: { archivedAt: { not: null }, project: { workspace: { organizationId: orgId } } },
      select: { id: true, name: true, archivedAt: true, project: { select: { name: true } } },
      orderBy: { archivedAt: "desc" },
    }),
    db.milestone.findMany({
      where: { archivedAt: { not: null }, project: { workspace: { organizationId: orgId } } },
      select: { id: true, name: true, archivedAt: true, project: { select: { name: true } } },
      orderBy: { archivedAt: "desc" },
    }),
  ]);

  const total = workspaces.length + projects.length + goals.length + tasks.length + epics.length + stories.length + sprints.length + milestones.length;

  return (
    <div>
      <Header title="휴지통" />
      <div className="p-6 max-w-full space-y-6">
        <p className="text-sm text-muted-foreground">
          삭제한 항목은 여기에 <b>{PURGE_AFTER_DAYS}일간</b> 보관된 후 영구 삭제됩니다. 복원하거나 지금 즉시 영구 삭제할 수 있습니다.
        </p>

        {total === 0 ? (
          <EmptyState
            icon={<Trash2 className="h-12 w-12" />}
            title="휴지통이 비어 있습니다"
            description="삭제한 워크스페이스, 프로젝트, 목표, 태스크가 여기 표시됩니다."
          />
        ) : (
          <div className="space-y-6">
            {workspaces.length > 0 && (
              <Section title={`워크스페이스 (${workspaces.length})`}>
                {workspaces.map((w) => (
                  <TrashRow
                    key={w.id}
                    id={w.id}
                    kind="workspace"
                    title={w.name}
                    subtitle={null}
                    archivedAgo={w.archivedAt ? formatRelativeDate(w.archivedAt) : "-"}
                  />
                ))}
              </Section>
            )}
            {projects.length > 0 && (
              <Section title={`프로젝트 (${projects.length})`}>
                {projects.map((p) => (
                  <TrashRow
                    key={p.id}
                    id={p.id}
                    kind="project"
                    title={p.name}
                    subtitle={p.workspace?.name ?? null}
                    archivedAgo={p.archivedAt ? formatRelativeDate(p.archivedAt) : "-"}
                  />
                ))}
              </Section>
            )}
            {goals.length > 0 && (
              <Section title={`목표 (${goals.length})`}>
                {goals.map((g) => (
                  <TrashRow
                    key={g.id}
                    id={g.id}
                    kind="goal"
                    title={g.title}
                    subtitle={g.workspace?.name ?? null}
                    archivedAgo={g.archivedAt ? formatRelativeDate(g.archivedAt) : "-"}
                  />
                ))}
              </Section>
            )}
            {epics.length > 0 && (
              <Section title={`에픽 (${epics.length})`}>
                {epics.map((e) => (
                  <TrashRow key={e.id} id={e.id} kind="epic" title={e.name} subtitle={e.project?.name ?? null}
                    archivedAgo={e.archivedAt ? formatRelativeDate(e.archivedAt) : "-"} />
                ))}
              </Section>
            )}
            {stories.length > 0 && (
              <Section title={`스토리 (${stories.length})`}>
                {stories.map((s) => (
                  <TrashRow key={s.id} id={s.id} kind="story" title={s.title} subtitle={s.project?.name ?? null}
                    archivedAgo={s.archivedAt ? formatRelativeDate(s.archivedAt) : "-"} />
                ))}
              </Section>
            )}
            {sprints.length > 0 && (
              <Section title={`스프린트 (${sprints.length})`}>
                {sprints.map((s) => (
                  <TrashRow key={s.id} id={s.id} kind="sprint" title={s.name} subtitle={s.project?.name ?? null}
                    archivedAgo={s.archivedAt ? formatRelativeDate(s.archivedAt) : "-"} />
                ))}
              </Section>
            )}
            {milestones.length > 0 && (
              <Section title={`마일스톤 (${milestones.length})`}>
                {milestones.map((m) => (
                  <TrashRow key={m.id} id={m.id} kind="milestone" title={m.name} subtitle={m.project?.name ?? null}
                    archivedAgo={m.archivedAt ? formatRelativeDate(m.archivedAt) : "-"} />
                ))}
              </Section>
            )}
            {tasks.length > 0 && (
              <Section title={`태스크 (${tasks.length}, 최근 100개)`}>
                {tasks.map((t) => (
                  <TrashRow
                    key={t.id}
                    id={t.id}
                    kind="task"
                    title={t.title}
                    subtitle={t.project?.name ?? null}
                    archivedAgo={t.archivedAt ? formatRelativeDate(t.archivedAt) : "-"}
                  />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="rounded-lg border divide-y">{children}</div>
    </section>
  );
}
