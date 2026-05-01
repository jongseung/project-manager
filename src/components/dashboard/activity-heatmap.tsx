"use client";

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, subDays, eachDayOfInterval, startOfWeek, getDay } from "date-fns";
import { ko } from "date-fns/locale";

interface ActivityHeatmapProps {
  data: Record<string, number>;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const today = new Date();
  // 26주(약 6개월) + 오늘이 속한 주의 시작까지
  const weeksToShow = 26;
  const endDate = today;
  const rawStart = subDays(endDate, weeksToShow * 7);
  const startDate = startOfWeek(rawStart, { weekStartsOn: 1 }); // 월요일 시작

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const maxCount = Math.max(1, ...Object.values(data));
  const totalActivities = Object.values(data).reduce((a, b) => a + b, 0);

  function getColor(count: number): string {
    if (count === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-green-200 dark:bg-green-900";
    if (ratio < 0.5) return "bg-green-400 dark:bg-green-700";
    if (ratio < 0.75) return "bg-green-500 dark:bg-green-500";
    return "bg-green-700 dark:bg-green-300";
  }

  // 주 단위로 그룹핑 (월요일 시작)
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  // 첫 주의 빈 칸 채우기
  const firstDayOfWeek = getDay(days[0]); // 0=일 1=월...
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  for (let i = 0; i < mondayOffset; i++) week.push(null);

  days.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // 월 라벨 위치 계산
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let prevMonth = -1;
  weeks.forEach((w, wi) => {
    const firstDay = w.find((d) => d !== null);
    if (!firstDay) return;
    const month = firstDay.getMonth();
    if (month !== prevMonth) {
      monthLabels.push({ label: format(firstDay, "M월"), weekIndex: wi });
      prevMonth = month;
    }
  });

  const CELL = 13;
  const GAP = 2;
  const colWidth = CELL + GAP;
  const dayLabelWidth = 24;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">활동 현황</CardTitle>
          <span className="text-xs text-muted-foreground">최근 6개월 / 총 {totalActivities}건</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* 월 라벨 */}
          <div className="flex" style={{ paddingLeft: dayLabelWidth }}>
            {monthLabels.map((m, i) => {
              const left = m.weekIndex * colWidth;
              const nextLeft = i < monthLabels.length - 1 ? monthLabels[i + 1].weekIndex * colWidth : weeks.length * colWidth;
              return (
                <div key={i} className="text-[10px] text-muted-foreground" style={{ width: nextLeft - left, minWidth: 0 }}>
                  {m.label}
                </div>
              );
            })}
          </div>

          {/* 그리드 */}
          <div className="flex" style={{ marginTop: 2 }}>
            {/* 요일 라벨 */}
            <div className="flex flex-col shrink-0" style={{ width: dayLabelWidth, gap: GAP }}>
              {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
                <div key={d} className="flex items-center justify-end pr-1" style={{ height: CELL }}>
                  <span className="text-[9px] text-muted-foreground">{i % 2 === 0 ? d : ""}</span>
                </div>
              ))}
            </div>

            {/* 셀 */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((w, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {w.map((day, di) => {
                    if (!day) return <div key={di} style={{ width: CELL, height: CELL }} />;
                    const key = format(day, "yyyy-MM-dd");
                    const count = data[key] ?? 0;
                    const isToday = key === format(today, "yyyy-MM-dd");
                    return (
                      <div
                        key={key}
                        className={cn("rounded-sm", getColor(count), isToday && "ring-1 ring-foreground")}
                        style={{ width: CELL, height: CELL }}
                        title={`${format(day, "M월 d일 (EEE)", { locale: ko })}: ${count}건`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[10px] text-muted-foreground">적음</span>
          {["bg-muted", "bg-green-200 dark:bg-green-900", "bg-green-400 dark:bg-green-700", "bg-green-500", "bg-green-700 dark:bg-green-300"].map((c, i) => (
            <div key={i} className={cn("rounded-sm", c)} style={{ width: 10, height: 10 }} />
          ))}
          <span className="text-[10px] text-muted-foreground">많음</span>
        </div>
      </CardContent>
    </Card>
  );
}
