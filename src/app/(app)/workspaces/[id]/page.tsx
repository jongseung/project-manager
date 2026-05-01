import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { WorkspaceProjectActions } from "./workspace-project-actions";
import { WorkspaceProjectList } from "./workspace-project-list";
import { requireOrganization } from "@/lib/session";

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await db.workspace.findUnique({
    where: { id },
    include: {
      projects: { orderBy: { name: "asc" } },
    },
  });

  if (!workspace) notFound();

  const ctx = await requireOrganization();
  if (workspace.organizationId && workspace.organizationId !== ctx.organization.id) notFound();

  return (
    <div>
      <Header title={workspace.name}>
        <Link href="/workspaces">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />워크스페이스</Button>
        </Link>
        <WorkspaceProjectActions workspaceId={workspace.id} />
      </Header>
      <WorkspaceProjectList projects={workspace.projects} />
    </div>
  );
}
