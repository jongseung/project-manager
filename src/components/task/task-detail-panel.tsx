"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, CheckCircle2, Circle, Send, X, ChevronDown, Maximize2, Minimize2, GripVertical, Save, BookmarkPlus, Link2 } from "lucide-react";

const BlockEditor = dynamic(() => import("@/components/editor/block-editor").then((m) => ({ default: m.BlockEditor })), { ssr: false, loading: () => <div className="h-[120px] rounded-md border animate-pulse bg-muted" /> });
const CommentEditor = dynamic(() => import("@/components/editor/comment-editor").then((m) => ({ default: m.CommentEditor })), { ssr: false });
import type { CommentEditorRef } from "@/components/editor/comment-editor";

import { updateTask, deleteTask, restoreTask, createTask } from "@/actions/task";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CommentItem } from "./comment-item";
import { saveTaskAsTemplate } from "@/actions/template";
import { createComment } from "@/actions/comment";
import { assignLabel, removeLabel, createLabel } from "@/actions/label";
import { createDependency, deleteDependency } from "@/actions/dependency";
import { DEFAULT_COLORS } from "@/lib/constants";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatRelativeDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task } from "@prisma/client";

type DepLink = { id: string; predecessorTask?: { id: string; title: string; status: string }; successorTask?: { id: string; title: string; status: string } };

type FullTask = Task & {
  subtasks: Task[];
  member: { id: string; name: string; color: string } | null;
  comments: {
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
    parentCommentId: string | null;
    reactions: { id: string; emoji: string; authorName: string }[];
  }[];
  labels: { label: { id: string; name: string; color: string } }[];
  epic: { id: string; name: string } | null;
  story: { id: string; title: string } | null;
  predecessorDeps?: DepLink[];
  successorDeps?: DepLink[];
  attachments?: { id: string; fileName: string; fileSize: number; mimeType: string; url: string }[];
};

interface TaskDetailPanelProps {
  task: { id: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Notion-style inline select
function PropertySelect({ value, options, onChange }: {
  value: string;
  options: { value: string; label: string; color?: string }[];
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent transition-colors">
        {current?.color && <span className={cn("inline-block h-2 w-2 rounded-full shrink-0")} style={{ backgroundColor: current.color }} />}
        <span>{current?.label ?? value}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[140px]">
            {options.map((o) => (
              <button key={o.value} onClick={() => { onChange(o.value); setIsOpen(false); }}
                className={cn("flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left",
                  o.value === value && "bg-accent"
                )}>
                {o.color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: o.color }} />}
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "#9ca3af", todo: "#3b82f6", in_progress: "#eab308",
  in_review: "#8b5cf6", done: "#22c55e", cancelled: "#ef4444",
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444", high: "#f97316", medium: "#eab308", low: "#3b82f6", none: "#9ca3af",
};

export function TaskDetailPanel({ task: taskRef, open, onOpenChange }: TaskDetailPanelProps) {
  const router = useRouter();
  const [task, setTask] = useState<FullTask | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string; color: string }[]>([]);
  const commentEditorApi = useRef<CommentEditorRef | null>(null);
  const [wsLabels, setWsLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<{ id: string; action: string; details: string | null; occurredAt: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModal, setIsModal] = useState(false);
  const [panelWidth, setPanelWidth] = useState(540);
  const [showDepSearch, setShowDepSearch] = useState<"predecessor" | "successor" | null>(null);
  const [depQuery, setDepQuery] = useState("");
  const [projectTasks, setProjectTasks] = useState<{ id: string; title: string; status: string }[]>([]);
  const isResizing = useRef(false);

  const fetchTask = useCallback(async () => {
    if (!taskRef?.id) return;
    try {
      const res = await fetch(`/api/tasks/${taskRef.id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setDueDate(data.dueDate ?? "");
      }
    } catch { /* silent */ }
  }, [taskRef?.id]);

  useEffect(() => {
    if (open && taskRef?.id) {
      fetchTask();
      fetch("/api/members").then((r) => r.json()).then(setMembers).catch(() => {});
      fetch(`/api/tasks/${taskRef.id}/activity`).then((r) => r.json()).then(setActivities).catch(() => {});
    }
  }, [open, taskRef?.id, fetchTask]);

  useEffect(() => {
    if (open && task?.projectId) {
      fetch(`/api/projects/${task.projectId}/hierarchy`).then((r) => r.json()).then((d) => { setWsLabels(d.labels ?? []); if (d.workspaceId) setWorkspaceId(d.workspaceId); }).catch(() => {});
    }
  }, [open, task?.projectId]);

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;

    function onMouseMove(ev: MouseEvent) {
      if (!isResizing.current) return;
      const newWidth = Math.max(400, Math.min(900, startWidth + (startX - ev.clientX)));
      setPanelWidth(newWidth);
    }
    function onMouseUp() {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  // IMPORTANT: keep this hook before any early return to satisfy Rules of Hooks.
  const { del: softDelete } = useSoftDelete({
    deleteFn: deleteTask,
    restoreFn: restoreTask,
    label: "태스크",
  });

  if (!task) return null;

  const subtasks = task.subtasks ?? [];
  const comments = task.comments ?? [];
  const taskLabels = task.labels ?? [];
  const subtaskDone = subtasks.filter((s) => s.status === "done").length;
  const subtaskPct = subtasks.length > 0 ? Math.round((subtaskDone / subtasks.length) * 100) : 0;

  async function handleSave() {
    setSaving(true);
    const res = await updateTask({ id: task!.id, title: title.trim(), description: description.trim() || undefined, dueDate: dueDate || undefined });
    setSaving(false);
    if (res.success) { toast.success("저장됨"); fetchTask(); router.refresh(); }
    else toast.error(res.error);
  }

  async function handleStatusChange(status: string) {
    const res = await updateTask({ id: task!.id, status });
    if (res.success) { fetchTask(); router.refresh(); }
  }

  async function handlePriorityChange(priority: string) {
    const res = await updateTask({ id: task!.id, priority });
    if (res.success) { fetchTask(); router.refresh(); }
  }

  async function handleMemberChange(memberId: string) {
    const res = await updateTask({ id: task!.id, memberId: memberId || undefined });
    if (res.success) { fetchTask(); router.refresh(); }
  }

  function handleDelete() {
    if (!task) return;
    softDelete(task.id, {
      itemName: task.title,
      onDeleted: () => { onOpenChange(false); router.refresh(); },
      onRestored: () => router.refresh(),
    });
  }

  async function handleAddSubtask() {
    if (!newSubtask.trim()) return;
    const res = await createTask({ projectId: task!.projectId, parentTaskId: task!.id, title: newSubtask.trim(), status: "todo" });
    if (res.success) { setNewSubtask(""); fetchTask(); }
  }

  async function handleToggleSubtask(st: Task) {
    await updateTask({ id: st.id, status: st.status === "done" ? "todo" : "done" });
    fetchTask();
  }

  async function handleAddComment() {
    const api = commentEditorApi.current;
    if (!api || api.isEmpty()) return;
    const content = JSON.stringify(api.getJSON());
    const mentionedIds = api.getMentionedUserIds();
    const res = await createComment({ taskId: task!.id, content, mentions: mentionedIds.length > 0 ? JSON.stringify(mentionedIds) : undefined });
    if (res.success) {
      api.clear();
      fetchTask();
    }
  }

  async function handleToggleLabel(labelId: string) {
    const assigned = taskLabels.some((l) => l.label.id === labelId);
    if (assigned) await removeLabel(task!.id, labelId);
    else await assignLabel(task!.id, labelId);
    fetchTask();
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim() || !workspaceId) return;
    const res = await createLabel({ workspaceId, name: newLabelName.trim(), color: newLabelColor });
    if (res.success) {
      setWsLabels((prev) => [...prev, res.data]);
      await assignLabel(task!.id, res.data.id);
      setNewLabelName("");
      setShowNewLabel(false);
      setNewLabelColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
      fetchTask();
    }
  }

  async function uploadFile(file: File) {
    if (!task) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", task.id);
    try {
      const res = await fetch("/api/attachments", { method: "POST", body: formData });
      if (res.ok) { toast.success("파일이 첨부되었습니다"); fetchTask(); }
      else toast.error("업로드 실패");
    } catch { toast.error("업로드 실패"); }
    setUploading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const named = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
          uploadFile(named);
        }
        return;
      }
    }
  }

  async function openDepSearch(type: "predecessor" | "successor") {
    setShowDepSearch(type);
    setDepQuery("");
    if (projectTasks.length === 0 && task) {
      try {
        const res = await fetch(`/api/projects/${task.projectId}/tasks`);
        if (res.ok) setProjectTasks(await res.json());
      } catch { /* silent */ }
    }
  }

  async function handleAddDependency(otherTaskId: string) {
    if (!task) return;
    const input = showDepSearch === "predecessor"
      ? { predecessorTaskId: otherTaskId, successorTaskId: task.id }
      : { predecessorTaskId: task.id, successorTaskId: otherTaskId };
    const res = await createDependency(input);
    if (res.success) {
      setShowDepSearch(null);
      fetchTask();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDeleteDep(depId: string) {
    const res = await deleteDependency(depId);
    if (res.success) fetchTask();
  }

  async function handleDeleteAttachment(id: string) {
    await fetch(`/api/attachments?id=${id}`, { method: "DELETE" });
    fetchTask();
  }

  const memberOptions = [{ value: "_none", label: "미배정" }, ...members.map((m) => ({ value: m.id, label: m.name, color: m.color }))];

  const panelContent = (
    <div onPaste={handlePaste} tabIndex={-1} className="outline-none">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.epic && <span>{task.epic.name}</span>}
            {task.epic && task.story && <span>/</span>}
            {task.story && <span>{task.story.title}</span>}
            {!task.epic && !task.story && <span>태스크 상세</span>}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setIsModal(!isModal)} title={isModal ? "사이드 패널로 전환" : "모달로 전환"}>
              {isModal ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={async () => {
              const name = window.prompt("템플릿 이름을 입력하세요", task!.title);
              if (!name?.trim()) return;
              const res = await saveTaskAsTemplate(task!.id, name.trim());
              if (res.success) toast.success("템플릿으로 저장되었습니다");
              else toast.error(res.error);
            }} title="템플릿으로 저장">
              <BookmarkPlus className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 제목 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { if (title.trim() !== task.title) handleSave(); }}
            className="w-full text-lg font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50"
            placeholder="태스크 제목"
          />

          {/* 속성 */}
          <div className="space-y-0.5">
            <div className="flex items-center h-8">
              <span className="text-xs text-muted-foreground w-20 shrink-0">상태</span>
              <PropertySelect
                value={task.status}
                options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s], color: STATUS_COLORS[s] }))}
                onChange={handleStatusChange}
              />
            </div>
            <div className="flex items-center h-8">
              <span className="text-xs text-muted-foreground w-20 shrink-0">우선순위</span>
              <PropertySelect
                value={task.priority}
                options={TASK_PRIORITIES.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p], color: PRIORITY_COLORS[p] }))}
                onChange={handlePriorityChange}
              />
            </div>
            <div className="flex items-center h-8">
              <span className="text-xs text-muted-foreground w-20 shrink-0">담당자</span>
              <PropertySelect
                value={task.memberId ?? "_none"}
                options={memberOptions}
                onChange={(v) => handleMemberChange(v === "_none" ? "" : v)}
              />
            </div>
            <div className="flex items-center h-8">
              <span className="text-xs text-muted-foreground w-20 shrink-0">마감일</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); }}
                  onBlur={() => { if (dueDate !== (task.dueDate ?? "")) handleSave(); }}
                  className="text-xs bg-transparent outline-none rounded px-2 py-1 hover:bg-accent transition-colors cursor-pointer"
                />
                {dueDate && (
                  <button onClick={() => { setDueDate(""); updateTask({ id: task.id, dueDate: undefined }).then(() => { fetchTask(); router.refresh(); }); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center h-8">
              <span className="text-xs text-muted-foreground w-20 shrink-0">예상 공수</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={task.estimatedHours ?? ""}
                  onChange={(e) => { const v = e.target.value ? parseFloat(e.target.value) : undefined; updateTask({ id: task.id, estimatedHours: v }).then(() => { fetchTask(); router.refresh(); }); }}
                  className="w-16 text-xs bg-transparent outline-none rounded px-2 py-1 hover:bg-accent transition-colors"
                  placeholder="—"
                />
                <span className="text-[10px] text-muted-foreground">시간</span>
              </div>
            </div>
            <div className="flex items-center h-8">
              <span className="text-xs text-muted-foreground w-20 shrink-0">실제 공수</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={task.actualHours ?? ""}
                  onChange={(e) => { const v = e.target.value ? parseFloat(e.target.value) : undefined; updateTask({ id: task.id, actualHours: v }).then(() => { fetchTask(); router.refresh(); }); }}
                  className="w-16 text-xs bg-transparent outline-none rounded px-2 py-1 hover:bg-accent transition-colors"
                  placeholder="—"
                />
                <span className="text-[10px] text-muted-foreground">시간</span>
                {task.estimatedHours && task.actualHours ? (
                  <span className={cn("text-[10px] ml-1", task.actualHours > task.estimatedHours ? "text-red-500" : "text-green-600")}>
                    {task.actualHours > task.estimatedHours ? `+${(task.actualHours - task.estimatedHours).toFixed(1)}` : `-${(task.estimatedHours - task.actualHours).toFixed(1)}`}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-start min-h-[32px] py-1">
              <span className="text-xs text-muted-foreground w-20 shrink-0 pt-1">라벨</span>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-1 flex-wrap">
                  {wsLabels.map((l) => {
                    const assigned = taskLabels.some((tl) => tl.label.id === l.id);
                    return (
                      <button
                        key={l.id}
                        onClick={() => handleToggleLabel(l.id)}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium transition-all",
                          assigned ? "text-white" : "text-muted-foreground border border-dashed border-muted-foreground/30 hover:border-foreground/50"
                        )}
                        style={assigned ? { backgroundColor: l.color } : {}}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowNewLabel(!showNewLabel)}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-dashed border-muted-foreground/30 hover:border-foreground/50 transition-all"
                  >
                    + 새 라벨
                  </button>
                </div>
                {showNewLabel && (
                  <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-1.5">
                    <div className="flex gap-0.5 shrink-0">
                      {DEFAULT_COLORS.map((c) => (
                        <button key={c} className={cn("h-4 w-4 rounded-full border", newLabelColor === c ? "border-foreground" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setNewLabelColor(c)} />
                      ))}
                    </div>
                    <input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="라벨 이름"
                      className="text-xs bg-transparent outline-none flex-1 min-w-[60px]"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleCreateLabel(); if (e.key === "Escape") setShowNewLabel(false); }}
                      autoFocus
                    />
                    <button onClick={handleCreateLabel} disabled={!newLabelName.trim()} className="text-[10px] font-medium text-primary hover:underline disabled:opacity-50">추가</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center h-8">
              <span className="text-xs text-muted-foreground w-20 shrink-0">생성</span>
              <span className="text-xs text-muted-foreground">{formatRelativeDate(new Date(task.createdAt))}</span>
            </div>
          </div>

          {/* 설명 */}
          <div>
            <BlockEditor
              content={description}
              onChange={(val) => { setDescription(val); }}
              taskId={task.id}
            />
            {description !== (task.description ?? "") && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={handleSave} disabled={saving} title="설명 저장">
                  <Save className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground">변경됨</span>
              </div>
            )}
          </div>

          {/* 서브태스크 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">서브태스크</span>
              {subtasks.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{subtaskDone}/{subtasks.length} 완료 ({subtaskPct}%)</span>
              )}
            </div>
            {subtasks.length > 0 && (
              <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${subtaskPct}%` }} />
              </div>
            )}
            <div className="space-y-px mb-2">
              {subtasks.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleToggleSubtask(st)}
                  className="flex items-center gap-2 w-full rounded px-1.5 py-1.5 text-sm hover:bg-accent/50 text-left transition-colors group"
                >
                  {st.status === "done"
                    ? <CheckCircle2 className="h-[18px] w-[18px] text-green-500 shrink-0" />
                    : <Circle className="h-[18px] w-[18px] text-muted-foreground/25 group-hover:text-muted-foreground/50 shrink-0" />
                  }
                  <span className={cn(st.status === "done" && "line-through text-muted-foreground")}>{st.title}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="서브태스크 추가..."
                className="h-8 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddSubtask(); } }}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 의존성 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">의존 관계</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => openDepSearch("predecessor")}>
                  <Link2 className="h-3 w-3 mr-1" />선행 추가
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => openDepSearch("successor")}>
                  <Link2 className="h-3 w-3 mr-1" />후행 추가
                </Button>
              </div>
            </div>

            {/* 의존관계 검색 */}
            {showDepSearch && (
              <div className="mb-2 rounded-md border bg-muted/30 p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {showDepSearch === "predecessor" ? "선행 태스크 선택 (이것이 끝나야 현재 태스크 시작)" : "후행 태스크 선택 (현재 태스크 이후 시작)"}
                  </p>
                  <button onClick={() => setShowDepSearch(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <Input
                  value={depQuery}
                  onChange={(e) => setDepQuery(e.target.value)}
                  placeholder="태스크 이름으로 검색..."
                  className="h-7 text-xs"
                  autoFocus
                />
                <div className="max-h-[150px] overflow-y-auto space-y-0.5">
                  {projectTasks
                    .filter((t) => {
                      if (t.id === task.id) return false;
                      // 이미 연결된 태스크 제외
                      const existingIds = [
                        ...(task.successorDeps?.map((d) => d.predecessorTask?.id) ?? []),
                        ...(task.predecessorDeps?.map((d) => d.successorTask?.id) ?? []),
                      ];
                      if (existingIds.includes(t.id)) return false;
                      if (depQuery && !t.title.toLowerCase().includes(depQuery.toLowerCase())) return false;
                      return true;
                    })
                    .slice(0, 10)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleAddDependency(t.id)}
                        className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs hover:bg-accent transition-colors text-left"
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", t.status === "done" ? "bg-green-500" : "bg-blue-500")} />
                        <span className="flex-1 truncate">{t.title}</span>
                      </button>
                    ))}
                  {projectTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground py-1 px-2">불러오는 중...</p>
                  )}
                </div>
              </div>
            )}

            {task.successorDeps && task.successorDeps.length > 0 && (
              <div className="mt-1">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">선행 태스크 (이것이 끝나야 시작)</p>
                <div className="space-y-1">
                  {task.successorDeps.map((dep) => dep.predecessorTask && (
                    <div key={dep.id} className="flex items-center gap-2 text-xs rounded border px-2 py-1.5 group">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dep.predecessorTask.status === "done" ? "bg-green-500" : "bg-yellow-500")} />
                      <span className="flex-1 truncate">{dep.predecessorTask.title}</span>
                      <span className={cn("text-[10px]", dep.predecessorTask.status === "done" ? "text-green-600" : "text-muted-foreground")}>
                        {dep.predecessorTask.status === "done" ? "완료" : "진행 중"}
                      </span>
                      <button onClick={() => handleDeleteDep(dep.id)} className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {task.predecessorDeps && task.predecessorDeps.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">후행 태스크 (이것 이후 시작 가능)</p>
                <div className="space-y-1">
                  {task.predecessorDeps.map((dep) => dep.successorTask && (
                    <div key={dep.id} className="flex items-center gap-2 text-xs rounded border px-2 py-1.5 group">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dep.successorTask.status === "done" ? "bg-green-500" : "bg-muted-foreground")} />
                      <span className="flex-1 truncate">{dep.successorTask.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {dep.successorTask.status === "done" ? "완료" : "대기"}
                      </span>
                      <button onClick={() => handleDeleteDep(dep.id)} className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!task.successorDeps || task.successorDeps.length === 0) && (!task.predecessorDeps || task.predecessorDeps.length === 0) && !showDepSearch && (
              <p className="text-xs text-muted-foreground">의존 관계가 없습니다.</p>
            )}
          </div>

          {/* 첨부파일 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">첨부파일 {(task.attachments?.length ?? 0) > 0 && `(${task.attachments!.length})`}</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Plus className="h-3 w-3 mr-1" />{uploading ? "업로드 중..." : "파일 추가"}
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            </div>
            {task.attachments && task.attachments.length > 0 && (() => {
              const images = task.attachments.filter((a) => a.mimeType.startsWith("image/"));
              const files = task.attachments.filter((a) => !a.mimeType.startsWith("image/"));
              return (
                <div className="space-y-2">
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((att) => (
                        <div key={att.id} className="relative group rounded-lg overflow-hidden border">
                          <a href={att.url} target="_blank" rel="noopener noreferrer">
                            <img src={att.url} alt={att.fileName} className="w-full h-32 object-cover hover:opacity-90 transition-opacity" />
                          </a>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                            <span className="text-[10px] text-white truncate block">{att.fileName}</span>
                          </div>
                          <button onClick={() => handleDeleteAttachment(att.id)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {files.length > 0 && (
                    <div className="space-y-1">
                      {files.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 text-xs rounded border px-2 py-1.5 group">
                          <span className="flex-1 truncate">{att.fileName}</span>
                          <span className="text-[10px] text-muted-foreground">{(att.fileSize / 1024).toFixed(0)}KB</span>
                          <a href={att.url} download className="text-[10px] text-primary hover:underline">다운로드</a>
                          <button onClick={() => handleDeleteAttachment(att.id)} className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 코멘트 */}
          <div className="border-t pt-4">
            <span className="text-xs font-semibold">코멘트 {comments.length > 0 && `(${comments.length})`}</span>
            <div className="mt-2 mb-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <CommentEditor
                    placeholder="코멘트 입력... (@멘션, 이미지 붙여넣기)"
                    members={members}
                    onSubmit={handleAddComment}
                    onReady={(api) => { commentEditorApi.current = api; }}
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mb-[1px]" onClick={handleAddComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {comments.length > 0 && (() => {
              // Group threaded comments — parents + replies.
              const byParent = new Map<string, typeof comments>();
              const topLevel: typeof comments = [];
              for (const c of comments) {
                if (c.parentCommentId) {
                  const arr = byParent.get(c.parentCommentId) ?? [];
                  arr.push(c);
                  byParent.set(c.parentCommentId, arr);
                } else {
                  topLevel.push(c);
                }
              }
              // Sort replies chronologically asc (oldest-first under parent)
              for (const [k, arr] of byParent) {
                byParent.set(
                  k,
                  [...arr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
                );
              }
              return (
                <div className="space-y-3">
                  {topLevel.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      replies={byParent.get(c.id) ?? []}
                      members={members}
                      taskId={task!.id}
                      onChanged={fetchTask}
                    />
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 활동 이력 */}
          {activities.length > 0 && (
            <div className="border-t pt-4">
              <span className="text-xs font-semibold">활동 이력</span>
              <div className="mt-2 space-y-1.5">
                {activities.map((a) => {
                  const details = a.details ? (() => { try { return JSON.parse(a.details); } catch { return {}; } })() : {};
                  const actionText = a.action === "created" ? "생성됨" : a.action === "completed" ? "완료됨" : a.action === "status_changed" ? `상태 변경: ${details.from ?? ""} → ${details.to ?? ""}` : a.action === "deleted" ? "삭제됨" : a.action === "updated" ? "수정됨" : a.action;
                  return (
                    <div key={a.id} className="flex items-center gap-2 text-[11px]">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span className="flex-1 text-muted-foreground">{actionText}{details.title ? `: ${details.title}` : ""}</span>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{formatRelativeDate(new Date(a.occurredAt))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
    </div>
  );

  if (isModal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[60vw] w-[60vw] max-h-[85vh] p-0 overflow-y-auto">
          {panelContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 overflow-y-auto" style={{ width: panelWidth, maxWidth: panelWidth }}>
        {/* Resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-20 transition-colors"
          onMouseDown={handleResizeStart}
        />
        {panelContent}
      </SheetContent>
    </Sheet>
  );
}
