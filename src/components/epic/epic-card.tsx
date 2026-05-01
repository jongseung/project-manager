"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { deleteEpic, restoreEpic } from "@/actions/epic";

interface EpicCardProps {
  epic: {
    id: string;
    name: string;
    status: string;
    priority: string;
    taskCount: number;
    completedCount: number;
  };
}

export function EpicCard({ epic }: EpicCardProps) {
  const progress = epic.taskCount > 0 ? Math.round((epic.completedCount / epic.taskCount) * 100) : 0;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const { del } = useSoftDelete({ deleteFn: deleteEpic, restoreFn: restoreEpic, label: "에픽" });

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{epic.name}</span>
          <Badge variant="outline" className="text-xs capitalize">{epic.status.replace("_", " ")}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">
            {epic.completedCount}/{epic.taskCount} tasks
          </span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`"${epic.name}" 에픽을 삭제할까요?`}
        description="이 에픽에 연결된 태스크들은 남지만, 에픽 연결이 해제됩니다. 휴지통에서 30일 내 복원 가능합니다."
        confirmLabel="삭제"
        onConfirm={async () => {
          del(epic.id, { itemName: epic.name, onDeleted: () => router.refresh(), onRestored: () => router.refresh() });
          return { success: true };
        }}
      />
    </div>
  );
}
