import { Sidebar, MobileSidebar } from "./sidebar";
import { db } from "@/lib/db";
import { getCurrentOrganization } from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentOrganization();
  const orgFilter = ctx?.organization.id ? { organizationId: ctx.organization.id } : {};

  const workspaces = await db.workspace.findMany({
    where: { ...orgFilter, archivedAt: null },
    include: {
      projects: {
        where: { status: { not: "archived" }, archivedAt: null },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaces={workspaces} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center border-b px-4 md:hidden">
          <MobileSidebar workspaces={workspaces} />
          <span className="ml-2 text-lg font-semibold">PM</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
