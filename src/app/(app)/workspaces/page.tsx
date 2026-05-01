import { Plus, FolderOpen } from "lucide-react";
import { Header } from "@/components/layout/header";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceActions } from "./workspace-actions";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";

export default async function WorkspacesPage() {
  const ctx = await requireOrganization();
  const workspaces = await db.workspace.findMany({
    where: {
      archivedAt: null,
      ...(ctx?.organization.id ? { organizationId: ctx.organization.id } : {}),
    },
    include: { projects: { where: { archivedAt: null }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
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
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
