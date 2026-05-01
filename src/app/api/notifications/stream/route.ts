import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let lastCheck = new Date();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"));

      intervalId = setInterval(async () => {
        try {
          const [newActivities, newNotifications] = await Promise.all([
            db.activityLog.findMany({
              where: { occurredAt: { gt: lastCheck } },
              orderBy: { occurredAt: "desc" },
              take: 5,
              select: { id: true, entityType: true, action: true, details: true, occurredAt: true },
            }),
            db.notification.findMany({
              where: { createdAt: { gt: lastCheck }, read: false },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: { id: true, type: true, title: true, message: true, link: true, createdAt: true },
            }),
          ]);

          if (newActivities.length > 0 || newNotifications.length > 0) {
            lastCheck = new Date();
            const data: any = {};
            if (newActivities.length > 0) data.type = "activities"; data.items = newActivities;
            if (newNotifications.length > 0) data.mentions = newNotifications;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } else {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }
        } catch {
          // DB error or stream closed — ignore
        }
      }, 5000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
