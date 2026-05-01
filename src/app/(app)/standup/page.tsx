import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { getStandupData } from "@/actions/standup";
import { getMembersWithStats } from "@/actions/member";
import { StandupView } from "./standup-view";
import { StandupCalendar } from "./standup-calendar";
import { MemberStatus } from "./member-status";
import { todayDateString } from "@/lib/utils";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/session";

export default async function StandupPage() {
  const ctx = await requireOrganization();
  const today = todayDateString();
  const data = await getStandupData(today);
  const members = await getMembersWithStats();

  // Scope calendar notes to caller's organization.
  const notes = await db.standupNote.findMany({
    where: { organizationId: ctx.organization.id },
    orderBy: { date: "desc" },
    take: 60,
    select: { date: true, yesterday: true, today: true, blockers: true, actionItems: true, retro: true, meetingStartedAt: true, meetingEndedAt: true },
  });

  const workspaces = await db.workspace.findMany({
    where: { organizationId: ctx.organization.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Header title="데일리 스크럼">
        <span className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </span>
      </Header>
      <div className="p-6 max-w-full space-y-8">
        {/* 1. Standup Calendar — 날짜별 히스토리 (최상단) */}
        <StandupCalendar notes={notes} />

        {/* 2. Team Status — 멤버별 현황 */}
        <MemberStatus members={members} workspaces={workspaces} />

        {/* 3. Today's Standup — 어제/오늘/블로커/리뷰 */}
        <StandupView data={data} />
      </div>
    </div>
  );
}
