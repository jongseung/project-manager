/**
 * Shared, dark-mode-safe status styling.
 *
 * Older screens used raw Tailwind tints (e.g. `bg-green-100 text-green-700`)
 * with no dark variants, which broke in dark mode and clashed with the
 * monochrome chrome. Everything status-related should pull from here so the
 * whole app shows one consistent, theme-aware treatment.
 *
 * TONE = pill/badge background+text (semantic data colors, safe on both themes).
 * DOT  = solid indicator dot color (for board/flow/today lists).
 */

export const TONE = {
  neutral: "bg-muted text-muted-foreground",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  violet: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  emerald: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  red: "bg-red-500/12 text-red-600 dark:text-red-400",
} as const;

export type Tone = keyof typeof TONE;

export const TASK_STATUS_TONE: Record<string, string> = {
  backlog: TONE.neutral,
  todo: TONE.slate,
  in_progress: TONE.amber,
  in_review: TONE.violet,
  done: TONE.emerald,
  cancelled: TONE.red,
};

export const SPRINT_STATUS_TONE: Record<string, string> = {
  planning: TONE.slate,
  active: TONE.amber,
  completed: TONE.emerald,
};

export const GOAL_STATUS_TONE: Record<string, string> = {
  not_started: TONE.neutral,
  in_progress: TONE.blue,
  achieved: TONE.emerald,
  missed: TONE.red,
  abandoned: TONE.neutral,
};

export const MILESTONE_STATUS_TONE: Record<string, string> = {
  pending: TONE.amber,
  reached: TONE.emerald,
  missed: TONE.red,
};

/** Health / at-risk level tone. */
export const HEALTH_TONE: Record<string, string> = {
  good: TONE.emerald,
  warning: TONE.amber,
  bad: TONE.red,
};

/** Solid dot color per task/status — matches board & flow. */
export const STATUS_DOT: Record<string, string> = {
  backlog: "bg-muted-foreground/40",
  todo: "bg-slate-400",
  in_progress: "bg-amber-400",
  in_review: "bg-violet-400",
  done: "bg-emerald-500",
  cancelled: "bg-muted-foreground/40",
  // non-task statuses reuse sensible dots
  planning: "bg-slate-400",
  active: "bg-amber-400",
  completed: "bg-emerald-500",
  not_started: "bg-muted-foreground/40",
  achieved: "bg-emerald-500",
  missed: "bg-red-500",
  pending: "bg-amber-400",
  reached: "bg-emerald-500",
};
