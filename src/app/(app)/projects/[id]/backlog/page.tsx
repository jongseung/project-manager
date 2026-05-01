import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectHeader } from "@/components/project/project-header";
import { BacklogView } from "./backlog-view";

export default async function BacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { workspace: true },
  });
  if (!project) notFound();

  const [tasks, sprints, stories, members] = await Promise.all([
    db.task.findMany({
      where: { projectId: id, archivedAt: null, parentTaskId: null },
      include: {
        member: { select: { id: true, name: true, color: true } },
        story: { select: { id: true, title: true } },
        labels: { include: { label: true } },
        sprintTasks: { include: { sprint: { select: { id: true, name: true, status: true } } } },
        subtasks: { select: { id: true, status: true } },
      },
      orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
    }),
    db.sprint.findMany({
      where: { projectId: id, status: { in: ["planning", "active"] } },
      select: { id: true, name: true, status: true },
      orderBy: { startDate: "asc" },
    }),
    db.story.findMany({
      where: { projectId: id },
      select: { id: true, title: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.member.findMany({
      where: { isActive: true },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} />
      <BacklogView projectId={id} tasks={tasks} sprints={sprints} stories={stories} members={members} />
    </div>
  );
}
