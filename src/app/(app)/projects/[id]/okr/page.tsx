import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectHeader } from "@/components/project/project-header";
import { OKRView } from "./okr-view";

export default async function OKRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      workspace: true,
      objectives: {
        include: {
          keyResults: {
            include: {
              snapshots: { orderBy: { recordedAt: "desc" }, take: 10 },
              storyLinks: { include: { story: { select: { id: true, title: true, status: true } } } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!project) notFound();

  return (
    <div>
      <ProjectHeader projectId={project.id} projectName={project.name} workspaceName={project.workspace.name} projectColor={project.color} />
      <OKRView projectId={project.id} objectives={project.objectives} />
    </div>
  );
}
