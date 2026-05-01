import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subDays } from "date-fns";

const PURGE_AFTER_DAYS = 30;

/**
 * Cron endpoint — permanently deletes soft-deleted items older than N days.
 * Protected by CRON_SECRET bearer token.
 *
 * Schedule: daily (e.g., 3 AM) via Vercel Cron, EventBridge, etc.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = subDays(new Date(), PURGE_AFTER_DAYS);
  const where = { archivedAt: { lt: cutoff } };

  try {
    // Delete in dependency-safe order: leaves first, then parents.
    // Tasks first (subtasks cascade via self-relation)
    const [
      tasks,
      epics,
      stories,
      sprints,
      milestones,
      projects,
      goals,
      workspaces,
    ] = await Promise.all([
      db.task.deleteMany({ where }),
      db.epic.deleteMany({ where }),
      db.story.deleteMany({ where }),
      db.sprint.deleteMany({ where }),
      db.milestone.deleteMany({ where }),
      db.project.deleteMany({ where }),
      db.goal.deleteMany({ where }),
      db.workspace.deleteMany({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      cutoff: cutoff.toISOString(),
      purged: {
        tasks: tasks.count,
        epics: epics.count,
        stories: stories.count,
        sprints: sprints.count,
        milestones: milestones.count,
        projects: projects.count,
        goals: goals.count,
        workspaces: workspaces.count,
      },
      processedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Purge trash cron error:", e);
    return NextResponse.json({ ok: false, error: "Purge failed" }, { status: 500 });
  }
}
