import { notFound } from "next/navigation";
import { getProject } from "@/actions/project";
import { ProjectHeader } from "@/components/project/project-header";
import { BoardView } from "./board-view";
import { db } from "@/lib/db";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, members, sprints, sprintTasks] = await Promise.all([
    getProject(id),
    db.member.findMany({ where: { isActive: true }, select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
    db.sprint.findMany({
      where: { projectId: id, status: { in: ["planning", "active"] } },
      select: { id: true, name: true, status: true },
      orderBy: { startDate: "asc" },
    }),
    db.sprintTask.findMany({
      where: { sprint: { projectId: id, status: { in: ["planning", "active"] } } },
      select: { taskId: true, sprintId: true },
    }),
  ]);
  if (!project) notFound();

  const labels = project.workspace.labels ?? [];
  const sprintTaskMap = new Map<string, string>();
  sprintTasks.forEach((st) => sprintTaskMap.set(st.taskId, st.sprintId));

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} />
      <BoardView project={project} tasks={project.tasks} members={members} labels={labels} epics={project.epics} stories={project.stories} sprints={sprints} sprintTaskMap={Object.fromEntries(sprintTaskMap)} />
    </div>
  );
}
