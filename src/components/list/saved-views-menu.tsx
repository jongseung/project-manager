"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkPlus, Check, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSavedView, deleteSavedView } from "@/actions/saved-view";
import { toast } from "sonner";

export interface SavedViewItem {
  id: string;
  name: string;
  config: string; // JSON string
  shared: boolean;
  isMine: boolean;
  authorLabel: string;
}

interface SavedViewsMenuProps {
  projectId: string;
  scope: string;
  views: SavedViewItem[];
  /** Serialisable filter state for saving. */
  currentConfig: Record<string, unknown>;
  /** Called when user picks a saved view to apply. */
  onApply: (config: Record<string, unknown>) => void;
  /** Called after any CRUD so caller can refresh the list. */
  onChanged: () => void;
  activeName?: string;
}

export function SavedViewsMenu({
  projectId,
  scope,
  views,
  currentConfig,
  onApply,
  onChanged,
  activeName,
}: SavedViewsMenuProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);
  const [isPending, startTransition] = useTransition();

  function apply(view: SavedViewItem) {
    try {
      const parsed = JSON.parse(view.config);
      onApply(parsed);
      toast.success(`"${view.name}" 적용됨`);
    } catch {
      toast.error("뷰 설정을 불러올 수 없습니다");
    }
  }

  function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createSavedView({ projectId, scope, name, config: currentConfig, shared });
      if (!res.success) { toast.error(res.error ?? "저장 실패"); return; }
      toast.success(`"${name}" 저장됨`);
      setName(""); setShared(false); setSaveOpen(false);
      onChanged();
    });
  }

  function remove(view: SavedViewItem) {
    startTransition(async () => {
      const res = await deleteSavedView(view.id);
      if (!res.success) { toast.error(res.error ?? "삭제 실패"); return; }
      toast.success(`"${view.name}" 삭제됨`);
      onChanged();
    });
  }

  const ownedViews = views.filter((v) => v.isMine);
  const sharedViews = views.filter((v) => !v.isMine);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 text-xs">
            <Bookmark className="h-3.5 w-3.5 mr-1" />
            {activeName ?? "뷰"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[240px]">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSaveOpen(true); }}>
            <BookmarkPlus className="h-4 w-4 mr-2" /> 현재 뷰 저장
          </DropdownMenuItem>

          {ownedViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground">내 뷰</DropdownMenuLabel>
              {ownedViews.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onSelect={(e) => { e.preventDefault(); apply(v); }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 truncate">
                    {activeName === v.name && <Check className="h-3.5 w-3.5" />}
                    <span className="truncate">{v.name}</span>
                    {v.shared && <Users className="h-3 w-3 text-muted-foreground" />}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mr-1 opacity-60 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); remove(v); }}
                    disabled={isPending}
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {sharedViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground">공유 뷰</DropdownMenuLabel>
              {sharedViews.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onSelect={(e) => { e.preventDefault(); apply(v); }}
                  className="flex items-center gap-2"
                >
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate flex-1">{v.name}</span>
                  <span className="text-[10px] text-muted-foreground">{v.authorLabel}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>현재 뷰 저장</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="view-name">이름</Label>
              <Input
                id="view-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 내 긴급 태스크"
                autoFocus
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={shared}
                onChange={(e) => setShared(e.target.checked)}
                className="h-4 w-4"
              />
              팀 전체에 공유 (다른 멤버가 이 뷰를 볼 수 있음)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={isPending}>취소</Button>
            <Button onClick={save} disabled={!name.trim() || isPending}>
              {isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
