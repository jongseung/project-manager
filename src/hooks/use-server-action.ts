"use client";

import { useTransition, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-utils";

interface UseServerActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useServerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options: UseServerActionOptions<TOutput> = {}
) {
  const [isPending, startTransition] = useTransition();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(
    (input: TInput) => {
      startTransition(async () => {
        const result = await action(input);
        const opts = optionsRef.current;
        if (result.success) {
          if (opts.successMessage) toast.success(opts.successMessage);
          opts.onSuccess?.(result.data);
        } else {
          toast.error(opts.errorMessage || result.error);
          opts.onError?.(result.error);
        }
      });
    },
    [action]
  );

  return { execute, isPending };
}
