"use client";

import { useTransition } from "react";
import { toast } from "sonner";

type ActionResponse = { success: boolean; error?: string };

/**
 * Pattern: soft-delete → toast with "실행 취소" → restore on click.
 * Works with any server action pair that returns ActionResult shape.
 *
 * @example
 *   const { del, isPending } = useSoftDelete({
 *     deleteFn: deleteTask,
 *     restoreFn: restoreTask,
 *     label: "태스크",
 *   });
 *   <Button onClick={() => del(task.id, { onDeleted: () => router.refresh() })}>삭제</Button>
 */
export function useSoftDelete({
  deleteFn,
  restoreFn,
  label,
  duration = 6000,
}: {
  deleteFn: (id: string) => Promise<ActionResponse | void>;
  restoreFn: (id: string) => Promise<ActionResponse | void>;
  label: string;
  /** Toast duration (ms). Default 6s. */
  duration?: number;
}) {
  const [isPending, startTransition] = useTransition();

  function del(
    id: string,
    opts?: { onDeleted?: () => void; onRestored?: () => void; itemName?: string },
  ) {
    startTransition(async () => {
      const res = await deleteFn(id);
      if (res && "success" in res && !res.success) {
        toast.error(res.error ?? `${label} 삭제 실패`);
        return;
      }
      opts?.onDeleted?.();
      const name = opts?.itemName ? `"${opts.itemName}"` : label;
      toast.success(`${name} 삭제됨`, {
        description: `${label}은(는) 휴지통에서 복구할 수 있습니다.`,
        duration,
        action: {
          label: "실행 취소",
          onClick: async () => {
            const r = await restoreFn(id);
            if (r && "success" in r && !r.success) {
              toast.error(r.error ?? "복원 실패");
              return;
            }
            opts?.onRestored?.();
            toast.success(`${name} 복원됨`);
          },
        },
      });
    });
  }

  return { del, isPending };
}
