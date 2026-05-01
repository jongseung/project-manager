"use client";

import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { createMember } from "@/actions/member";
import { DEFAULT_COLORS } from "@/lib/constants";

interface MemberStat {
  id: string;
  name: string;
  role: string | null;
  color: string;
  totalTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  projects: string[];
}

interface MemberStatusProps {
  members: MemberStat[];
  workspaces: { id: string; name: string }[];
}

export function MemberStatus({ members, workspaces }: MemberStatusProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [workspaceId, setWorkspaceId] = useState<string>(workspaces[0]?.id ?? "");

  const { execute: addMember, isPending } = useServerAction(
    async (input: unknown) => createMember(input),
    { successMessage: "멤버가 추가되었습니다", onSuccess: () => { setName(""); setRole(""); setDialogOpen(false); } }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">팀 현황</h2>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> 멤버 추가
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow space-y-2">
            {/* 이름 + 역할 */}
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: member.color }}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium flex-1">{member.name}</span>
              {member.overdue > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-500">
                  <AlertTriangle className="h-2.5 w-2.5" />{member.overdue}
                </span>
              )}
            </div>

            {/* 역할 */}
            {member.role && (
              <span className="text-[11px] text-muted-foreground">{member.role}</span>
            )}

            {/* 프로젝트 뱃지 — 칸반 카드 스타일 */}
            {member.projects.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {member.projects.map((proj) => (
                  <span key={proj} className="inline-flex items-center rounded px-1 py-px text-[10px] font-medium bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border">
                    {proj}
                  </span>
                ))}
              </div>
            )}

            {/* 메타 정보 — 칸반 카드 하단 스타일 */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                {member.inProgress} 진행
              </span>
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {member.completed} 완료
              </span>
              {member.overdue > 0 && (
                <span className="flex items-center gap-0.5 text-red-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {member.overdue} 지연
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>팀 멤버 추가</DialogTitle></DialogHeader>
          {workspaces.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">먼저 워크스페이스를 생성해 주세요.</p>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>닫기</Button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); addMember({ workspaceId, name: name.trim(), role: role.trim() || undefined, color }); }} className="space-y-4">
              <div className="space-y-2">
                <Label>워크스페이스</Label>
                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                  <SelectTrigger><SelectValue placeholder="선택..." /></SelectTrigger>
                  <SelectContent>
                    {workspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>이름</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" autoFocus /></div>
              <div className="space-y-2"><Label>역할 (선택)</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="프론트엔드 개발자" /></div>
              <div className="space-y-2">
                <Label>색상</Label>
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map((c) => (
                    <button key={c} type="button" className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
                <Button type="submit" disabled={!name.trim() || !workspaceId || isPending}>추가</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
