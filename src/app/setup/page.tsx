"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();

  useEffect(() => {
    async function provision() {
      const res = await fetch("/api/session/provision", { method: "POST" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    }
    provision();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <FolderKanban className="h-10 w-10 text-primary" />
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">세션을 생성하고 있습니다...</p>
      </div>
    </div>
  );
}
