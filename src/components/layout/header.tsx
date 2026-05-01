"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, AtSign, Activity } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

interface ActivityItem {
  id: string;
  entityType: string;
  action: string;
  details: string | null;
  occurredAt: string;
}

interface NotificationItem {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

type TabType = "mentions" | "activity";

const SEEN_KEY = "notifications-seen-at";

function getSeenAt(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SEEN_KEY) ?? "";
}

function setSeenAt(time: string) {
  if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, time);
}

export function Header({ title, children }: HeaderProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [mentions, setMentions] = useState<NotificationItem[]>([]);
  const [seenAt, setSeenAtState] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabType>("mentions");

  const fetchData = useCallback(() => {
    fetch("/api/notifications").then((r) => r.json()).then(setActivities).catch(() => {});
    fetch("/api/notifications/mentions").then((r) => r.json()).then(setMentions).catch(() => {});
  }, []);

  useEffect(() => {
    setSeenAtState(getSeenAt());
    fetchData();

    // 탭 활성 시 5초, 비활성 시 60초 간격으로 폴링
    let interval: ReturnType<typeof setInterval>;

    function startPolling() {
      clearInterval(interval);
      const delay = document.hidden ? 60000 : 5000;
      interval = setInterval(fetchData, delay);
    }

    startPolling();

    function handleVisibility() {
      if (!document.hidden) fetchData(); // 탭 복귀 시 즉시 fetch
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  const unreadMentions = mentions.filter((m) => !m.read).length;
  const unseenActivities = seenAt
    ? activities.filter((a) => a.occurredAt > seenAt).length
    : activities.length;
  const totalUnread = unreadMentions + unseenActivities;

  function handleMarkAllRead() {
    if (tab === "mentions") {
      fetch("/api/notifications/mentions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      }).then(() => {
        setMentions((prev) => prev.map((m) => ({ ...m, read: true })));
      });
    } else {
      const now = new Date().toISOString();
      setSeenAt(now);
      setSeenAtState(now);
    }
  }

  function handleMentionClick(n: NotificationItem) {
    if (!n.read) {
      fetch("/api/notifications/mentions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", id: n.id }),
      }).then(() => {
        setMentions((prev) => prev.map((m) => m.id === n.id ? { ...m, read: true } : m));
      });
    }
    if (n.link) {
      router.push(n.link);
      setOpen(false);
    }
  }

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) fetchData();
  }

  function formatAction(a: ActivityItem): string {
    const details = a.details ? (() => { try { return JSON.parse(a.details); } catch { return {}; } })() : {};
    const entity = a.entityType === "task" ? "태스크" : a.entityType === "story" ? "스토리" : a.entityType === "project" ? "프로젝트" : a.entityType;
    switch (a.action) {
      case "created": return `${entity} 생성됨${details.title ? `: ${details.title}` : ""}`;
      case "completed": return `${entity} 완료`;
      case "status_changed": return `${entity} 상태 변경: ${details.from} → ${details.to}`;
      case "deleted": return `${entity} 삭제됨`;
      case "updated": return `${entity} 수정됨`;
      default: return `${entity} ${a.action}`;
    }
  }

  return (
    <header className="flex h-14 items-center border-b bg-background/95 backdrop-blur-sm px-6 gap-2">
      {title && <h1 className="text-sm font-semibold mr-auto">{title}</h1>}
      {children}
      <div className="flex items-center gap-2 ml-auto">

        <Popover open={open} onOpenChange={handleOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setTab("mentions")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  tab === "mentions" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AtSign className="h-3 w-3" />
                멘션
                {unreadMentions > 0 && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadMentions}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("activity")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  tab === "activity" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-3 w-3" />
                활동
                {unseenActivities > 0 && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-muted-foreground/30 text-[10px] font-bold flex items-center justify-center">
                    {unseenActivities}
                  </span>
                )}
              </button>
            </div>

            <div className="p-2">
              {/* Header with mark all read */}
              {((tab === "mentions" && mentions.length > 0) || (tab === "activity" && activities.length > 0)) && (
                <div className="flex justify-end mb-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={handleMarkAllRead}>
                    <Check className="h-3 w-3 mr-1" /> 모두 읽음
                  </Button>
                </div>
              )}

              {/* Mentions tab */}
              {tab === "mentions" && (
                mentions.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">멘션 알림이 없습니다</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                    {mentions.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleMentionClick(n)}
                        className={`flex items-start gap-2 rounded-md px-2 py-2 text-xs w-full text-left transition-colors ${
                          !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/50"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          !n.read ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          <AtSign className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`truncate ${!n.read ? "font-medium" : ""}`}>{n.title}</p>
                          <p className="text-muted-foreground truncate">{n.message}</p>
                          <p className="text-muted-foreground/60 mt-0.5">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                        {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* Activity tab */}
              {tab === "activity" && (
                activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">최근 활동이 없습니다</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-0.5">
                    {activities.map((a) => {
                      const isUnseen = !seenAt || a.occurredAt > seenAt;
                      return (
                        <div key={a.id} className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs ${isUnseen ? "bg-primary/5" : "hover:bg-accent/50"}`}>
                          <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${isUnseen ? "bg-primary" : "bg-muted-foreground/30"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{formatAction(a)}</p>
                            <p className="text-muted-foreground">{formatDistanceToNow(new Date(a.occurredAt), { addSuffix: true })}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </PopoverContent>
        </Popover>

        <ThemeToggle />
      </div>
    </header>
  );
}
