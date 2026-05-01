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

  const totalTaskCount = (project as unknown as { _count: { tasks: number } })._count?.tasks ?? project.tasks.length;
  const isTruncated = project.tasks.length < totalTaskCount;

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} taskCount={totalTaskCount} epicCount={project.epics.length} storyCount={project.stories.length} />
      {isTruncated && (
        <div className="mx-6 mt-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          전체 {totalTaskCount}개 태스크 중 최근 {project.tasks.length}개만 표시됩니다. 필터를 사용하여 원하는 태스크를 찾으세요.
        </div>
      )}
      <BoardView project={project} tasks={project.tasks} members={members} labels={labels} epics={project.epics} stories={project.stories} sprints={sprints} sprintTaskMap={Object.fromEntries(sprintTaskMap)} />
    </div>
  );
}
