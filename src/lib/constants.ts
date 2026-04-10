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
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
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
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No Priority",
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
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
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
