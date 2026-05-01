"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarDays, LayoutDashboard, FolderOpen, Search, Briefcase, Users, Bell, Target, Brain, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  projectName: string;
  projectId: string;
  status: string;
}

const NAV_ITEMS = [
  { label: "오늘 할 일", href: "/today", icon: CalendarDays },
  { label: "데일리 스크럼", href: "/standup", icon: Users },
  { label: "마감 알림", href: "/reminders", icon: Bell },
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "목표 관리", href: "/goals", icon: Target },
  { label: "브레인스토밍", href: "/mindmaps", icon: Brain },
  { label: "워크스페이스", href: "/workspaces", icon: FolderOpen },
  { label: "설정", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const searchTasks = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchTasks(query), 200);
    return () => clearTimeout(timer);
  }, [query, searchTasks]);

  const allItems = [
    ...NAV_ITEMS.map((n) => ({ type: "nav" as const, ...n })),
    ...results.map((r) => ({ type: "task" as const, ...r })),
  ].filter((item) => {
    if (!query.trim()) return item.type === "nav";
    if (item.type === "nav") return item.label.toLowerCase().includes(query.toLowerCase());
    return true;
  });

  function handleSelect(index: number) {
    const item = allItems[index];
    if (!item) return;
    if (item.type === "nav") {
      router.push(item.href);
    } else if (item.type === "task") {
      router.push(`/projects/${item.projectId}/board`);
    }
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="태스크 검색 또는 이동..."
            className="border-0 focus-visible:ring-0 h-11"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {allItems.length === 0 && query && (
            <p className="py-6 text-center text-sm text-muted-foreground">결과가 없습니다.</p>
          )}
          {!query && (
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">메뉴</p>
          )}
          {allItems.map((item, i) => (
            <button
              key={item.type === "nav" ? item.href : item.id}
              className={cn(
                "flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm text-left transition-colors",
                i === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
              )}
              onClick={() => handleSelect(i)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {item.type === "nav" ? (
                <>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{item.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{item.projectName}</span>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
