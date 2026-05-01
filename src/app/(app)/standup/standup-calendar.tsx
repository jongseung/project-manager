"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isToday,
} from "date-fns";
import { cn } from "@/lib/utils";

interface StandupNote {
  date: string;
  yesterday: string | null;
  today: string | null;
  blockers: string | null;
  actionItems: string | null;
  retro: string | null;
  meetingStartedAt: Date | null;
  meetingEndedAt: Date | null;
}

interface StandupCalendarProps {
  notes: StandupNote[];
}

export function StandupCalendar({ notes }: StandupCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedNote, setSelectedNote] = useState<StandupNote | null>(null);

  const notesByDate = new Map(notes.map((n) => [n.date, n]));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">스크럼 히스토리</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCurrentMonth(new Date())}>
              {format(currentMonth, "MMM yyyy")}
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{day}</div>
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const note = notesByDate.get(dateStr);
            const hasNote = note && (note.yesterday || note.today || note.blockers);
            return (
              <button
                key={dateStr}
                onClick={() => hasNote && setSelectedNote(note)}
                className={cn(
                  "h-9 flex items-center justify-center rounded-md text-sm relative",
                  !isSameMonth(day, currentMonth) && "text-muted-foreground/30",
                  isToday(day) && "bg-primary text-primary-foreground font-bold",
                  hasNote && !isToday(day) && "bg-blue-50 dark:bg-blue-950 hover:bg-blue-100",
                  !hasNote && "hover:bg-accent"
                )}
              >
                {format(day, "d")}
                {hasNote && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              데일리 스크럼 — {selectedNote?.date}
            </DialogTitle>
          </DialogHeader>
          {selectedNote && (() => {
            let actions: { id: string; text: string; done: boolean; taskId?: string }[] = [];
            let retro: { good?: string; improve?: string; action?: string } = {};
            try { if (selectedNote.actionItems) actions = JSON.parse(selectedNote.actionItems); } catch {}
            try { if (selectedNote.retro) retro = JSON.parse(selectedNote.retro); } catch {}
            const hasRetro = retro.good || retro.improve || retro.action;
            const duration = selectedNote.meetingStartedAt && selectedNote.meetingEndedAt
              ? Math.round((new Date(selectedNote.meetingEndedAt).getTime() - new Date(selectedNote.meetingStartedAt).getTime()) / 60000)
              : null;

            return (
              <div className="space-y-4">
                {duration !== null && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>회의 시간: <strong className="text-foreground">{duration}분</strong></span>
                  </div>
                )}
                {selectedNote.yesterday && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">어제 회고</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.yesterday}</p>
                  </div>
                )}
                {selectedNote.today && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">오늘 계획</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.today}</p>
                  </div>
                )}
                {selectedNote.blockers && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">블로커</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedNote.blockers}</p>
                  </div>
                )}
                {actions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">액션 아이템</p>
                    <div className="space-y-1">
                      {actions.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm">
                          {a.done ? <span className="text-green-500">&#10003;</span> : <span className="text-muted-foreground/40">&#9675;</span>}
                          <span className={a.done ? "line-through text-muted-foreground" : ""}>{a.text}</span>
                          {a.taskId && <span className="text-[10px] text-green-600 border border-green-200 rounded px-1">태스크 생성됨</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasRetro && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">미팅 회고</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {retro.good && (
                        <div className="rounded border border-green-200 dark:border-green-900 p-2">
                          <p className="text-[10px] font-semibold text-green-600 mb-0.5">잘한 점</p>
                          <p className="text-xs whitespace-pre-wrap">{retro.good}</p>
                        </div>
                      )}
                      {retro.improve && (
                        <div className="rounded border border-yellow-200 dark:border-yellow-900 p-2">
                          <p className="text-[10px] font-semibold text-yellow-600 mb-0.5">개선할 점</p>
                          <p className="text-xs whitespace-pre-wrap">{retro.improve}</p>
                        </div>
                      )}
                      {retro.action && (
                        <div className="rounded border border-blue-200 dark:border-blue-900 p-2">
                          <p className="text-[10px] font-semibold text-blue-600 mb-0.5">다음 액션</p>
                          <p className="text-xs whitespace-pre-wrap">{retro.action}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
