"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Loader2 } from "lucide-react";

export default function SetupPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function provision() {
      try {
        const res = await fetch("/api/session/provision", { method: "POST" });
        if (cancelled) return;
        if (res.ok) {
          // Full-page navigation: guarantees the server re-reads the freshly
          // set session cookie and re-runs middleware. (router.push + refresh
          // race each other and abort the RSC navigation, leaving us stuck.)
          window.location.assign("/dashboard");
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    provision();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <FolderKanban className="h-6 w-6" />
        </div>
        {failed ? (
          <>
            <p className="text-sm text-muted-foreground">세션 생성에 실패했습니다.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              다시 시도
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">세션을 생성하고 있습니다...</p>
          </>
        )}
      </div>
    </div>
  );
}
