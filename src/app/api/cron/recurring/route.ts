import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { processRecurringTemplates } from "@/actions/recurring";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processRecurringTemplates();
    return NextResponse.json({
      ok: true,
      ...result,
      processedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Cron recurring error:", e);
    return NextResponse.json({ ok: false, error: "Processing failed" }, { status: 500 });
  }
}
