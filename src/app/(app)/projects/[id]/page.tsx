import { redirect } from "next/navigation";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const { id } = await params;
  const { task } = await searchParams;
  // A task deep-link opens on the board; otherwise land on the 흐름(flow)
  // overview so the project's status & progress are visible immediately.
  redirect(task ? `/projects/${id}/board?task=${task}` : `/projects/${id}/flow`);
}
