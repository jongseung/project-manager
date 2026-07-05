import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Landing } from "@/components/marketing/landing";

export default async function Home() {
  // Returning visitors (with a session) go straight to the app; new visitors
  // see the landing page.
  const store = await cookies();
  if (store.get("pm-user-id")?.value) redirect("/today");
  return <Landing />;
}
