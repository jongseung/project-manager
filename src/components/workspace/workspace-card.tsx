"use client";

import { useState } from "react";
import { Briefcase, MoreHorizontal, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { deleteWorkspace, restoreWorkspace } from "@/actions/workspace";
import type { WorkspaceWithProjects } from "@/types";

interface WorkspaceCardProps {
  workspace: WorkspaceWithProjects;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { del } = useSoftDelete({
    deleteFn: deleteWorkspace,
    restoreFn: restoreWorkspace,
    label: "워크스페이스",
  });

  return (
    <div className="relative group">
      <Link href={`/workspaces/${workspace.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: workspace.color }}
              >
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{workspace.name}</CardTitle>
                <CardDescription>
                  {workspace.projects.length} project{workspace.projects.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </Link>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.preventDefault()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`"${workspace.name}" 워크스페이스를 삭제할까요?`}
        description="이 워크스페이스와 하위 프로젝트 전체가 휴지통으로 이동됩니다. 30일 내 복원 가능합니다."
        confirmLabel="삭제"
        onConfirm={async () => {
          del(workspace.id, { onDeleted: () => router.refresh(), itemName: workspace.name });
          return { success: true };
        }}
      />
    </div>
  );
}
