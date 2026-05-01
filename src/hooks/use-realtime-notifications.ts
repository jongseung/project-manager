"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface ActivityItem {
  id: string;
  entityType: string;
  action: string;
  details: string | null;
  occurredAt: string;
}

interface MentionItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
}

function formatAction(a: ActivityItem): string {
  const details = a.details ? (() => { try { return JSON.parse(a.details); } catch { return {}; } })() : {};
  const entity = a.entityType === "task" ? "태스크" : a.entityType === "project" ? "프로젝트" : a.entityType;
  switch (a.action) {
    case "created": return `${entity} 생성: ${details.title ?? ""}`;
    case "completed": return `${entity} 완료`;
    case "status_changed": return `${entity} 상태 변경`;
    default: return `${entity} ${a.action}`;
  }
}

export function useRealtimeNotifications() {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenIds = useRef(new Set<string>());

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const es = new EventSource("/api/notifications/stream");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected" || data.type === "ready") {
          setConnected(true);
          return;
        }
        if (data.type === "activities" && data.items) {
          for (const item of data.items as ActivityItem[]) {
            if (seenIds.current.has(item.id)) continue;
            seenIds.current.add(item.id);
            toast.info(formatAction(item), { duration: 4000 });
          }
        }
        if (data.mentions) {
          for (const mention of data.mentions as MentionItem[]) {
            if (seenIds.current.has(`mention-${mention.id}`)) continue;
            seenIds.current.add(`mention-${mention.id}`);
            toast(`@멘션: ${mention.title}`, {
              description: mention.message,
              duration: 6000,
            });
          }
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;
      setTimeout(connect, 10000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect]);

  return { connected };
}
