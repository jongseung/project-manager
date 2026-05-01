"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { quickAddToToday } from "@/actions/daily";

interface ProjectOption {
  id: string;
  name: string;
  workspaceName: string;
}

interface QuickAddProps {
  projects: ProjectOption[];
  defaultProjectId?: string;
}

export function QuickAdd({ projects, defaultProjectId }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");

  const { execute, isPending } = useServerAction(
    async (input: { projectId: string; title: string }) => {
      return quickAddToToday(input.projectId, input.title);
    },
    {
      successMessage: "오늘 할 일에 추가되었습니다",
      onSuccess: () => setTitle(""),
    }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    execute({ projectId, title: title.trim() });
  }

  const hasProjects = projects.length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Select value={projectId} onValueChange={setProjectId} disabled={!hasProjects}>
        <SelectTrigger className="w-[200px] shrink-0">
          <SelectValue placeholder="프로젝트 선택" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="text-muted-foreground text-xs mr-1">{p.workspaceName} /</span>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={hasProjects ? "오늘 할 태스크 추가..." : "태스크를 추가하려면 프로젝트를 먼저 만드세요"}
        disabled={!hasProjects || isPending}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={!title.trim() || !projectId || isPending}>
        <Plus className="h-4 w-4 mr-1" />
        추가
      </Button>
    </form>
  );
}
