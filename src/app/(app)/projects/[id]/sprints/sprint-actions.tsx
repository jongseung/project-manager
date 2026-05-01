"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SprintDialog } from "@/components/sprint/sprint-dialog";

export function SprintActions({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Sprint</Button>
      <SprintDialog open={open} onOpenChange={setOpen} projectId={projectId} />
    </>
  );
}
