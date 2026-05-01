"use client";

import { useState, useMemo } from "react";
import { FolderOpen, EyeOff, Eye } from "lucide-react";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { Project } from "@prisma/client";

interface WorkspaceProjectListProps {
  projects: Project[];
}

const HIDDEN_STATUSES = ["completed", "archived"];

export function WorkspaceProjectList({ projects }: WorkspaceProjectListProps) {
  const [showHidden, setShowHidden] = useState(false);

  const hiddenCount = useMemo(
    () => projects.filter((p) => HIDDEN_STATUSES.includes(p.status)).length,
    [projects]
  );

  const visibleProjects = useMemo(
    () => showHidden ? projects : projects.filter((p) => !HIDDEN_STATUSES.includes(p.status)),
    [projects, showHidden]
  );

  return (
    <div className="p-6 max-w-full">
      {hiddenCount > 0 && (
        <div className="flex items-center justify-end mb-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? (
              <><EyeOff className="h-3.5 w-3.5 mr-1" />Hide finished ({hiddenCount})</>
            ) : (
              <><Eye className="h-3.5 w-3.5 mr-1" />Show finished ({hiddenCount})</>
            )}
          </Button>
        </div>
      )}

      {visibleProjects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title={hiddenCount > 0 ? "모든 프로젝트가 완료되었거나 보관됨" : "프로젝트가 없습니다"}
          description={hiddenCount > 0 ? "'완료 보기'를 클릭하여 확인하세요." : "이 워크스페이스에 첫 프로젝트를 만드세요."}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
