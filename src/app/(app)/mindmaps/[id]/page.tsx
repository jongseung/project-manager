import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { MindMapCanvas } from "@/components/mindmap/mindmap-canvas";
import { getMindMapWithNodes } from "@/actions/mindmap";

export default async function MindMapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mindMap = await getMindMapWithNodes(id);
  if (!mindMap) notFound();

  return (
    <div>
      <Header title={mindMap.title}>
        <Link href="/mindmaps">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />브레인스토밍</Button>
        </Link>
      </Header>
      <div className="p-6">
        <MindMapCanvas mindMapId={mindMap.id} projectId={mindMap.projectId} nodes={mindMap.nodes} />
      </div>
    </div>
  );
}
