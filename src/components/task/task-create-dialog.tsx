"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BlockEditor = dynamic(() => import("@/components/editor/block-editor").then((m) => ({ default: m.BlockEditor })), { ssr: false, loading: () => <div className="h-[80px] rounded-md border animate-pulse bg-muted" /> });
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus, BookmarkCheck, FileText } from "lucide-react";
import { useServerAction } from "@/hooks/use-server-action";
import { createTask } from "@/actions/task";
import { assignLabel, createLabel } from "@/actions/label";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS, DEFAULT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultStatus?: string;
  storyId?: string | null;
  epicId?: string | null;
}

export function TaskCreateDialog({ open, onOpenChange, projectId, defaultStatus = "todo", storyId: defaultStoryId, epicId: defaultEpicId }: TaskCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [memberId, setMemberId] = useState("");
  const [epicId, setEpicId] = useState(defaultEpicId ?? "");
  const [storyId, setStoryId] = useState(defaultStoryId ?? "");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [epics, setEpics] = useState<{ id: string; name: string }[]>([]);
  const [stories, setStories] = useState<{ id: string; title: string }[]>([]);
  const [labels, setLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string; title: string; description: string | null; priority: string; estimatedHours: number | null }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (open) {
      fetch("/api/members").then((r) => r.json()).then(setMembers).catch(() => {});
      fetch(`/api/projects/${projectId}/hierarchy`).then((r) => r.json()).then((data) => {
        setEpics(data.epics ?? []);
        setStories(data.stories ?? []);
        setLabels(data.labels ?? []);
        if (data.workspaceId) setWorkspaceId(data.workspaceId);
      }).catch(() => {});
      // Pre-load templates
      if (templates.length === 0) {
        setLoadingTemplates(true);
        fetch("/api/templates").then((r) => r.json()).then(setTemplates).catch(() => {}).finally(() => setLoadingTemplates(false));
      }
    }
  }, [open, projectId]);

  useEffect(() => {
    setEpicId(defaultEpicId ?? "");
    setStoryId(defaultStoryId ?? "");
    setStatus(defaultStatus);
  }, [defaultEpicId, defaultStoryId, defaultStatus, open]);

  // Start every open with a clean form so a previous task's input (title,
  // description, labels…) never carries over into the next created task.
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setPriority("none");
    setDueDate("");
    setMemberId("");
    setSelectedLabelIds([]);
    setTemplateLoaded(false);
    setEditorKey((k) => k + 1);
  }, [open]);

  const router = useRouter();
  const { execute, isPending } = useServerAction(
    async (input: Parameters<typeof createTask>[0]) => createTask(input),
    {
      onSuccess: async (task) => {
        for (const labelId of selectedLabelIds) {
          await assignLabel(task.id, labelId);
        }
        resetForm();
        onOpenChange(false);
        // Keep the flow going: let the user jump straight into the new task.
        toast.success("태스크가 생성되었습니다", {
          action: {
            label: "열기",
            onClick: () => router.push(`/projects/${projectId}/board?task=${task.id}`),
          },
        });
      },
    }
  );

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus(defaultStatus);
    setPriority("none");
    setDueDate("");
    setMemberId("");
    setEpicId(defaultEpicId ?? "");
    setStoryId(defaultStoryId ?? "");
    setSelectedLabelIds([]);
    setTemplateLoaded(false);
    setEditorKey((k) => k + 1);
  }

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((prev) => prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]);
  }

  function applyTemplate(tpl: typeof templates[number]) {
    setTitle(tpl.title);
    if (tpl.description) {
      setDescription(tpl.description);
      setEditorKey((k) => k + 1);
    }
    setPriority(tpl.priority);
    setTemplateLoaded(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    execute({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
      memberId: memberId || undefined,
      epicId: epicId || undefined,
      storyId: storyId || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[60vw] w-[60vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>태스크 생성</DialogTitle>
        </DialogHeader>

        {/* 템플릿 선택 - 상단 배치 */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2 -mt-1">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground shrink-0">템플릿</span>
            <div className="flex gap-1.5 flex-wrap">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border",
                    templateLoaded && title === tpl.title
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                  title={tpl.description ? `${tpl.title}\n\n${tpl.description.substring(0, 100)}` : tpl.title}
                >
                  <BookmarkCheck className="h-3 w-3" />
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {loadingTemplates && (
          <p className="text-xs text-muted-foreground -mt-1">템플릿 불러오는 중...</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="태스크 제목을 입력하세요" autoFocus />
          </div>

          <div className="space-y-2">
            <Label>설명</Label>
            <BlockEditor key={editorKey} content={description} onChange={setDescription} />
          </div>

          {/* 계층 연결: 에픽/스토리 */}
          <div className="grid grid-cols-2 gap-4">
            {epics.length > 0 && (
              <div className="space-y-2">
                <Label>에픽</Label>
                <Select value={epicId || "_none"} onValueChange={(val) => setEpicId(val === "_none" ? "" : val)}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="에픽 선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">없음</SelectItem>
                    {epics.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {stories.length > 0 && (
              <div className="space-y-2">
                <Label>스토리</Label>
                <Select value={storyId || "_none"} onValueChange={(val) => setStoryId(val === "_none" ? "" : val)}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="스토리 선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">없음</SelectItem>
                    {stories.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>마감일</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>담당자</Label>
              <Select value={memberId || "_none"} onValueChange={(val) => setMemberId(val === "_none" ? "" : val)}>
                <SelectTrigger><SelectValue placeholder="미배정" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">미배정</SelectItem>
                  {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 라벨 선택 + 생성 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>라벨</Label>
              <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowNewLabel(!showNewLabel)}>
                <Plus className="h-3 w-3 mr-1" /> 새 라벨
              </Button>
            </div>

            {showNewLabel && (
              <div className="flex gap-2 items-end bg-muted/50 rounded-md p-2">
                <div className="flex-1 space-y-1">
                  <Input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="라벨 이름"
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing && newLabelName.trim() && workspaceId) {
                        e.preventDefault();
                        createLabel({ workspaceId, name: newLabelName.trim(), color: newLabelColor }).then((res) => {
                          if (res.success) {
                            setLabels((prev) => [...prev, res.data]);
                            setSelectedLabelIds((prev) => [...prev, res.data.id]);
                            setNewLabelName("");
                            setShowNewLabel(false);
                          }
                        });
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    {DEFAULT_COLORS.map((c) => (
                      <button key={c} type="button" className={cn("h-4 w-4 rounded-full border-2", newLabelColor === c ? "border-foreground" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setNewLabelColor(c)} />
                    ))}
                  </div>
                </div>
                <Button
                  type="button" size="sm" className="h-7 text-xs"
                  disabled={!newLabelName.trim() || !workspaceId}
                  onClick={() => {
                    createLabel({ workspaceId, name: newLabelName.trim(), color: newLabelColor }).then((res) => {
                      if (res.success) {
                        setLabels((prev) => [...prev, res.data]);
                        setSelectedLabelIds((prev) => [...prev, res.data.id]);
                        setNewLabelName("");
                        setShowNewLabel(false);
                      }
                    });
                  }}
                >추가</Button>
              </div>
            )}

            {labels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => {
                  const selected = selectedLabelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLabel(l.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all border",
                        selected ? "text-white border-transparent" : "text-muted-foreground border-border hover:border-foreground/30"
                      )}
                      style={selected ? { backgroundColor: l.color } : {}}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {!selected && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />}
                      {l.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">라벨이 없습니다. [새 라벨] 버튼으로 생성하세요.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={!title.trim() || isPending}>생성</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
