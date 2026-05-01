/**
 * Project health + cycle time calculations.
 * Pure functions — no DB access. Feed in task arrays and get metrics.
 */

export type HealthLevel = "green" | "yellow" | "red";

export interface HealthInput {
  total: number;
  overdue: number;      // status !== done && dueDate < today
  inProgress: number;   // status === in_progress
  wipLimit?: number;    // configured WIP limit for in_progress (optional)
  blockedCount?: number; // tasks with unresolved blockers
}

export interface HealthResult {
  level: HealthLevel;
  score: number; // 0–100
  reasons: string[];
}

export function computeHealth(input: HealthInput): HealthResult {
  const reasons: string[] = [];
  let score = 100;

  if (input.total === 0) {
    return { level: "green", score: 100, reasons: ["태스크 없음"] };
  }

  const overduePct = input.overdue / Math.max(1, input.total);
  if (overduePct >= 0.3) { score -= 40; reasons.push(`지연 태스크 ${Math.round(overduePct * 100)}%`); }
  else if (overduePct >= 0.15) { score -= 20; reasons.push(`지연 태스크 ${Math.round(overduePct * 100)}%`); }
  else if (overduePct > 0) { score -= 5; reasons.push(`지연 ${input.overdue}개`); }

  if (input.wipLimit && input.inProgress > input.wipLimit) {
    score -= 15;
    reasons.push(`WIP 초과: ${input.inProgress}/${input.wipLimit}`);
  }

  if (input.blockedCount && input.blockedCount > 0) {
    score -= Math.min(20, input.blockedCount * 5);
    reasons.push(`블로커 ${input.blockedCount}개`);
  }

  score = Math.max(0, score);
  const level: HealthLevel = score >= 80 ? "green" : score >= 50 ? "yellow" : "red";
  if (reasons.length === 0) reasons.push("정상");
  return { level, score, reasons };
}

/**
 * Cycle time = createdAt → completedAt for completed tasks.
 * Returns avg days, median, count.
 */
export interface CycleTimeInput {
  createdAt: Date | string;
  completedAt: Date | string | null;
}

export function computeCycleTime(tasks: CycleTimeInput[]) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const durations = tasks
    .filter((t) => t.completedAt)
    .map((t) => {
      const created = new Date(t.createdAt).getTime();
      const completed = new Date(t.completedAt!).getTime();
      return Math.max(0, (completed - created) / MS_PER_DAY);
    })
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return { count: 0, avg: 0, median: 0, p90: 0 };
  }
  const sum = durations.reduce((s, d) => s + d, 0);
  const avg = sum / durations.length;
  const median = durations[Math.floor(durations.length / 2)];
  const p90 = durations[Math.floor(durations.length * 0.9)] ?? durations[durations.length - 1];
  return {
    count: durations.length,
    avg: round(avg),
    median: round(median),
    p90: round(p90),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
