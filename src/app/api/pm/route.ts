import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOrg } from "@/lib/session";

// Unified PM API for Claude Code integration from external projects.
// AUTH: requires an authenticated session scoped to the caller's organization.
// For machine-to-machine use, wrap this behind a personal-access-token layer in future.

export async function GET(req: Request) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const orgScope = { workspace: { organizationId: ctx.orgId } };
  const taskOrgScope = { project: orgScope };

  try {
    switch (action) {
      case "projects": {
        const projects = await db.project.findMany({
          where: { status: "active", archivedAt: null, ...orgScope },
          select: { id: true, name: true, status: true, color: true, workspace: { select: { name: true } } },
          orderBy: { name: "asc" },
        });
        return NextResponse.json(projects);
      }

      case "tasks": {
        const projectId = searchParams.get("projectId");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") ?? "50");
        if (!projectId) return NextResponse.json({ error: "projectId가 필요합니다" }, { status: 400 });

        const proj = await db.project.findFirst({ where: { id: projectId, ...orgScope }, select: { id: true } });
        if (!proj) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });

        const where: Record<string, unknown> = { projectId, parentTaskId: null, archivedAt: null };
        if (status) where.status = status;

        const tasks = await db.task.findMany({
          where,
          select: {
            id: true, title: true, status: true, priority: true,
            dueDate: true, description: true, completedAt: true,
            member: { select: { name: true } },
            epic: { select: { name: true } },
            story: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });
        return NextResponse.json(tasks);
      }

      case "task": {
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });

        const task = await db.task.findFirst({
          where: { id, ...taskOrgScope },
          include: {
            subtasks: { select: { id: true, title: true, status: true }, orderBy: { sortOrder: "asc" } },
            member: { select: { name: true } },
            comments: { orderBy: { createdAt: "desc" }, take: 10, select: { authorName: true, content: true, createdAt: true } },
            epic: { select: { name: true } },
            story: { select: { title: true } },
          },
        });
        if (!task) return NextResponse.json({ error: "태스크를 찾을 수 없습니다" }, { status: 404 });
        return NextResponse.json(task);
      }

      case "backlog": {
        const projectId = searchParams.get("projectId");
        if (!projectId) return NextResponse.json({ error: "projectId가 필요합니다" }, { status: 400 });
        const proj = await db.project.findFirst({ where: { id: projectId, ...orgScope }, select: { id: true } });
        if (!proj) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });

        const tasks = await db.task.findMany({
          where: { projectId, parentTaskId: null, archivedAt: null, status: { in: ["backlog", "todo"] } },
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
          orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
          take: 30,
        });
        return NextResponse.json(tasks);
      }

      case "history": {
        const projectId = searchParams.get("projectId");
        if (!projectId) return NextResponse.json({ error: "projectId가 필요합니다" }, { status: 400 });
        const proj = await db.project.findFirst({ where: { id: projectId, ...orgScope }, select: { id: true } });
        if (!proj) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });

        const tasks = await db.task.findMany({
          where: { projectId, parentTaskId: null, status: "done" },
          select: { id: true, title: true, completedAt: true, description: true },
          orderBy: { completedAt: "desc" },
          take: 30,
        });
        return NextResponse.json(tasks);
      }

      default:
        return NextResponse.json({
          error: "알 수 없는 액션입니다",
          availableActions: ["projects", "tasks", "task", "backlog", "history"],
          usage: {
            projects: "GET /api/pm?action=projects",
            tasks: "GET /api/pm?action=tasks&projectId=<id>&status=<optional>&limit=<optional>",
            task: "GET /api/pm?action=task&id=<taskId>",
            backlog: "GET /api/pm?action=backlog&projectId=<id>",
            history: "GET /api/pm?action=history&projectId=<id>",
          },
        }, { status: 400 });
    }
  } catch (e) {
    console.error("PM API GET error:", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const body = await req.json();
  const { action } = body;
  const orgScope = { workspace: { organizationId: ctx.orgId } };
  const taskOrgScope = { project: orgScope };

  try {
    switch (action) {
      case "createTask": {
        const { projectId, title, description, status = "todo", priority = "none", dueDate, epicId, storyId } = body;
        if (!projectId || !title) return NextResponse.json({ error: "projectId와 title이 필요합니다" }, { status: 400 });

        const proj = await db.project.findFirst({ where: { id: projectId, ...orgScope }, select: { id: true } });
        if (!proj) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });

        const task = await db.task.create({
          data: {
            projectId,
            title,
            description: description ?? undefined,
            status,
            priority,
            dueDate: dueDate ?? undefined,
            epicId: epicId ?? undefined,
            storyId: storyId ?? undefined,
          },
          select: { id: true, title: true, status: true },
        });
        return NextResponse.json(task);
      }

      case "updateTask": {
        const { id, ...updates } = body;
        if (!id) return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });

        const owned = await db.task.findFirst({ where: { id, ...taskOrgScope }, select: { id: true } });
        if (!owned) return NextResponse.json({ error: "태스크를 찾을 수 없습니다" }, { status: 404 });

        const allowed = ["title", "status", "priority", "description", "dueDate"];
        const data: Record<string, unknown> = {};
        for (const key of allowed) {
          if (updates[key] !== undefined) data[key] = updates[key];
        }
        if (data.status === "done") data.completedAt = new Date();

        const task = await db.task.update({
          where: { id },
          data,
          select: { id: true, title: true, status: true },
        });
        return NextResponse.json(task);
      }

      case "addComment": {
        const { taskId, content, authorName = "Claude Code" } = body;
        if (!taskId || !content) return NextResponse.json({ error: "taskId와 content가 필요합니다" }, { status: 400 });

        const owned = await db.task.findFirst({ where: { id: taskId, ...taskOrgScope }, select: { id: true } });
        if (!owned) return NextResponse.json({ error: "태스크를 찾을 수 없습니다" }, { status: 404 });

        const comment = await db.comment.create({
          data: { taskId, content, authorName },
          select: { id: true, content: true, createdAt: true },
        });
        return NextResponse.json(comment);
      }

      case "workLog": {
        const { taskId, message, status: newStatus } = body;
        if (!taskId || !message) return NextResponse.json({ error: "taskId와 message가 필요합니다" }, { status: 400 });

        const owned = await db.task.findFirst({ where: { id: taskId, ...taskOrgScope }, select: { id: true } });
        if (!owned) return NextResponse.json({ error: "태스크를 찾을 수 없습니다" }, { status: 404 });

        const content = `[작업 로그] ${message}`;
        await db.comment.create({ data: { taskId, content, authorName: "Claude Code" } });

        if (newStatus) {
          const data: Record<string, unknown> = { status: newStatus };
          if (newStatus === "done") data.completedAt = new Date();
          await db.task.update({ where: { id: taskId }, data });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({
          error: "알 수 없는 액션입니다",
          availableActions: ["createTask", "updateTask", "addComment", "workLog"],
          usage: {
            createTask: "POST { action: 'createTask', projectId, title, description?, status?, priority? }",
            updateTask: "POST { action: 'updateTask', id, status?, title?, priority?, description? }",
            addComment: "POST { action: 'addComment', taskId, content, authorName? }",
            workLog: "POST { action: 'workLog', taskId, message, status? }",
          },
        }, { status: 400 });
    }
  } catch (e) {
    console.error("PM API POST error:", e);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
