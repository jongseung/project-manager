import { FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceActions } from "./workspace-actions";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";

export default async function WorkspacesPage() {
  const ctx = await requireOrganization();
  const workspacesRaw = await db.workspace.findMany({
    where: {
      archivedAt: null,
      ...(ctx?.organization.id ? { organizationId: ctx.organization.id } : {}),
    },
    include: {
      projects: {
        where: { archivedAt: null },
        orderBy: { name: "asc" },
        include: {
          tasks: { where: { archivedAt: null, parentTaskId: null }, select: { status: true, dueDate: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const workspaces = workspacesRaw.map((ws) => {
    const tasks = ws.projects.flatMap((p) => p.tasks);
    const stats = {
      activeProjects: ws.projects.filter((p) => p.status === "active").length,
      total: tasks.length,
      done: tasks.filter((t) => t.status === "done").length,
      inReview: tasks.filter((t) => t.status === "in_review").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      todo: tasks.filter((t) => t.status === "todo" || t.status === "backlog").length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "done" && t.status !== "cancelled").length,
    };
    return { ...ws, projects: ws.projects.map(({ tasks: _t, ...p }) => p), stats };
  });

  return (
    <div>
      <Header title="워크스페이스">
        <WorkspaceActions />
      </Header>
      <div className="p-6 max-w-full">
        {workspaces.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-12 w-12" />}
            title="첫 번째 워크스페이스를 만드세요"
            description="워크스페이스로 관련 프로젝트를 함께 관리하세요."
            action={<WorkspaceActions />}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} stats={ws.stats} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
