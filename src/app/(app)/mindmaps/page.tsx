import Link from "next/link";
import { Brain } from "lucide-react";
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
  const maps = orgId
    ? await db.mindMap.findMany({
        where: { project: { workspace: { organizationId: orgId } } },
        include: { _count: { select: { nodes: true } }, project: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div>
      <Header title="브레인스토밍">
        <MindMapActions />
      </Header>
      <div className="p-6 max-w-full">
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
      </div>
    </div>
  );
}
