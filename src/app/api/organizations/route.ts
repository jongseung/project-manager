import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrgSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const slug = `org-${Date.now().toString(36)}`;

    const org = await db.organization.create({
      data: {
        name: parsed.data.name,
        slug,
        members: {
          create: { userId: session.user.id, role: "owner" },
        },
      },
    });

    return NextResponse.json(org, { status: 201 });
  } catch {
    return NextResponse.json({ error: "조직 생성에 실패했습니다" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const memberships = await db.orgMember.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  return NextResponse.json(memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  })));
}
