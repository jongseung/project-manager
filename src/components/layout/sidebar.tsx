"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Plus,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Target,
  Brain,
  Users,
  Bell,
  Settings,
  Menu,
  Repeat,
  Trash2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { WorkspaceWithProjects } from "@/types";
import { useState } from "react";

interface SidebarProps {
  workspaces: WorkspaceWithProjects[];
}

const NAV_SECTIONS = [
  {
    label: "일일 업무",
    items: [
      { href: "/today", label: "오늘 할 일", icon: CalendarDays },
      { href: "/standup", label: "데일리 스크럼", icon: Users },
      { href: "/routines", label: "반복 업무", icon: Repeat },
      { href: "/reminders", label: "마감 알림", icon: Bell },
    ],
  },
  {
    label: "전략",
    items: [
      { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
      { href: "/goals", label: "목표 관리", icon: Target },
      { href: "/mindmaps", label: "브레인스토밍", icon: Brain },
      { href: "/activity", label: "활동 로그", icon: Activity },
    ],
  },
  {
    label: "시스템",
    items: [
      { href: "/trash", label: "휴지통", icon: Trash2 },
      { href: "/settings", label: "설정", icon: Settings },
    ],
  },
];

function SidebarContent({
  workspaces,
  onNavigate,
}: {
  workspaces: WorkspaceWithProjects[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(workspaces.map((w) => w.id))
  );

  function toggleWorkspace(id: string) {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b px-4 h-14">
        <FolderKanban className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">PM</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              워크스페이스
            </span>
            <Link href="/workspaces" onClick={onNavigate}>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="mt-1 space-y-1">
            {workspaces.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                워크스페이스가 없습니다
              </p>
            )}
            {workspaces.map((workspace) => (
              <div key={workspace.id}>
                <button
                  onClick={() => toggleWorkspace(workspace.id)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-sidebar-accent"
                >
                  {expandedWorkspaces.has(workspace.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: workspace.color }}
                  />
                  <span className="truncate">{workspace.name}</span>
                </button>

                {expandedWorkspaces.has(workspace.id) && (
                  <div className="ml-4 space-y-0.5 pl-3 border-l">
                    {workspace.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}/board`}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                          pathname.startsWith(`/projects/${project.id}`)
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                        )}
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    ))}
                    {workspace.projects.length === 0 && (
                      <p className="px-3 py-1 text-xs text-muted-foreground">
                        No projects
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

export function Sidebar({ workspaces }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <SidebarContent workspaces={workspaces} />
    </aside>
  );
}

export function MobileSidebar({ workspaces }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <SidebarContent workspaces={workspaces} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
