"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/project/project-dialog";

interface WorkspaceProjectActionsProps {
  workspaceId: string;
}

export function WorkspaceProjectActions({ workspaceId }: WorkspaceProjectActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> New Project
      </Button>
      <ProjectDialog open={open} onOpenChange={setOpen} workspaceId={workspaceId} />
    </>
  );
}
