"use client";

import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EpicCard } from "./epic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useServerAction } from "@/hooks/use-server-action";
import { createEpic } from "@/actions/epic";

interface EpicListProps {
  projectId: string;
  epics: {
    id: string;
    name: string;
    status: string;
    priority: string;
    taskCount: number;
    completedCount: number;
  }[];
}

export function EpicList({ projectId, epics }: EpicListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");

  const { execute, isPending } = useServerAction(
    async (input: unknown) => createEpic(input),
    {
      successMessage: "에픽이 생성되었습니다",
      onSuccess: () => { setName(""); setShowAdd(false); },
    }
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    execute({ projectId, name: name.trim() });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Epics</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Epic
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Epic name" autoFocus className="flex-1" />
          <Button type="submit" size="sm" disabled={!name.trim() || isPending}>Create</Button>
        </form>
      )}

      {epics.length === 0 && !showAdd ? (
        <EmptyState icon={<Layers className="h-8 w-8" />} title="No epics" description="Group related tasks into epics." className="py-6" />
      ) : (
        epics.map((epic) => <EpicCard key={epic.id} epic={epic} />)
      )}
    </div>
  );
}
