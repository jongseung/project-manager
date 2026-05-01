import { notFound } from "next/navigation";
import { getProject } from "@/actions/project";
import { getMembers } from "@/actions/member";
import { getSavedViews } from "@/actions/saved-view";
import { ProjectHeader } from "@/components/project/project-header";
import { ListView } from "./list-view";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, members, savedViews] = await Promise.all([
    getProject(id),
    getMembers(),
    getSavedViews(id, "list"),
  ]);
  if (!project) notFound();

  const totalTaskCount = (project as unknown as { _count: { tasks: number } })._count?.tasks ?? project.tasks.length;
  const isTruncated = project.tasks.length < totalTaskCount;

  return (
    <div>
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        workspaceName={project.workspace.name}
        projectColor={project.color}
        taskCount={totalTaskCount}
        epicCount={project.epics.length}
        storyCount={project.stories.length}
      />
      {isTruncated && (
        <div className="mx-6 mt-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          전체 {totalTaskCount}개 태스크 중 최근 {project.tasks.length}개만 표시됩니다. 필터를 사용하여 원하는 태스크를 찾으세요.
        </div>
      )}
      <ListView
        project={project}
        tasks={project.tasks}
        members={members.map((m) => ({ id: m.id, name: m.name, color: m.color }))}
        savedViews={savedViews}
      />
    </div>
  );
}
