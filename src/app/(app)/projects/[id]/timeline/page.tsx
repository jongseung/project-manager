import { notFound } from "next/navigation";
import { getProject } from "@/actions/project";
import { ProjectHeader } from "@/components/project/project-header";
import { TimelineView } from "@/components/timeline/timeline-view";
import { db } from "@/lib/db";

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [tasks, milestones, epics, stories, dependencies] = await Promise.all([
    db.task.findMany({
      where: { projectId: id, archivedAt: null, parentTaskId: null },
      include: {
        epic: { select: { id: true, name: true } },
        story: { select: { id: true, title: true, epicId: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    db.milestone.findMany({ where: { projectId: id }, orderBy: { targetDate: "asc" } }),
    db.epic.findMany({ where: { projectId: id }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
    db.story.findMany({ where: { projectId: id }, select: { id: true, title: true, epicId: true }, orderBy: { sortOrder: "asc" } }),
    db.dependency.findMany({
      where: { predecessorTask: { projectId: id } },
      select: { predecessorTaskId: true, successorTaskId: true },
    }),
  ]);

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} />
      <div className="p-6">
        <TimelineView tasks={tasks} milestones={milestones} epics={epics} stories={stories} dependencies={dependencies} />
      </div>
    </div>
  );
}
