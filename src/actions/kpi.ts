"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { success, failure, type ActionResult } from "@/lib/action-utils";
import { logActivity } from "./activity";
import { kpiSchema } from "@/lib/validators";
import { userOwnsGoal, userOwnsProject, userOwnsKPI } from "@/lib/session";
import type { KPI } from "@prisma/client";

export async function createKPI(input: unknown): Promise<ActionResult<KPI>> {
  const parsed = kpiSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error.errors[0]?.message ?? "잘못된 입력입니다");
  if (!parsed.data.goalId && !parsed.data.projectId) {
    return failure("KPI must be linked to a goal or project");
  }
  if (parsed.data.goalId && !(await userOwnsGoal(parsed.data.goalId))) return failure("목표에 접근 권한이 없습니다");
  if (parsed.data.projectId && !(await userOwnsProject(parsed.data.projectId))) return failure("프로젝트에 접근 권한이 없습니다");

  try {
    const kpi = await db.kPI.create({ data: parsed.data });
    await logActivity("kpi", kpi.id, "created", { name: kpi.name });
    revalidatePath("/goals");
    return success(kpi);
  } catch (e) {
    console.error(e);
    return failure("KPI 생성에 실패했습니다");
  }
}

export async function recordKPIEntry(
  kpiId: string,
  value: number,
  note?: string
): Promise<ActionResult<void>> {
  if (!(await userOwnsKPI(kpiId))) return failure("KPI에 접근 권한이 없습니다");
  try {
    await db.kPIEntry.create({ data: { kpiId, value, note } });
    await db.kPI.update({ where: { id: kpiId }, data: { currentValue: value } });
    revalidatePath("/goals");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("KPI 기록에 실패했습니다");
  }
}

export async function getKPITrend(kpiId: string) {
  if (!(await userOwnsKPI(kpiId))) return [];
  return db.kPIEntry.findMany({
    where: { kpiId },
    orderBy: { recordedAt: "asc" },
  });
}

export async function deleteKPI(id: string): Promise<ActionResult<void>> {
  if (!(await userOwnsKPI(id))) return failure("KPI에 접근 권한이 없습니다");
  try {
    await db.kPI.delete({ where: { id } });
    revalidatePath("/goals");
    return success(undefined);
  } catch (e) {
    console.error(e);
    return failure("KPI 삭제에 실패했습니다");
  }
}
