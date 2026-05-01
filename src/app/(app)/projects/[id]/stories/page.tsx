import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectHeader } from "@/components/project/project-header";
import { StoriesView } from "./stories-view";

export default async function StoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      workspace: true,
      epics: { select: { id: true, name: true }, orderBy: { sortOrder: "asc" } },
      stories: {
        include: {
          tasks: { where: { archivedAt: null }, select: { id: true, status: true } },
          krLinks: { include: { keyResult: { include: { objective: true } } } },
        },
        orderBy: { sortOrder: "asc" },
      },
      objectives: {
        include: { keyResults: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!project) notFound();

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} />
      <StoriesView projectId={project.id} epics={project.epics} stories={project.stories} objectives={project.objectives} />
    </div>
  );
}
