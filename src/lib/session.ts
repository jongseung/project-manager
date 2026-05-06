import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const COOKIE_NAME = "pm-user-id";

/**
 * Get user ID from cookie. Returns null if not set.
 */
async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser() {
  const userId = await getUserIdFromCookie();
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, image: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/setup");
  return user;
}

export async function getCurrentOrganization() {
  const user = await requireUser();

  const membership = await db.orgMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { organization: { createdAt: "asc" } },
  });

  if (!membership) return null;

  return {
    user,
    organization: membership.organization,
    orgRole: membership.role as "owner" | "admin" | "member",
  };
}

export async function requireOrganization() {
  const ctx = await getCurrentOrganization();
  if (!ctx) redirect("/setup");
  return ctx;
}

/**
 * Returns the current user's organization ID or null.
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const userId = await getUserIdFromCookie();
  if (!userId) return null;
  const membership = await db.orgMember.findFirst({
    where: { userId },
    select: { organizationId: true },
    orderBy: { organization: { createdAt: "asc" } },
  });
  return membership?.organizationId ?? null;
}

/**
 * For API routes - returns userId and orgId or error response.
 */
export async function requireApiOrg(): Promise<{ userId: string; orgId: string } | { error: Response }> {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return { error: new Response(JSON.stringify({ error: "세션이 없습니다" }), { status: 401, headers: { "content-type": "application/json" } }) };
  }
  const membership = await db.orgMember.findFirst({
    where: { userId },
    select: { organizationId: true },
    orderBy: { organization: { createdAt: "asc" } },
  });
  if (!membership) {
    return { error: new Response(JSON.stringify({ error: "조직이 없습니다" }), { status: 403, headers: { "content-type": "application/json" } }) };
  }
  return { userId, orgId: membership.organizationId };
}

export async function userOwnsProject(projectId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.project.findFirst({
    where: { id: projectId, workspace: { organizationId: orgId } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsWorkspace(workspaceId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.workspace.findFirst({
    where: { id: workspaceId, organizationId: orgId },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsTask(taskId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.task.findFirst({
    where: { id: taskId, project: { workspace: { organizationId: orgId } } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsGoal(goalId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.goal.findFirst({
    where: { id: goalId, workspace: { organizationId: orgId } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsObjective(objectiveId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.objective.findFirst({
    where: { id: objectiveId, project: { workspace: { organizationId: orgId } } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsKeyResult(krId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.keyResult.findFirst({
    where: { id: krId, objective: { project: { workspace: { organizationId: orgId } } } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsStory(storyId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.story.findFirst({
    where: { id: storyId, project: { workspace: { organizationId: orgId } } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsEpic(epicId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.epic.findFirst({
    where: { id: epicId, project: { workspace: { organizationId: orgId } } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsSprint(sprintId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.sprint.findFirst({
    where: { id: sprintId, project: { workspace: { organizationId: orgId } } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsMilestone(milestoneId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.milestone.findFirst({
    where: { id: milestoneId, project: { workspace: { organizationId: orgId } } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsKPI(kpiId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.kPI.findFirst({
    where: {
      id: kpiId,
      OR: [
        { project: { workspace: { organizationId: orgId } } },
        { goal: { workspace: { organizationId: orgId } } },
      ],
    },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsLabel(labelId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.label.findFirst({
    where: { id: labelId, workspace: { organizationId: orgId } },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsMindMap(mapId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.mindMap.findFirst({
    where: {
      id: mapId,
      OR: [
        { project: { workspace: { organizationId: orgId } } },
        { projectId: null },
      ],
    },
    select: { id: true },
  });
  return hit !== null;
}

export async function userOwnsRecurringTemplate(templateId: string): Promise<boolean> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return false;
  const hit = await db.recurringTemplate.findFirst({
    where: { id: templateId, workspace: { organizationId: orgId } },
    select: { id: true },
  });
  return hit !== null;
}

export async function requireAuthForGlobalAction(): Promise<null | { kind: "failure"; message: string }> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return { kind: "failure", message: "세션이 없습니다" };
  return null;
}

export async function checkProjectAccess(projectId: string, requiredRole: "viewer" | "editor" | "owner" = "viewer") {
  const user = await requireUser();

  const projectMember = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });

  const orgAccess = await db.orgMember.findFirst({
    where: {
      userId: user.id,
      role: { in: ["owner", "admin"] },
      organization: {
        workspaces: { some: { projects: { some: { id: projectId } } } },
      },
    },
  });

  if (orgAccess) return { user, role: orgAccess.role };

  if (!projectMember) return null;

  const roleHierarchy = { viewer: 0, editor: 1, owner: 2 };
  if (roleHierarchy[projectMember.role as keyof typeof roleHierarchy] < roleHierarchy[requiredRole]) {
    return null;
  }

  return { user, role: projectMember.role };
}
