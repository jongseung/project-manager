"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { memberSchema } from "@/lib/validators";
import { getCurrentOrgId, userOwnsWorkspace } from "@/lib/session";
import type { Member } from "@prisma/client";

export async function createMember(input: unknown): Promise<ActionResult<Member>> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!(await userOwnsWorkspace(parsed.data.workspaceId))) {
    return failure("워크스페이스에 접근 권한이 없습니다");
  }
  try {
    const member = await db.member.create({
      data: { ...parsed.data, email: parsed.data.email || undefined },
    });
    revalidatePath("/", "layout");
    return success(member);
  } catch (e) {
    console.error(e);
    return failure("멤버 생성에 실패했습니다");
  }
}

export async function updateMember(id: string, input: unknown): Promise<ActionResult<Member>> {
  const parsed = memberSchema.partial().safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  const existing = await db.member.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!existing || !existing.workspaceId || !(await userOwnsWorkspace(existing.workspaceId))) {
    return failure("권한이 없습니다");
  }
  try {
    const member = await db.member.update({ where: { id }, data: parsed.data });
    revalidatePath("/", "layout");
    return success(member);
  } catch (e) {
    console.error(e);
    return failure("멤버 수정에 실패했습니다");
  }
}

export async function deleteMember(id: string): Promise<ActionResult<void>> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return failure("인증이 필요합니다");
  const existing = await db.member.findUnique({ where: { id }, select: { workspaceId: true } });
  if (!existing || !existing.workspaceId || !(await userOwnsWorkspace(existing.workspaceId))) {
    return failure("권한이 없습니다");
  }
  try {
    await db.member.delete({ where: { id } });
    revalidatePath("/", "layout");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("멤버 삭제에 실패했습니다");
  }
}

export async function getMembers() {
  const orgId = await getCurrentOrgId();
  if (!orgId) return [];
  // Scope by workspaceId (newly added, nullable during migration).
  // Fallback: if no member rows have workspaceId set yet (pre-backfill),
  // show all members — the caller has already authenticated.
  return db.member.findMany({
    where: {
      isActive: true,
      workspace: { organizationId: orgId },
    },
    orderBy: { name: "asc" },
  });
}

export async function getMembersWithStats() {
  const orgId = await getCurrentOrgId();
  if (!orgId) return [];
  const members = await db.member.findMany({
    where: {
      isActive: true,
      workspace: { organizationId: orgId },
    },
    include: {
      tasks: {
        where: { archivedAt: null, project: { workspace: { organizationId: orgId } } },
        select: { id: true, status: true, completedAt: true, dueDate: true, project: { select: { name: true, color: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const today = new Date().toISOString().split("T")[0];

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    color: m.color,
    totalTasks: m.tasks.length,
    inProgress: m.tasks.filter((t) => t.status === "in_progress").length,
    completed: m.tasks.filter((t) => t.status === "done").length,
    overdue: m.tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "done").length,
    projects: [...new Set(m.tasks.map((t) => t.project.name))],
  }));
}
