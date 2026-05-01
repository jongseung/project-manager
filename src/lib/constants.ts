export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "백로그",
  todo: "할 일",
  in_progress: "진행 중",
  in_review: "검토 중",
  done: "완료",
  cancelled: "취소",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-gray-100 text-gray-700",
  todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const KANBAN_STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

export const TASK_PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
  none: "없음",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "bg-red-100 text-red-700 border-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  low: "bg-blue-100 text-blue-700 border-blue-300",
  none: "bg-gray-100 text-gray-500 border-gray-300",
};

export const PROJECT_STATUSES = [
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "진행 중",
  paused: "일시정지",
  completed: "완료",
  archived: "보관",
};

export const EPIC_STATUSES = ["todo", "in_progress", "done"] as const;
export type EpicStatus = (typeof EPIC_STATUSES)[number];

export const GOAL_STATUSES = [
  "not_started",
  "in_progress",
  "achieved",
  "missed",
  "abandoned",
] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const SPRINT_STATUSES = ["planning", "active", "completed"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

export const MILESTONE_STATUSES = ["pending", "reached", "missed"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const DEPENDENCY_TYPES = [
  "finish_to_start",
  "start_to_start",
  "finish_to_finish",
  "start_to_finish",
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

// Phase 1.6: Recurring
export const RECURRING_FREQUENCIES = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: "매일",
  weekly: "매주",
  biweekly: "격주",
  monthly: "매월",
  quarterly: "분기",
  yearly: "매년",
  custom: "사용자 정의",
};

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// Phase 2.5: Story
export const STORY_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  backlog: "백로그",
  todo: "할 일",
  in_progress: "진행 중",
  in_review: "검토 중",
  done: "완료",
  cancelled: "취소",
};

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

export const DEFAULT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];
