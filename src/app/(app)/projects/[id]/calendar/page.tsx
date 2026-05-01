import { notFound } from "next/navigation";
import { getProject } from "@/actions/project";
import { ProjectHeader } from "@/components/project/project-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { db } from "@/lib/db";

export default async function CalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const allTasks = await db.task.findMany({
    where: { projectId: id, archivedAt: null },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div>
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        workspaceName={project.workspace.name} projectColor={project.color}
      />
      <div className="p-6">
        <CalendarView tasks={allTasks} />
      </div>
    </div>
  );
}
