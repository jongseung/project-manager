import type {
  Workspace,
  Project,
  Epic,
  Task,
  Label,
  DailyPlan,
  DailyPlanTask,
  Milestone,
  Sprint,
  Goal,
  KPI,
  KPIEntry,
  MindMap,
  MindMapNode,
  ActivityLog,
} from "@prisma/client";

export type {
  Workspace,
  Project,
  Epic,
  Task,
  Label,
  DailyPlan,
  DailyPlanTask,
  Milestone,
  Sprint,
  Goal,
  KPI,
  KPIEntry,
  MindMap,
  MindMapNode,
  ActivityLog,
};

export type TaskWithRelations = Task & {
  labels: { label: Label }[];
  subtasks: Task[];
  epic: Epic | null;
};

export type ProjectWithTasks = Project & {
  tasks: Task[];
  epics: Epic[];
};

export type WorkspaceWithProjects = Workspace & {
  projects: Project[];
};

export type DailyPlanWithTasks = DailyPlan & {
  tasks: (DailyPlanTask & {
    task: Task;
  })[];
};

export type GoalWithRelations = Goal & {
  kpis: KPI[];
  projectLinks: { project: Project }[];
};
