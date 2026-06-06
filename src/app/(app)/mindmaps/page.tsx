import Link from "next/link";
import { Brain, GitBranch, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { db } from "@/lib/db";
import { MindMapActions } from "./mindmap-actions";
import { formatRelativeDate } from "@/lib/utils";
import { getCurrentOrgId } from "@/lib/session";

export default async function MindMapsPage() {
  const orgId = await getCurrentOrgId();
  // Scope maps to the caller's org. Standalone maps (no project) are currently
  // excluded because there is no ownership path in the schema.
  const [maps, projects] = orgId
    ? await Promise.all([
        db.mindMap.findMany({
          where: { project: { workspace: { organizationId: orgId } } },
          include: { _count: { select: { nodes: true } }, project: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
        }),
        db.project.findMany({
          where: { archivedAt: null, status: { not: "archived" }, workspace: { organizationId: orgId } },
          select: {
            id: true,
            name: true,
            color: true,
            _count: { select: { tasks: { where: { archivedAt: null } }, epics: true } },
          },
          orderBy: { updatedAt: "desc" },
        }),
      ])
    : [[], []];

  return (
    <div>
      <Header title="브레인스토밍">
        <MindMapActions />
      </Header>
      <div className="p-6 max-w-full space-y-8">
        {/* Connection graphs — Obsidian-style task webs per project */}
        {projects.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">연결 그래프</h2>
              <span className="text-xs text-muted-foreground">— 프로젝트의 태스크·에픽·스토리가 어떻게 이어지는지 탐색하세요</span>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}/graph`}>
                  <Card size="sm" className="group cursor-pointer transition-colors hover:border-primary/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="truncate">{p.name}</span>
                        <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
                      </CardTitle>
                      <CardDescription>
                        태스크 {p._count.tasks}개 · 에픽 {p._count.epics}개
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">마인드맵</h2>
          <span className="text-xs text-muted-foreground">— 자유롭게 아이디어를 발산하세요</span>
        </div>
        {maps.length === 0 ? (
          <EmptyState icon={<Brain className="h-12 w-12" />} title="브레인스토밍을 시작하세요" description="마인드맵으로 아이디어를 시각적으로 탐색하세요." action={<MindMapActions />} />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {maps.map((map) => (
              <Link key={map.id} href={`/mindmaps/${map.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-4 w-4" /> {map.title}
                    </CardTitle>
                    <CardDescription>
                      {map._count.nodes}개 노드
                      {map.project && <span> · {map.project.name}</span>}
                      <span className="ml-2">{formatRelativeDate(map.updatedAt)}</span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
        </section>
      </div>
    </div>
  );
}
