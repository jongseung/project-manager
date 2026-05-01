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

  return (
    <div>
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        workspaceName={project.workspace.name}
        projectColor={project.color}
      />
      <ListView
        project={project}
        tasks={project.tasks}
        members={members.map((m) => ({ id: m.id, name: m.name, color: m.color }))}
        savedViews={savedViews}
      />
    </div>
  );
}
