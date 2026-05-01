import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { RoutinesView } from "./routines-view";

export default async function RoutinesPage() {
  const [templates, workspaces, members] = await Promise.all([
    db.recurringTemplate.findMany({
      include: {
        subtaskTemplates: { orderBy: { sortOrder: "asc" } },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ isActive: "desc" }, { frequency: "asc" }, { title: "asc" }],
    }),
    db.workspace.findMany({
      where: { archivedAt: null },
      include: {
        projects: {
          where: { status: { not: "archived" }, archivedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.member.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <Header title="반복 업무" />
      <RoutinesView templates={templates} workspaces={workspaces} members={members} />
    </div>
  );
}
