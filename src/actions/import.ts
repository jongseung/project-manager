"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { getCurrentOrgId } from "@/lib/session";
import { TASK_STATUSES } from "@/lib/constants";

export async function importData(jsonString: string): Promise<ActionResult<{ imported: number }>> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");

  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !parsed.version) {
      return failure("잘못된 백업 형식입니다. data 또는 version 필드가 없습니다.");
    }

    const { data } = parsed;
    let imported = 0;

    await db.$transaction(async (tx) => {
      // Workspaces are force-scoped to the caller's current organization
      if (data.workspaces?.length) {
        for (const ws of data.workspaces) {
          const safe = { ...ws, organizationId: orgId };
          await tx.workspace.upsert({ where: { id: ws.id }, create: safe, update: safe });
          imported++;
        }
      }
      if (data.members?.length) {
        for (const m of data.members) {
          await tx.member.upsert({ where: { id: m.id }, create: m, update: m });
          imported++;
        }
      }
      // Projects are only imported if their workspace belongs to this org
      if (data.projects?.length) {
        for (const p of data.projects) {
          const ws = await tx.workspace.findFirst({ where: { id: p.workspaceId, organizationId: orgId }, select: { id: true } });
          if (!ws) continue;
          await tx.project.upsert({ where: { id: p.id }, create: p, update: p });
          imported++;
        }
      }
      if (data.labels?.length) {
        for (const l of data.labels) {
          const ws = await tx.workspace.findFirst({ where: { id: l.workspaceId, organizationId: orgId }, select: { id: true } });
          if (!ws) continue;
          await tx.label.upsert({ where: { id: l.id }, create: l, update: l });
          imported++;
        }
      }
      if (data.epics?.length) {
        for (const e of data.epics) {
          const proj = await tx.project.findFirst({
            where: { id: e.projectId, workspace: { organizationId: orgId } },
            select: { id: true },
          });
          if (!proj) continue;
          await tx.epic.upsert({ where: { id: e.id }, create: e, update: e });
          imported++;
        }
      }
      if (data.tasks?.length) {
        for (const t of data.tasks) {
          const proj = await tx.project.findFirst({
            where: { id: t.projectId, workspace: { organizationId: orgId } },
            select: { id: true },
          });
          if (!proj) continue;
          await tx.task.upsert({ where: { id: t.id }, create: t, update: t });
          imported++;
        }
      }
      if (data.goals?.length) {
        for (const g of data.goals) {
          const ws = await tx.workspace.findFirst({ where: { id: g.workspaceId, organizationId: orgId }, select: { id: true } });
          if (!ws) continue;
          await tx.goal.upsert({ where: { id: g.id }, create: g, update: g });
          imported++;
        }
      }
      if (data.milestones?.length) {
        for (const m of data.milestones) {
          const proj = await tx.project.findFirst({
            where: { id: m.projectId, workspace: { organizationId: orgId } },
            select: { id: true },
          });
          if (!proj) continue;
          await tx.milestone.upsert({ where: { id: m.id }, create: m, update: m });
          imported++;
        }
      }
    });

    revalidatePath("/", "layout");
    return success({ imported });
  } catch (e) {
    console.error(e);
    return failure("Import failed: " + (e instanceof Error ? e.message : "Unknown error"));
  }
}

export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: string
): Promise<ActionResult<{ updated: number }>> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  if (taskIds.length === 0) return success({ updated: 0 });
  if (!(TASK_STATUSES as readonly string[]).includes(status)) {
    return failure(`유효하지 않은 상태입니다: ${status}`);
  }

  try {
    const result = await db.task.updateMany({
      where: {
        id: { in: taskIds },
        project: { workspace: { organizationId: orgId } },
      },
      data: {
        status,
        ...(status === "done" ? { completedAt: new Date() } : {}),
        ...(status !== "done" ? { completedAt: null } : {}),
      },
    });
    revalidatePath("/", "layout");
    return success({ updated: result.count });
  } catch (e) {
    console.error(e);
    return failure("태스크 수정에 실패했습니다");
  }
}
