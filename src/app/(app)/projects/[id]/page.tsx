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
  // Forward ?task= so deep-links to the project root still open the task.
  redirect(`/projects/${id}/board${task ? `?task=${task}` : ""}`);
}
