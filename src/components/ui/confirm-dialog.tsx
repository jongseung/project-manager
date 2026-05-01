"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BaseProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "default";
  onConfirm: () => Promise<{ success: boolean; error?: string } | void>;
  successMessage?: string;
};

type ControlledProps = BaseProps & {
  /** Controlled open state. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: undefined;
};

type TriggerProps = BaseProps & {
  /** Uncontrolled — clicking the trigger opens the dialog. */
  trigger: ReactNode;
  open?: undefined;
  onOpenChange?: undefined;
};

type ConfirmDialogProps = ControlledProps | TriggerProps;

/**
 * Confirmation dialog for destructive/irreversible actions.
 * Supports both controlled ({open, onOpenChange}) and uncontrolled ({trigger}) modes.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const controlled = props.open !== undefined;
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlled ? props.open : localOpen;
  const setOpen = controlled ? props.onOpenChange : setLocalOpen;
  const [isPending, startTransition] = useTransition();

  const { title, description, confirmLabel = "삭제", confirmVariant = "destructive", onConfirm, successMessage } = props;

  function handleConfirm() {
    startTransition(async () => {
      try {
        const result = await onConfirm();
        if (result && "success" in result && !result.success) {
          toast.error(result.error ?? "작업에 실패했습니다");
          return;
        }
        if (successMessage) toast.success(successMessage);
        setOpen(false);
      } catch (e) {
        console.error(e);
        toast.error("작업 중 오류가 발생했습니다");
      }
    });
  }

  return (
    <>
      {!controlled && props.trigger && (
        <span onClick={() => setOpen(true)} className="contents">{props.trigger}</span>
      )}
      <Dialog open={open} onOpenChange={(v) => { if (!isPending) setOpen(v); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              취소
            </Button>
            <Button variant={confirmVariant} onClick={handleConfirm} disabled={isPending}>
              {isPending ? "처리 중..." : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
