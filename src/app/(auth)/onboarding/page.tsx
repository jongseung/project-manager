"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderKanban, Building2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "조직 생성에 실패했습니다");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("서버 오류가 발생했습니다");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <FolderKanban className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-semibold">시작하기</h1>
          <p className="text-sm text-muted-foreground text-center">조직을 만들어 팀과 함께 프로젝트를 관리하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="orgName">조직 이름</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="회사명 또는 팀명" className="pl-9" required autoFocus />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !orgName.trim()}>
            {loading ? "생성 중..." : "조직 생성"}
          </Button>
        </form>
      </div>
    </div>
  );
}
