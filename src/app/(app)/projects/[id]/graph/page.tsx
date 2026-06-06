import { notFound } from "next/navigation";
import { getProject } from "@/actions/project";
import { getProjectGraph } from "@/actions/graph";
import { ProjectHeader } from "@/components/project/project-header";
import { ConnectionGraph } from "@/components/graph/connection-graph";

export default async function ProjectGraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, graph] = await Promise.all([getProject(id), getProjectGraph(id)]);
  if (!project || !graph) notFound();

  return (
    <div>
      <ProjectHeader
        projectId={project.id}
        projectName={project.name}
        workspaceName={project.workspace.name}
        projectColor={project.color}
        taskCount={project.tasks.length}
        epicCount={project.epics.length}
        storyCount={project.stories.length}
      />
      <div className="p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">연결 그래프</h2>
            <p className="text-xs text-muted-foreground">
              태스크·에픽·스토리가 의존성·소속·서브태스크로 어떻게 이어지는지 한눈에 보세요. 노드를 클릭하면 연결만 강조됩니다.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            노드 {graph.nodes.length} · 연결 {graph.edges.length}
          </span>
        </div>
        <ConnectionGraph nodes={graph.nodes} edges={graph.edges} projectId={project.id} />
      </div>
    </div>
  );
}
