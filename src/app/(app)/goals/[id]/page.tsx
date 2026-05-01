import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getCurrentOrgId } from "@/lib/session";
import { GoalDetailActions } from "./goal-detail-actions";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orgId = await getCurrentOrgId();
  if (!orgId) notFound();

  const goal = await db.goal.findFirst({
    where: { id, workspace: { organizationId: orgId } },
    include: {
      kpis: { include: { entries: { orderBy: { recordedAt: "asc" } } } },
      projectLinks: { include: { project: true } },
      workspace: { include: { projects: { select: { id: true, name: true }, orderBy: { name: "asc" } } } },
    },
  });

  if (!goal) notFound();

  const linkedProjectIds = goal.projectLinks.map((l) => l.projectId);
  // Guard: workspace is nullable in schema (onDelete: SetNull). Treat as empty project list if orphaned.
  const availableProjects = (goal.workspace?.projects ?? []).filter((p) => !linkedProjectIds.includes(p.id));

  return (
    <div>
      <Header title={goal.title}>
        <Link href="/goals">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />목표</Button>
        </Link>
        <Link href={`/goals/${goal.id}/workflow`}>
          <Button variant="outline" size="sm">워크플로우</Button>
        </Link>
        <Badge variant="secondary">{goal.status.replace("_", " ")}</Badge>
      </Header>
      <div className="p-6 space-y-8 max-w-full">
        {goal.description && (
          <p className="text-muted-foreground">{goal.description}</p>
        )}

        <GoalDetailActions
          goalId={goal.id}
          linkedProjects={goal.projectLinks.map((l) => l.project)}
          availableProjects={availableProjects}
          kpis={goal.kpis}
        />
      </div>
    </div>
  );
}
