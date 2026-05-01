import { notFound } from "next/navigation";
import { Zap } from "lucide-react";
import { getProject } from "@/actions/project";
import { getSprintsWithTasks } from "@/actions/sprint";
import { ProjectHeader } from "@/components/project/project-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SprintActions } from "./sprint-actions";
import { SprintDetail } from "./sprint-detail";
import { db } from "@/lib/db";

export default async function SprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [sprints, stories] = await Promise.all([
    getSprintsWithTasks(id),
    db.story.findMany({
      where: { projectId: id },
      select: { id: true, title: true },
    }),
  ]);

  const allTasks = await db.task.findMany({
    where: { projectId: id, archivedAt: null, parentTaskId: null },
    select: { id: true, title: true, status: true, priority: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <SprintActions projectId={id} />
        </div>
        {sprints.length === 0 ? (
          <EmptyState icon={<Zap className="h-12 w-12" />} title="스프린트가 없습니다" description="스프린트를 생성하여 업무를 시간 단위로 관리하세요." />
        ) : (
          <div className="space-y-6">
            {sprints.map((sprint) => (
              <SprintDetail key={sprint.id} sprint={sprint} allTasks={allTasks} stories={stories} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
