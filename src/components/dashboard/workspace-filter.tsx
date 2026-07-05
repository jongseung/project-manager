"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkspaceFilterProps {
  workspaces: { id: string; name: string; color: string }[];
  current?: string;
}

/** Scopes the dashboard to a single workspace via ?ws= (or all). */
export function WorkspaceFilter({ workspaces, current }: WorkspaceFilterProps) {
  const router = useRouter();

  return (
    <Select
      value={current ?? "_all"}
      onValueChange={(v) => router.push(v === "_all" ? "/dashboard" : `/dashboard?ws=${v}`)}
    >
      <SelectTrigger className="h-8 w-[210px] text-xs">
        <SelectValue placeholder="워크스페이스" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_all">전체 워크스페이스</SelectItem>
        {workspaces.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: w.color }} />
              {w.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
