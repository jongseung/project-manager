"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Plus,
  ChevronRight,
  Target,
  Brain,
  Users,
  Bell,
  Settings,
  Menu,
  Repeat,
  Trash2,
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

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/70"
        )}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

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
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <FolderKanban className="h-4 w-4" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">PM</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/55">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Workspaces */}
        <div className="mt-2">
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/55">
              워크스페이스
            </span>
            <Link href="/workspaces" onClick={onNavigate}>
              <Button variant="ghost" size="icon-xs" className="h-5 w-5 text-muted-foreground/60 hover:text-foreground">
                <Plus className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-0.5">
            {workspaces.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-muted-foreground/70">
                워크스페이스가 없습니다
              </p>
            )}
            {workspaces.map((workspace) => {
              const expanded = expandedWorkspaces.has(workspace.id);
              return (
                <div key={workspace.id}>
                  <button
                    onClick={() => toggleWorkspace(workspace.id)}
                    className="group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  >
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform",
                        expanded && "rotate-90"
                      )}
                    />
                    <span
                      className="h-2 w-2 shrink-0 rounded-[3px]"
                      style={{ backgroundColor: workspace.color }}
                    />
                    <span className="truncate">{workspace.name}</span>
                  </button>

                  {expanded && (
                    <div className="ml-[1.05rem] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                      {workspace.projects.map((project) => {
                        const active = pathname.startsWith(`/projects/${project.id}`);
                        return (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}/flow`}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/85"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                                active ? "bg-primary" : "bg-muted-foreground/35"
                              )}
                            />
                            <span className="truncate">{project.name}</span>
                          </Link>
                        );
                      })}
                      {workspace.projects.length === 0 && (
                        <p className="px-2.5 py-1 text-xs text-muted-foreground/60">
                          프로젝트 없음
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export function Sidebar({ workspaces }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
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
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0 bg-sidebar text-sidebar-foreground">
        <SheetTitle className="sr-only">내비게이션</SheetTitle>
        <div className="flex h-full flex-col">
          <SidebarContent workspaces={workspaces} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
