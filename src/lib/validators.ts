import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(100),
  description: z.string().max(500).optional(),
  color: z.string().default("#6366f1"),
  icon: z.string().optional(),
});

export const projectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1, "이름을 입력해주세요").max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
  color: z.string().default("#6366f1"),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  summary: z.string().max(500).optional(),
  problemStatement: z.string().max(5000).optional(),
  definitionOfDone: z.string().max(5000).optional(),
});

export const taskSchema = z.object({
  projectId: z.string().min(1),
  epicId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  storyId: z.string().optional().nullable(),
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]).default("todo"),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("none"),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  actualHours: z.number().positive().optional().nullable(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).optional().default("none"),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  id: z.string().min(1),
});

export const epicSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "이름을 입력해주세요").max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

export const labelSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1, "이름을 입력해주세요").max(50),
  color: z.string().default("#6366f1"),
});

export const dailyPlanTaskSchema = z.object({
  taskId: z.string().min(1),
  date: z.string().min(1),
});

export const goalSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["not_started", "in_progress", "achieved", "missed", "abandoned"]).default("not_started"),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const kpiSchema = z.object({
  goalId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  name: z.string().min(1, "이름을 입력해주세요"),
  description: z.string().optional(),
  unit: z.string().default("%"),
  targetValue: z.number().positive("목표값은 양수여야 합니다"),
  currentValue: z.number().default(0),
  direction: z.enum(["increase", "decrease"]).default("increase"),
});

export const sprintSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "이름을 입력해주세요"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(["planning", "active", "completed"]).default("planning"),
  goalDescription: z.string().optional().nullable(),
});

export const milestoneSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "이름을 입력해주세요"),
  description: z.string().optional().nullable(),
  targetDate: z.string().min(1, "목표일을 입력해주세요"),
  status: z.enum(["pending", "reached", "missed"]).default("pending"),
});

export const dependencySchema = z.object({
  predecessorTaskId: z.string().min(1),
  successorTaskId: z.string().min(1),
  type: z.enum(["finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"]).default("finish_to_start"),
});

export const mindMapSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
});

export const mindMapNodeSchema = z.object({
  mindMapId: z.string().min(1),
  parentNodeId: z.string().optional().nullable(),
  content: z.string().min(1),
  color: z.string().optional(),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
});

export const memberSchema = z.object({
  workspaceId: z.string().min(1, "워크스페이스를 선택해 주세요"),
  name: z.string().min(1, "이름을 입력해주세요"),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  color: z.string().default("#6366f1"),
});

export const taskTemplateSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("none"),
  estimatedHours: z.number().positive().optional().nullable(),
});

// Phase 1.6: Recurring Templates
export const recurringTemplateSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"]).default("daily"),
  interval: z.number().int().min(1).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  timeOfDay: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  labelIds: z.array(z.string()).default([]),
  projectId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  subtasks: z.array(z.object({ title: z.string().min(1) })).default([]),
});

export const recurringTemplateUpdateSchema = recurringTemplateSchema.partial().extend({
  id: z.string().min(1),
});

// Phase 2.5: Story & OKR
export const objectiveSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["not_started", "in_progress", "achieved", "missed"]).default("not_started"),
});

export const keyResultSchema = z.object({
  objectiveId: z.string().min(1),
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  metricName: z.string().optional().nullable(),
  unit: z.string().default("%"),
  startValue: z.number().default(0),
  currentValue: z.number().default(0),
  targetValue: z.number(),
  direction: z.enum(["increase", "decrease", "maintain"]).default("increase"),
  deadline: z.string().optional().nullable(),
});

export const storySchema = z.object({
  projectId: z.string().min(1),
  epicId: z.string().optional().nullable(),
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  description: z.string().max(5000).optional(),
  userStory: z.string().max(500).optional().nullable(),
  storyPoints: z.number().int().positive().optional().nullable(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]).default("backlog"),
  priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
});

export const commentSchema = z.object({
  taskId: z.string().optional().nullable(),
  workspaceId: z.string().optional().nullable(),
  parentCommentId: z.string().optional().nullable(),
  content: z.string().min(1, "내용을 입력해주세요"),
  authorName: z.string().default("User"),
  mentions: z.string().optional().nullable(),
});

// API-route schemas
export const createOrgSchema = z.object({
  name: z.string().min(1, "조직 이름을 입력해주세요"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
});
