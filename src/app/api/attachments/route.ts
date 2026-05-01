import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { requireApiOrg } from "@/lib/session";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = /^(image\/|application\/pdf|application\/zip|text\/|application\/json|application\/vnd\.openxmlformats|application\/msword)/;

export async function POST(request: NextRequest) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string | null;

    if (!file || !taskId) {
      return NextResponse.json({ error: "파일과 태스크 ID가 필요합니다" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "파일 크기는 20MB 이하여야 합니다" }, { status: 413 });
    }
    if (!ALLOWED_TYPES.test(file.type)) {
      return NextResponse.json({ error: "허용되지 않는 파일 형식입니다" }, { status: 415 });
    }

    const task = await db.task.findFirst({
      where: { id: taskId, project: { workspace: { organizationId: ctx.orgId } } },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "태스크를 찾을 수 없습니다" }, { status: 404 });

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const attachment = await db.attachment.create({
      data: {
        taskId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: `/uploads/${uniqueName}`,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "파일 업로드에 실패했습니다" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireApiOrg();
  if ("error" in ctx) return ctx.error;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });

  try {
    const attachment = await db.attachment.findFirst({
      where: { id, task: { project: { workspace: { organizationId: ctx.orgId } } } },
      select: { id: true, url: true },
    });
    if (!attachment) return NextResponse.json({ error: "첨부파일을 찾을 수 없습니다" }, { status: 404 });

    await db.attachment.delete({ where: { id } });
    if (attachment.url?.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", attachment.url);
      await unlink(filePath).catch(() => {});
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "삭제에 실패했습니다" }, { status: 500 });
  }
}
