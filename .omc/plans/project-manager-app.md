# Project Manager Web Application - Implementation Plan

**Plan ID**: project-manager-app
**Created**: 2026-04-10
**Revised**: 2026-04-10 (Iteration 1 - Architect/Critic feedback incorporated)
**Status**: DRAFT - Re-review Pending
**Consensus Mode**: RALPLAN-DR (SHORT)

---

## Context

The user needs a practical, local-first project management application for immediate workplace use. The tool must handle both daily task management (quick todos, daily planning) and structured project management (hierarchies, timelines, dependencies) at an enterprise-grade level comparable to Jira/Asana/Monday.com -- but running locally as a single-user tool with no external auth overhead.

Additionally, the tool must support a Goal-to-Execution workflow (set goals with KPIs, break into plans, track execution), mind mapping for brainstorming, and comprehensive activity metrics with visual charts.

**Environment**: macOS, Node v25.8.1, npm 11.11.0, empty `/Users/jongsports/pm` directory.

---

## Work Objectives

1. Deliver a fully functional local-first PM app with Next.js 15 + SQLite
2. Support both quick daily task management and deep project planning workflows
3. Provide multiple views (Kanban, List, Calendar, Timeline) for flexible work styles
4. Include dashboard with progress metrics, KPI tracking, and activity charts
5. Build a data model that supports Workspace > Project > Epic > Task > Subtask hierarchy
6. Enable Goal > Plan > Execute workflow with measurable KPIs
7. Provide mind mapping for project ideation with task conversion
8. Track user activity with heatmaps, trends, and project health indicators

---

## Guardrails

### Must Have
- Local-first SQLite storage (zero external service dependencies)
- Type-safe end-to-end (TypeScript strict mode)
- Responsive UI that works on laptop screens
- Data model supporting full project hierarchy
- Working Kanban board and list views in Phase 1
- Error handling pattern established in Phase 1 (useServerAction hook + toast)
- `loading.tsx` files for all route segments
- Test coverage for critical paths per phase
- RSC by default; client components only where interactivity requires it

### Must NOT Have
- External authentication/user management (single-user local tool)
- Cloud database or external API dependencies
- Electron wrapper (web-first, browser-based)
- Over-engineered microservice architecture
- Real-time collaboration features (single-user)
- Subtask nesting beyond 2 levels (enforced in data layer)

---

## Data Model Design

### Core Entities

```
Workspace
  id: string @default(cuid())
  name: string
  description: string?
  color: string
  icon: string?
  createdAt: datetime
  updatedAt: datetime

Project
  id: string @default(cuid())
  workspaceId: string (FK)
  name: string
  description: string?
  status: enum(active, paused, completed, archived)
  color: string
  startDate: date?
  targetDate: date?
  createdAt: datetime
  updatedAt: datetime

Epic
  id: string @default(cuid())
  projectId: string (FK)
  name: string
  description: string?
  status: enum(todo, in_progress, done)
  priority: enum(urgent, high, medium, low)
  startDate: date?
  targetDate: date?
  sortOrder: integer
  createdAt: datetime
  updatedAt: datetime

Task
  id: string @default(cuid())
  epicId: string? (FK, nullable for standalone tasks)
  projectId: string (FK)
  parentTaskId: string? (FK, self-ref for subtasks, max 2 levels enforced)
  title: string
  description: string?
  status: enum(backlog, todo, in_progress, in_review, done, cancelled)
  priority: enum(urgent, high, medium, low, none)
  dueDate: date?
  startDate: date?
  estimatedHours: float?
  actualHours: float?
  sortOrder: integer
  completedAt: datetime?
  archivedAt: datetime? (soft archival timestamp)
  createdAt: datetime
  updatedAt: datetime

  --- REMOVED: isDaily (use DailyPlanTask as single source of truth)
  --- ENFORCED: parentTaskId depth limit of 2 levels via validation in server actions

Label
  id: string @default(cuid())
  workspaceId: string (FK)
  name: string
  color: string

TaskLabel (join table)
  taskId: string (FK)
  labelId: string (FK)

DailyPlan
  id: string @default(cuid())
  date: date (unique)
  notes: string?
  createdAt: datetime
  updatedAt: datetime

DailyPlanTask (join table)
  dailyPlanId: string (FK)
  taskId: string (FK)
  sortOrder: integer
  --- REMOVED: completed (derive from Task.status === 'done')

Dependency
  id: string @default(cuid())
  predecessorTaskId: string (FK)
  successorTaskId: string (FK)
  type: enum(finish_to_start, start_to_start, finish_to_finish, start_to_finish)

Milestone
  id: string @default(cuid())
  projectId: string (FK)
  name: string
  description: string?
  targetDate: date
  status: enum(pending, reached, missed)
  reachedAt: datetime?
  sortOrder: integer
  createdAt: datetime
  updatedAt: datetime

Sprint
  id: string @default(cuid())
  projectId: string (FK)
  name: string
  startDate: date
  endDate: date
  status: enum(planning, active, completed)
  goalDescription: string?
  createdAt: datetime
  updatedAt: datetime

SprintTask (join table - tasks assigned to sprints)
  sprintId: string (FK)
  taskId: string (FK)
  addedAt: datetime

Goal
  id: string @default(cuid())
  workspaceId: string (FK)
  title: string
  description: string?
  status: enum(not_started, in_progress, achieved, missed, abandoned)
  startDate: date?
  targetDate: date?
  completedAt: datetime?
  createdAt: datetime
  updatedAt: datetime

GoalProject (join table - projects linked to goals)
  goalId: string (FK)
  projectId: string (FK)

KPI
  id: string @default(cuid())
  goalId: string? (FK, nullable - can be project-level)
  projectId: string? (FK, nullable - can be goal-level)
  name: string
  description: string?
  unit: string (e.g., "%", "tasks", "hours")
  targetValue: float
  currentValue: float @default(0)
  direction: enum(increase, decrease) -- whether higher or lower is better
  createdAt: datetime
  updatedAt: datetime

KPIEntry (time-series tracking)
  id: string @default(cuid())
  kpiId: string (FK)
  value: float
  recordedAt: datetime
  note: string?

MindMap
  id: string @default(cuid())
  projectId: string? (FK, nullable - can be standalone)
  title: string
  description: string?
  createdAt: datetime
  updatedAt: datetime

MindMapNode
  id: string @default(cuid())
  mindMapId: string (FK)
  parentNodeId: string? (FK, self-ref for tree structure)
  content: string
  color: string?
  positionX: float (for visual layout)
  positionY: float
  convertedToTaskId: string? (FK, nullable - link if converted to task)
  sortOrder: integer
  createdAt: datetime
  updatedAt: datetime

ActivityLog
  id: string @default(cuid())
  entityType: enum(task, project, epic, goal, milestone, sprint, kpi)
  entityId: string
  action: enum(created, updated, deleted, status_changed, moved, completed, archived)
  details: string? (JSON string with changed fields)
  occurredAt: datetime @default(now())
```

### Key Design Decisions

- **No `isDaily` on Task**: DailyPlanTask is the single source of truth for whether a task is in today's plan. Querying today's tasks = join through DailyPlanTask.
- **No `completed` on DailyPlanTask**: Completion is derived from `Task.status === 'done'`. Single source of truth for task completion status.
- **Subtask depth limit**: Enforced at 2 levels max via server action validation. A task can have children, and those children can have children, but no deeper. Validation checks `parentTaskId` chain length before creating subtasks.
- **Soft archival**: `archivedAt` on Task allows soft-delete/archival without data loss. Archived tasks are excluded from active views but preserved in DB.
- **Sprint boundaries**: Sprints provide time-boxed boundaries for burndown charts. Tasks are assigned to sprints via SprintTask join table. Burndown = (total story points or task count in sprint) - (completed per day within sprint date range).
- **Goal > Plan > Execute**: Goals link to Projects via GoalProject. KPIs attach to Goals or Projects. Progress = aggregate completion of linked project tasks against KPI targets.
- **Activity tracking**: ActivityLog captures all mutations for heatmaps and audit trails. Populated by server actions as a side effect of every write operation.
- **Mind map nodes**: Tree structure with visual positioning. Nodes can be converted to Tasks (one-way, tracked via `convertedToTaskId`).
- **Prisma-native CUIDs**: All IDs use `@default(cuid())` -- no external `cuid2` dependency needed.
- **RSC/Client boundary**: All page components and data-fetching components are React Server Components. Client components are limited to: interactive forms, drag-and-drop, charts, mind map canvas, theme toggle. Client components are prefixed with `"use client"` directive and receive data as props from parent RSCs.

---

## Tech Stack Details

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | Server components, server actions, file-based routing |
| Language | TypeScript (strict) | Type safety end-to-end |
| Styling | Tailwind CSS 4 | Utility-first, CSS-based config (NOT tailwind.config.ts) |
| Components | shadcn/ui | High-quality, customizable, accessible primitives |
| Database | SQLite via Prisma | Local-first, zero config, portable single file |
| ORM | Prisma 6 | Type-safe queries, migrations, schema-as-code, native CUID generation |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | Lightweight, accessible, React 19 compatible |
| Charts | Recharts | Lightweight React charting for reports and metrics |
| Validation | Zod | Runtime validation, integrates with server actions |
| Icons | Lucide React | Consistent icon set, tree-shakeable |
| Date Handling | date-fns | Lightweight date utility |
| Theming | next-themes | Dark mode with system preference detection |
| Testing | Vitest + React Testing Library + Playwright | Unit/integration/E2E coverage |

### Tailwind CSS 4 Configuration

Tailwind v4 uses CSS-based configuration, NOT `tailwind.config.ts`. Theme customization goes in `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #6366f1;
  --color-primary-foreground: #ffffff;
  /* ... shadcn/ui theme tokens ... */
}
```

No `tailwind.config.ts` file is created. The `postcss.config.mjs` references `@tailwindcss/postcss`.

### Key Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@prisma/client": "^6",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^9",
    "recharts": "^2",
    "zod": "^3",
    "date-fns": "^4",
    "lucide-react": "^0.460",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "next-themes": "^0.4",
    "sonner": "^2"
  },
  "devDependencies": {
    "prisma": "^6",
    "typescript": "^5",
    "@types/react": "^19",
    "@types/node": "^22",
    "vitest": "^3",
    "@testing-library/react": "^16",
    "@testing-library/jest-dom": "^6",
    "@vitejs/plugin-react": "^4",
    "jsdom": "^25",
    "@playwright/test": "^1.49",
    "@tailwindcss/postcss": "^4"
  }
}
```

**Removed**: `better-sqlite3` (Prisma handles SQLite driver internally), `cuid2` (Prisma generates CUIDs natively with `@default(cuid())`).

### shadcn/ui Components to Install

Phase 1:
```
button, input, textarea, select, dialog, dropdown-menu, popover,
badge, card, separator, avatar, tooltip, skeleton, scroll-area,
sheet (for task detail slide-over), form, label, sonner (toast)
```

Phase 2:
```
calendar, command (for search + command palette), tabs, progress,
checkbox, switch, table
```

Phase 3:
```
chart (recharts wrapper), slider, collapsible, alert
```

Phase 4:
```
toggle, menubar, context-menu
```

### Providers File (`src/components/providers.tsx`)

```tsx
"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { DndContext } from "@dnd-kit/core";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  );
}

// Note: DndContext is applied at the component level (e.g., KanbanBoard),
// not globally, because different views need different DnD configurations.
```

---

## Error Handling Pattern

Established in Phase 1 and used consistently throughout:

### `useServerAction` Hook (`src/hooks/use-server-action.ts`)

```tsx
// Wraps server action calls with loading state, error handling, and toast notifications
// Usage: const { execute, isLoading } = useServerAction(createTask, {
//   onSuccess: () => toast.success("Task created"),
//   onError: (error) => toast.error(error.message),
// });
```

### Server Action Return Type

```tsx
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

All server actions return `ActionResult<T>`. The `useServerAction` hook unwraps this and triggers toast notifications via Sonner. This pattern is established in Phase 1 Step 3 and reused in every subsequent phase.

### Optimistic Updates (Drag-and-Drop)

For Kanban drag-and-drop, use `useOptimistic` from React 19:
1. On drag end, immediately update local state (optimistic)
2. Fire server action in background
3. If server action fails, revert to previous state and show error toast
4. `revalidatePath` on success to sync server state

---

## RSC / Client Component Boundary

### Server Components (default)
- All `page.tsx` files (data fetching via Prisma)
- All `layout.tsx` files
- All `loading.tsx` files
- Data display components that don't need interactivity

### Client Components ("use client")
- `providers.tsx` (ThemeProvider, Toaster)
- Interactive forms (task create/edit dialogs)
- Drag-and-drop components (kanban-board, sortable lists)
- Charts (Recharts requires client-side rendering)
- Mind map canvas
- Search/command palette
- Theme toggle
- Components using `useState`, `useEffect`, `useOptimistic`

### Pattern
RSC pages fetch data and pass it as props to client components:
```tsx
// page.tsx (RSC) - fetches data
export default async function BoardPage({ params }) {
  const tasks = await db.task.findMany({ where: { projectId: params.id } });
  return <KanbanBoard tasks={tasks} />; // KanbanBoard is "use client"
}
```

---

## Empty States

Every view must have a designed empty state:

| View | Empty State Message | CTA |
|------|-------------------|-----|
| Workspaces | "Create your first workspace to organize projects" | "Create Workspace" button |
| Projects (in workspace) | "No projects yet. Start your first project." | "New Project" button |
| Kanban Board | "No tasks in this project. Create your first task." | "Add Task" button + keyboard shortcut hint |
| List View | Same as Kanban | Same |
| Today View | "Nothing planned for today. Add tasks from your projects or create a quick task." | "Quick Add" input focused |
| Calendar | "No tasks with due dates this month." | Link to task creation |
| Dashboard | "Set up projects and tasks to see your dashboard come alive." | Link to workspace creation |
| Goals | "Define your first goal to start tracking progress." | "Create Goal" button |
| KPI | "Add KPIs to measure what matters." | "Add KPI" button |
| Mind Map | "Start brainstorming. Click anywhere to add your first node." | Click handler on canvas |
| Activity | "Activity will appear here as you work." | None |
| Search | "No results found for '{query}'." | Suggestion to broaden search |
| Sprint | "No sprints created. Create a sprint to time-box your work." | "Create Sprint" button |

---

## Feature Breakdown by Priority

### P0 - Core (Phase 1) - Must ship for usable tool
- [ ] Project setup (Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma + SQLite)
- [ ] Database schema and Prisma migrations (full model including Goal, KPI, Milestone, Sprint, ActivityLog, MindMap)
- [ ] Workspace CRUD
- [ ] Project CRUD within workspaces
- [ ] Task CRUD with full field support
- [ ] Kanban board view (drag-and-drop status columns with optimistic updates)
- [ ] List view with sorting/filtering
- [ ] Today view (daily task management)
- [ ] Quick task creation (keyboard shortcut, inline add)
- [ ] Basic sidebar navigation (workspaces, projects)
- [ ] Error handling pattern (useServerAction + Sonner toast)
- [ ] loading.tsx for all route segments

### P1 - Essential (Phase 2) - Needed for serious PM use
- [ ] Epic management within projects
- [ ] Subtask support (nested tasks, max 2 levels)
- [ ] Label/tag system
- [ ] Task detail panel (slide-over sheet)
- [ ] Calendar view (monthly/weekly)
- [ ] Dashboard with project progress metrics
- [ ] Bulk task operations (multi-select, bulk status change)
- [ ] Search + Command palette (Cmd+K) -- single unified component
- [ ] Daily planning workflow (plan today, review yesterday)
- [ ] Goal management (CRUD, link to projects)
- [ ] KPI tracking (define, record entries, view trends)
- [ ] Activity metrics (daily heatmap, completion trends)
- [ ] Sprint/Iteration management (create, assign tasks, track)

### P2 - Advanced (Phase 3) - Enterprise-grade features
- [ ] Timeline/Gantt view with dependencies
- [ ] Milestone tracking on timeline
- [ ] Task dependencies (finish-to-start etc.)
- [ ] Burndown/burnup charts (sprint-scoped)
- [ ] Progress reports (weekly/monthly)
- [ ] Task time tracking (estimated vs actual)
- [ ] Mind map / brainstorming (canvas, node creation, task conversion)
- [ ] Project health indicators (on-track, at-risk, behind)
- [ ] Goal > Plan > Execute visual workflow view

### P3 - Polish (Phase 4) - Quality of life
- [ ] Keyboard shortcuts throughout
- [ ] Dark mode (next-themes, already wired in Phase 1)
- [ ] Data export (JSON, CSV)
- [ ] Data import (from other PM tools)
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Custom fields on tasks
- [ ] Saved filters / custom views

---

## Implementation Phases

### Phase 1: Foundation + Core Task Management
**Goal**: Working app with task CRUD, Kanban, List view, and Today view
**Estimated effort**: 3-4 days

**Phase Acceptance Criteria**:
- `npm run dev` starts the app without errors
- Can create workspaces, projects, and tasks
- Kanban board displays tasks by status with drag-and-drop (optimistic updates)
- List view shows tasks with sortable columns
- Today view shows daily tasks and allows quick add
- All data persists in local SQLite database
- Error toast shows on failed mutations
- Loading skeletons appear during navigation
- All Phase 1 critical path tests pass

#### Step 1: Project Scaffolding + Database
**Files to create/modify**:
```
/package.json                          - Dependencies (see Tech Stack)
/tsconfig.json                         - TypeScript strict config
/next.config.ts                        - Next.js configuration
/postcss.config.mjs                    - PostCSS with @tailwindcss/postcss
/prisma/schema.prisma                  - Full data model (ALL entities)
/prisma/seed.ts                        - Demo data seeder
/src/lib/db.ts                         - Prisma client singleton
/src/lib/utils.ts                      - Utility functions (cn, formatDate, etc.)
/src/lib/constants.ts                  - Status/priority enums, colors
/components.json                       - shadcn/ui config
/vitest.config.ts                      - Vitest configuration
/playwright.config.ts                  - Playwright configuration
```

**Acceptance**:
- `npx prisma migrate dev` runs clean, `npx prisma studio` shows all tables
- `npx vitest --run` executes without configuration errors
- No `tailwind.config.ts` exists; theme is in `globals.css` via `@theme`

#### Step 2: Layout + Navigation Shell
**Files to create**:
```
/src/app/layout.tsx                    - Root layout with Providers
/src/app/page.tsx                      - Redirect to /today
/src/app/globals.css                   - Tailwind v4 @theme config + global styles
/src/app/(app)/layout.tsx              - App layout with sidebar
/src/app/(app)/loading.tsx             - App-level loading skeleton
/src/app/(app)/today/loading.tsx       - Today view loading skeleton
/src/app/(app)/projects/[id]/loading.tsx          - Project loading skeleton
/src/app/(app)/projects/[id]/board/loading.tsx    - Board loading skeleton
/src/app/(app)/projects/[id]/list/loading.tsx     - List loading skeleton
/src/app/(app)/workspaces/loading.tsx             - Workspaces loading skeleton
/src/components/layout/sidebar.tsx     - Main navigation sidebar
/src/components/layout/header.tsx      - Top header bar
/src/components/layout/app-shell.tsx   - Shell combining sidebar + header + content
/src/components/providers.tsx          - ThemeProvider + Toaster
```

**Acceptance**:
- App renders with sidebar showing workspaces/projects
- Responsive layout works on laptop screens
- Loading skeletons display during route transitions
- Dark/light mode toggles via next-themes (basic, toggle in Phase 4)

#### Step 3: Server Actions + Data Layer
**Files to create**:
```
/src/actions/workspace.ts              - Workspace CRUD actions
/src/actions/project.ts                - Project CRUD actions
/src/actions/task.ts                   - Task CRUD + reorder + archive actions
/src/actions/daily.ts                  - Daily plan actions
/src/actions/activity.ts               - ActivityLog write helper
/src/lib/validators.ts                 - Zod schemas for all entities
/src/lib/action-utils.ts              - ActionResult type + error handling helpers
/src/hooks/use-server-action.ts        - useServerAction hook (loading, error, toast)
```

**Acceptance**:
- All CRUD operations work via server actions returning `ActionResult<T>`
- Input validated with Zod; invalid input returns structured errors
- `useServerAction` hook handles loading state and toast notifications
- Subtask depth validation rejects tasks beyond 2 levels
- ActivityLog entries created on every mutation
- All server action files have corresponding test files

#### Step 4: Core Views
**Files to create**:
```
/src/app/(app)/today/page.tsx          - Today view page (RSC)
/src/components/today/daily-tasks.tsx  - Today's task list (client)
/src/components/today/quick-add.tsx    - Quick task add input (client)
/src/components/today/daily-summary.tsx - Completed count, plan notes

/src/app/(app)/projects/[id]/page.tsx           - Project detail (redirect to board)
/src/app/(app)/projects/[id]/board/page.tsx     - Kanban board view (RSC)
/src/app/(app)/projects/[id]/list/page.tsx      - List view (RSC)
/src/components/board/kanban-board.tsx           - Kanban container (client, DnD)
/src/components/board/kanban-column.tsx          - Status column (client)
/src/components/board/task-card.tsx              - Draggable task card (client)
/src/components/list/task-table.tsx              - Sortable task table (client)
/src/components/list/task-row.tsx                - Table row component
/src/components/task/task-create-dialog.tsx      - New task dialog (client)
/src/components/task/task-detail-panel.tsx       - Task detail sheet (client)
/src/components/task/priority-badge.tsx          - Priority indicator
/src/components/task/status-select.tsx           - Status dropdown (client)
/src/components/shared/empty-state.tsx           - Reusable empty state component
```

**Acceptance**:
- Kanban drag-and-drop works with optimistic updates; reverts on failure
- List view sorts by priority, status, due date, creation date
- Tasks create/edit/delete with toast feedback
- Empty states render when no data exists
- DailyPlanTask completion derived from Task.status (no separate `completed` field)

#### Step 5: Workspace + Project Management
**Files to create**:
```
/src/app/(app)/workspaces/page.tsx              - Workspace list (RSC)
/src/app/(app)/workspaces/[id]/page.tsx         - Workspace detail (RSC)
/src/components/workspace/workspace-card.tsx     - Workspace card
/src/components/workspace/workspace-dialog.tsx   - Create/edit workspace (client)
/src/components/project/project-card.tsx         - Project card
/src/components/project/project-dialog.tsx       - Create/edit project (client)
/src/components/project/project-header.tsx       - Project header with view tabs
```

**Acceptance**:
- Full workspace/project CRUD with toast feedback
- Navigation between entities works
- Empty states for workspaces and projects

---

### Phase 2: Enhanced Task Management + Goals + Dashboard
**Goal**: Epic support, labels, calendar, dashboard, search/command palette, goals, KPIs, activity metrics, sprints
**Estimated effort**: 5-6 days

**Phase Acceptance Criteria**:
- Epics group tasks within projects
- Labels can be created and assigned to tasks
- Calendar view shows tasks by due date
- Dashboard shows project progress overview with activity heatmap
- Unified search + command palette (Cmd+K) finds tasks and navigates
- Goals can be created with KPI targets
- KPI values can be recorded and trended over time
- Activity heatmap shows contribution density
- Sprints can be created and tasks assigned to them
- All Phase 2 critical path tests pass

#### Step 1: Epic + Subtask Support
**Files to create**:
```
/src/actions/epic.ts                             - Epic CRUD
/src/components/epic/epic-list.tsx               - Epic list in project
/src/components/epic/epic-card.tsx               - Epic card with progress bar
/src/components/task/subtask-list.tsx            - Nested subtasks (max 2 levels)
```

**Acceptance**:
- Epics display within projects with task count and completion percentage
- Subtasks render nested under parent tasks
- Creating a 3rd-level subtask shows validation error
- Empty state for epics with no tasks

#### Step 2: Labels + Search/Command Palette
**Files to create**:
```
/src/actions/label.ts                            - Label CRUD
/src/components/label/label-picker.tsx           - Label selector (client)
/src/components/label/label-badge.tsx            - Label display
/src/components/command/command-palette.tsx       - Unified Cmd+K (search + navigation)
```

**Note**: Search and command palette are merged into a single component using shadcn/ui `command` (which wraps cmdk). Top section: navigation commands. Bottom section: search results. No separate search dialog.

**Acceptance**:
- Labels can be created, colored, and assigned to tasks
- Cmd+K opens command palette with search and navigation
- Search finds tasks by title across all projects
- Empty state for no search results

#### Step 3: Calendar View + Daily Planning
**Files to create**:
```
/src/app/(app)/projects/[id]/calendar/page.tsx   - Calendar view page (RSC)
/src/app/(app)/projects/[id]/calendar/loading.tsx
/src/components/calendar/calendar-view.tsx        - Monthly calendar grid (client)
/src/components/calendar/calendar-day.tsx         - Day cell with tasks
/src/components/today/daily-review.tsx           - Review yesterday's tasks
```

**Acceptance**:
- Calendar shows tasks on their due dates
- Clicking a day shows tasks for that day
- Daily planning allows reviewing yesterday and planning today
- Empty state for months with no tasks

#### Step 4: Goal + KPI Management
**Files to create**:
```
/src/app/(app)/goals/page.tsx                    - Goals list page (RSC)
/src/app/(app)/goals/[id]/page.tsx               - Goal detail page (RSC)
/src/app/(app)/goals/loading.tsx
/src/actions/goal.ts                             - Goal CRUD + link projects
/src/actions/kpi.ts                              - KPI CRUD + record entries
/src/components/goal/goal-card.tsx               - Goal with progress indicator
/src/components/goal/goal-dialog.tsx             - Create/edit goal (client)
/src/components/goal/goal-project-linker.tsx     - Link projects to goals (client)
/src/components/kpi/kpi-card.tsx                 - KPI current vs target
/src/components/kpi/kpi-trend-chart.tsx          - KPI trend over time (client, Recharts)
/src/components/kpi/kpi-entry-dialog.tsx         - Record KPI value (client)
```

**Acceptance**:
- Goals can be created with title, description, dates
- KPIs can be defined with name, unit, target value, direction
- KPI entries can be recorded with timestamps
- KPI trend chart shows value over time against target line
- Projects can be linked to goals
- Goal progress derived from linked project completion
- Empty states for goals, KPIs

#### Step 5: Sprint Management
**Files to create**:
```
/src/actions/sprint.ts                           - Sprint CRUD + assign tasks
/src/components/sprint/sprint-card.tsx           - Sprint with date range and task count
/src/components/sprint/sprint-dialog.tsx         - Create/edit sprint (client)
/src/components/sprint/sprint-task-picker.tsx    - Assign tasks to sprint (client)
/src/app/(app)/projects/[id]/sprints/page.tsx    - Sprint list page
/src/app/(app)/projects/[id]/sprints/loading.tsx
```

**Acceptance**:
- Sprints can be created with name, start/end dates
- Tasks can be assigned to and removed from sprints
- Sprint card shows task count and completion percentage
- Only one sprint can be "active" per project at a time
- Empty state for no sprints

#### Step 6: Dashboard + Activity Metrics
**Files to create**:
```
/src/app/(app)/dashboard/page.tsx               - Dashboard page (RSC)
/src/app/(app)/dashboard/loading.tsx
/src/components/dashboard/stats-cards.tsx        - Overview stats (tasks, projects, goals)
/src/components/dashboard/project-progress.tsx   - Project progress bars
/src/components/dashboard/recent-tasks.tsx       - Recently updated tasks
/src/components/dashboard/upcoming-deadlines.tsx - Due soon tasks
/src/components/dashboard/activity-heatmap.tsx   - GitHub-style contribution heatmap (client)
/src/components/dashboard/completion-trend.tsx   - Task completion trend chart (client)
/src/components/dashboard/kpi-summary.tsx        - KPI overview cards
```

**Acceptance**:
- Dashboard shows aggregate stats (total tasks, completed, overdue)
- Project progress bars show completion percentage
- Activity heatmap shows daily task activity for past 52 weeks
- Completion trend chart shows tasks completed per week
- KPI summary shows current vs target for active KPIs
- All charts render with Recharts
- Empty state for dashboard with no data

---

### Phase 3: Timeline, Dependencies, Reporting, Mind Maps
**Goal**: Gantt-like timeline, task dependencies, burndown charts, mind mapping, project health
**Estimated effort**: 5-6 days

**Phase Acceptance Criteria**:
- Timeline view shows tasks on a horizontal time axis with milestones
- Dependencies can be set between tasks and visualized
- Burndown chart shows sprint progress over time
- Mind map canvas allows brainstorming with node-to-task conversion
- Project health indicators show on-track/at-risk/behind status
- All Phase 3 critical path tests pass

#### Step 1: Timeline / Gantt View
**Files to create**:
```
/src/app/(app)/projects/[id]/timeline/page.tsx   - Timeline page (RSC)
/src/app/(app)/projects/[id]/timeline/loading.tsx
/src/components/timeline/timeline-view.tsx        - Timeline container (client)
/src/components/timeline/timeline-bar.tsx         - Task bar on timeline
/src/components/timeline/timeline-header.tsx      - Date header with zoom
/src/components/timeline/milestone-marker.tsx     - Milestone diamond on timeline
```

**Implementation note**: Build custom with CSS Grid. Avoid heavy Gantt libraries.

**Acceptance**:
- Tasks with start/due dates render as horizontal bars on timeline
- Milestones render as diamond markers at their target dates
- Timeline can be scrolled horizontally and zoomed (day/week/month)
- Tasks without dates are listed in a sidebar "unscheduled" section
- Empty state for timeline with no dated tasks

#### Step 2: Dependencies + Milestones
**Files to create**:
```
/src/actions/dependency.ts                       - Dependency CRUD with cycle detection
/src/actions/milestone.ts                        - Milestone CRUD
/src/components/timeline/dependency-line.tsx      - SVG dependency arrows (client)
/src/components/task/dependency-picker.tsx        - Add dependency UI (client)
/src/components/milestone/milestone-dialog.tsx   - Create/edit milestone (client)
/src/components/milestone/milestone-list.tsx     - Milestone list with status
```

**Acceptance**:
- Dependencies can be created between tasks (4 types)
- Dependency arrows render on timeline view
- Circular dependency detection prevents invalid dependencies
- Milestones can be created, marked as reached/missed
- Empty state for no milestones

#### Step 3: Reporting + Charts
**Files to create**:
```
/src/app/(app)/projects/[id]/reports/page.tsx    - Reports page (RSC)
/src/app/(app)/projects/[id]/reports/loading.tsx
/src/components/reports/burndown-chart.tsx        - Sprint burndown chart (client)
/src/components/reports/burnup-chart.tsx          - Sprint burnup chart (client)
/src/components/reports/progress-report.tsx       - Weekly summary
/src/components/reports/project-health.tsx        - Health indicator (on-track/at-risk/behind)
/src/components/reports/chart-wrapper.tsx         - Recharts wrapper
/src/components/reports/velocity-chart.tsx        - Tasks completed per sprint (client)
```

**Project Health Logic**:
- **On track**: >= 80% of tasks on schedule (completedAt <= dueDate or no dueDate)
- **At risk**: 50-79% on schedule
- **Behind**: < 50% on schedule

**Burndown Chart Data**:
- X-axis: days within sprint date range
- Y-axis: remaining task count (or estimated hours if available)
- Ideal line: linear from total to 0
- Actual line: computed from task completedAt timestamps within sprint

**Acceptance**:
- Burndown chart renders for active/completed sprints
- Burnup chart shows scope changes over time
- Project health indicator computes and displays correctly
- Velocity chart shows throughput across sprints
- Empty states for reports with insufficient data

#### Step 4: Mind Map / Brainstorming
**Files to create**:
```
/src/app/(app)/mindmaps/page.tsx                 - Mind map list (RSC)
/src/app/(app)/mindmaps/[id]/page.tsx            - Mind map canvas (RSC wrapper)
/src/app/(app)/mindmaps/loading.tsx
/src/actions/mindmap.ts                          - MindMap + MindMapNode CRUD
/src/components/mindmap/mindmap-canvas.tsx        - Canvas with pan/zoom (client)
/src/components/mindmap/mindmap-node.tsx          - Draggable node (client)
/src/components/mindmap/mindmap-edge.tsx          - SVG edge between nodes (client)
/src/components/mindmap/mindmap-toolbar.tsx       - Add node, convert to task, export
/src/components/mindmap/node-to-task-dialog.tsx   - Convert node to task (client)
```

**Implementation note**: Build with SVG/Canvas + drag events. Each node stores positionX/Y. Edges computed from parentNodeId relationships.

**Acceptance**:
- Can create new mind maps (standalone or linked to project)
- Can add/edit/delete nodes by clicking on canvas
- Can drag nodes to reposition
- Can nest nodes (child of parent)
- Can convert a node into a Task (creates task, stores reference)
- Converted nodes show a visual indicator (link icon)
- Empty state for no mind maps

#### Step 5: Goal > Plan > Execute Workflow View
**Files to create**:
```
/src/app/(app)/goals/[id]/workflow/page.tsx       - Goal workflow view (RSC)
/src/components/goal/goal-workflow.tsx            - 3-column layout: Goal > Plans > Tasks
/src/components/goal/goal-progress-chart.tsx      - Goal progress over time (client)
```

**Acceptance**:
- Workflow view shows: Goal (with KPIs) > Linked Projects > Tasks in those projects
- Visual progress indicators at each level (goal %, project %, task status)
- KPI sparklines show trend direction
- Can navigate to any entity by clicking

---

### Phase 4: Polish + Advanced Features
**Goal**: Keyboard shortcuts, dark mode toggle, data portability, recurring tasks, custom fields
**Estimated effort**: 3-4 days

**Phase Acceptance Criteria**:
- Keyboard shortcuts work for common actions (documented in Cmd+K)
- Dark mode toggle in header works
- Data can be exported as JSON and CSV
- Recurring tasks can be configured
- All Phase 4 critical path tests pass

#### Step 1: Keyboard Shortcuts + Dark Mode Toggle
**Files to create**:
```
/src/hooks/use-keyboard-shortcuts.ts            - Global shortcut handler (client)
/src/components/theme/theme-toggle.tsx           - Dark mode switch (client)
```

**Shortcuts**:
- `Cmd+K`: Command palette
- `Cmd+N`: New task
- `Cmd+Shift+N`: New project
- `1/2/3/4`: Switch views (Board/List/Calendar/Timeline)

**Acceptance**:
- All shortcuts work and are listed in command palette
- Dark mode toggles between light/dark/system
- Theme persists across page reloads

#### Step 2: Data Export/Import + Settings
**Files to create**:
```
/src/actions/export.ts                           - Data export action (JSON, CSV)
/src/actions/import.ts                           - Data import action (JSON)
/src/app/(app)/settings/page.tsx                 - App settings page (RSC)
/src/app/(app)/settings/loading.tsx
/src/components/settings/export-section.tsx      - Export controls
/src/components/settings/import-section.tsx      - Import with validation
/src/components/settings/danger-zone.tsx         - Reset/clear data
```

**Acceptance**:
- Export downloads a JSON file with all workspace data
- Export CSV downloads task list as spreadsheet
- Import validates JSON structure before inserting
- Settings page accessible from sidebar

#### Step 3: Recurring Tasks + Templates
**Files to create**:
```
/src/components/task/recurrence-picker.tsx        - Recurrence config (client)
/src/components/task/task-template-dialog.tsx     - Save/apply templates (client)
/src/actions/recurrence.ts                       - Recurrence logic
/src/actions/template.ts                         - Template CRUD
```

**Acceptance**:
- Tasks can be set to recur (daily, weekly, monthly, custom)
- Completed recurring tasks auto-create next occurrence
- Task templates can be saved and applied to new tasks

#### Step 4: Custom Fields + Saved Filters
**Files to create**:
```
/src/components/task/custom-fields.tsx           - Custom field editor (client)
/src/components/filter/saved-filters.tsx         - Save/load filter presets (client)
/src/actions/custom-field.ts                     - Custom field CRUD
/src/actions/filter.ts                           - Saved filter CRUD
```

**Acceptance**:
- Custom text/number/date/select fields can be added to tasks
- Filters can be saved with name and recalled
- Saved filters appear in sidebar under project

---

## Testing Strategy

### Framework Choices
- **Unit tests**: Vitest + React Testing Library (fast, Vite-native, Jest-compatible API)
- **Integration tests**: Vitest with Prisma test client (in-memory SQLite)
- **E2E tests**: Playwright (cross-browser, reliable, Next.js integration)

### File Conventions
- Unit/integration tests: `src/**/*.test.ts(x)` colocated with source files
- E2E tests: `e2e/**/*.spec.ts` in project root
- Test utilities: `src/test/setup.ts`, `src/test/helpers.ts`
- Prisma test helper: `src/test/db.ts` (isolated test database)

### Coverage Targets
- **Unit tests**: >= 80% for server actions and utility functions
- **Integration tests**: >= 70% for data layer (Prisma queries, validation)
- **E2E tests**: Critical user journeys covered (see per-phase list below)

### Critical Path Tests by Phase

**Phase 1**:
```
Unit:
- src/actions/task.test.ts          - Task CRUD, subtask depth validation, archive
- src/actions/workspace.test.ts     - Workspace CRUD
- src/actions/project.test.ts       - Project CRUD
- src/lib/validators.test.ts        - All Zod schemas (valid + invalid inputs)
- src/hooks/use-server-action.test.ts - Hook behavior (loading, error, success)

E2E:
- e2e/task-lifecycle.spec.ts        - Create task > edit > change status > complete
- e2e/kanban-dnd.spec.ts            - Drag task between columns, verify persistence
- e2e/today-view.spec.ts            - Add to daily plan > mark done > summary updates
```

**Phase 2**:
```
Unit:
- src/actions/epic.test.ts          - Epic CRUD, task grouping
- src/actions/goal.test.ts          - Goal CRUD, project linking
- src/actions/kpi.test.ts           - KPI CRUD, entry recording, trend calculation
- src/actions/sprint.test.ts        - Sprint CRUD, task assignment, active constraint
- src/actions/label.test.ts         - Label CRUD, task assignment

E2E:
- e2e/search-command.spec.ts       - Cmd+K opens, search finds tasks, navigation works
- e2e/goal-kpi.spec.ts             - Create goal > add KPI > record entry > verify trend
- e2e/sprint-workflow.spec.ts      - Create sprint > assign tasks > view in sprint
```

**Phase 3**:
```
Unit:
- src/actions/dependency.test.ts    - Dependency CRUD, circular detection
- src/actions/milestone.test.ts     - Milestone CRUD, status transitions
- src/actions/mindmap.test.ts       - MindMap CRUD, node-to-task conversion

E2E:
- e2e/timeline-view.spec.ts        - Tasks render on timeline, milestones visible
- e2e/mindmap.spec.ts              - Create map > add nodes > convert to task
- e2e/burndown.spec.ts             - Sprint with tasks > complete tasks > chart updates
```

**Phase 4**:
```
Unit:
- src/actions/export.test.ts        - Export produces valid JSON/CSV
- src/actions/import.test.ts        - Import validates and inserts correctly

E2E:
- e2e/keyboard-shortcuts.spec.ts   - All shortcuts trigger correct actions
- e2e/dark-mode.spec.ts            - Theme toggles and persists
- e2e/export-import.spec.ts        - Export > delete > import > data restored
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **SQLite performance with large datasets** | Low | Medium | Index frequently queried columns (status, projectId, dueDate). Paginate list views. Monitor query times in dev. |
| **Prisma + SQLite driver compatibility** | Low | High | Prisma 6 has mature SQLite support. Pin Prisma version. Test migrations early. |
| **@dnd-kit + React 19 compatibility** | Medium | Medium | @dnd-kit v6 supports React 19. If issues arise, fallback to HTML5 drag events. |
| **Recharts bundle size** | Low | Low | Tree-shake unused chart types. Lazy-load chart components. Only import in client components. |
| **Mind map performance with many nodes** | Medium | Medium | Virtualize canvas for >100 nodes. Debounce position updates. Store positions as integers (round floats). |
| **Tailwind v4 ecosystem maturity** | Medium | Low | If shadcn/ui components have v4 issues, use CSS overrides. Tailwind v4 is production-ready as of 2026. |
| **Scope creep from new features** | High | High | Strict phase boundaries. New feature requests go to P3/P4 backlog. Ship Phase 1 before starting Phase 2. |
| **Data loss during development** | Medium | High | Seed script provides demo data. Prisma migrations are versioned. Export feature (Phase 4) provides backup. Consider manual DB backup instructions in Phase 1. |

---

## Project Structure

```
/Users/jongsports/pm/
  prisma/
    schema.prisma
    seed.ts
    migrations/
  e2e/
    task-lifecycle.spec.ts
    kanban-dnd.spec.ts
    today-view.spec.ts
    search-command.spec.ts
    goal-kpi.spec.ts
    sprint-workflow.spec.ts
    timeline-view.spec.ts
    mindmap.spec.ts
    burndown.spec.ts
    keyboard-shortcuts.spec.ts
    dark-mode.spec.ts
    export-import.spec.ts
  src/
    test/
      setup.ts
      helpers.ts
      db.ts
    app/
      layout.tsx
      page.tsx
      globals.css                   - Tailwind v4 @theme config
      (app)/
        layout.tsx
        loading.tsx
        today/
          page.tsx
          loading.tsx
        dashboard/
          page.tsx
          loading.tsx
        goals/
          page.tsx
          [id]/
            page.tsx
            workflow/page.tsx
          loading.tsx
        workspaces/
          page.tsx
          [id]/page.tsx
          loading.tsx
        projects/
          [id]/
            page.tsx
            board/page.tsx
            list/page.tsx
            calendar/page.tsx
            timeline/page.tsx
            reports/page.tsx
            sprints/page.tsx
            loading.tsx
        mindmaps/
          page.tsx
          [id]/page.tsx
          loading.tsx
        settings/
          page.tsx
          loading.tsx
    actions/
      workspace.ts
      project.ts
      epic.ts
      task.ts
      label.ts
      daily.ts
      dependency.ts
      milestone.ts
      goal.ts
      kpi.ts
      sprint.ts
      mindmap.ts
      activity.ts
      export.ts
      import.ts
      recurrence.ts
      template.ts
      custom-field.ts
      filter.ts
    components/
      layout/
        sidebar.tsx
        header.tsx
        app-shell.tsx
      board/
        kanban-board.tsx
        kanban-column.tsx
        task-card.tsx
      list/
        task-table.tsx
        task-row.tsx
      today/
        daily-tasks.tsx
        quick-add.tsx
        daily-summary.tsx
        daily-review.tsx
      task/
        task-create-dialog.tsx
        task-detail-panel.tsx
        priority-badge.tsx
        status-select.tsx
        subtask-list.tsx
        dependency-picker.tsx
        recurrence-picker.tsx
        task-template-dialog.tsx
        custom-fields.tsx
      workspace/
        workspace-card.tsx
        workspace-dialog.tsx
      project/
        project-card.tsx
        project-dialog.tsx
        project-header.tsx
      epic/
        epic-list.tsx
        epic-card.tsx
      label/
        label-picker.tsx
        label-badge.tsx
      calendar/
        calendar-view.tsx
        calendar-day.tsx
      timeline/
        timeline-view.tsx
        timeline-bar.tsx
        timeline-header.tsx
        milestone-marker.tsx
        dependency-line.tsx
      milestone/
        milestone-dialog.tsx
        milestone-list.tsx
      sprint/
        sprint-card.tsx
        sprint-dialog.tsx
        sprint-task-picker.tsx
      goal/
        goal-card.tsx
        goal-dialog.tsx
        goal-project-linker.tsx
        goal-workflow.tsx
        goal-progress-chart.tsx
      kpi/
        kpi-card.tsx
        kpi-trend-chart.tsx
        kpi-entry-dialog.tsx
      mindmap/
        mindmap-canvas.tsx
        mindmap-node.tsx
        mindmap-edge.tsx
        mindmap-toolbar.tsx
        node-to-task-dialog.tsx
      dashboard/
        stats-cards.tsx
        project-progress.tsx
        recent-tasks.tsx
        upcoming-deadlines.tsx
        activity-heatmap.tsx
        completion-trend.tsx
        kpi-summary.tsx
      reports/
        burndown-chart.tsx
        burnup-chart.tsx
        progress-report.tsx
        project-health.tsx
        chart-wrapper.tsx
        velocity-chart.tsx
      command/
        command-palette.tsx
      theme/
        theme-toggle.tsx
      filter/
        saved-filters.tsx
      settings/
        export-section.tsx
        import-section.tsx
        danger-zone.tsx
      shared/
        empty-state.tsx
      providers.tsx
      ui/                              -- shadcn/ui components installed here
    hooks/
      use-server-action.ts
      use-keyboard-shortcuts.ts
    lib/
      db.ts
      utils.ts
      validators.ts
      constants.ts
      action-utils.ts
    types/
      index.ts                         -- shared TypeScript types
  vitest.config.ts
  playwright.config.ts
  postcss.config.mjs
  components.json
```

---

## Success Criteria

1. **Functional**: All P0 features work without errors; tasks can be created, moved, completed
2. **Performance**: Page loads under 500ms, drag-and-drop feels instant (<100ms visual feedback)
3. **Data Integrity**: SQLite database persists across restarts, no data loss, soft archival works
4. **Usability**: Today view enables quick daily planning in under 30 seconds
5. **Maintainability**: Clear RSC/client boundary, typed throughout, Prisma schema is source of truth
6. **Goal Tracking**: Goals with KPIs can be set, measured, and visualized
7. **Test Coverage**: Critical path tests pass for every phase before moving to next phase
8. **Error Handling**: All mutations show success/error feedback via toast; no silent failures

---

## RALPLAN-DR Summary

### Principles (5)

1. **Local-First**: All data stays on the user's machine. Zero external dependencies for core functionality. SQLite file is portable and backupable.
2. **Progressive Complexity**: Start with simple daily tasks, layer on project hierarchy, then goals and KPIs. The UI should not force the user into heavy PM workflow for a quick todo.
3. **Type Safety End-to-End**: Prisma schema generates types, Zod validates inputs, TypeScript enforces at compile time. No `any` types. Server actions return typed `ActionResult<T>`.
4. **Server Components by Default**: Leverage Next.js 15 RSC for data fetching. Client components only for interactivity (drag-and-drop, forms, charts, mind map canvas). Minimize client-side JS bundle.
5. **Measure What Matters**: Goals and KPIs are first-class entities. Activity is tracked automatically. The tool itself practices data-driven progress tracking.

### Decision Drivers (Top 3)

1. **Immediate Usability**: The user needs this tool at work now. Phase 1 must deliver a usable daily task manager + Kanban board within 3-4 days. Speed to first usable version is the top priority.
2. **Zero Ops Overhead**: Single-user local tool means no auth, no cloud DB, no deployment pipeline. SQLite + `npm run dev` is the entire ops story.
3. **Feature Depth over Breadth**: Rather than building many shallow features, each implemented feature should feel polished and complete. Enterprise-grade UX in the features that ship, including proper error handling, empty states, loading states, and optimistic updates.

### Viable Options

#### Option A: Next.js 15 + SQLite Local-First (RECOMMENDED)

| Aspect | Detail |
|--------|--------|
| Stack | Next.js 15 App Router, Prisma + SQLite, shadcn/ui, Vitest + Playwright |
| Pros | Zero external dependencies; instant setup; portable DB file; server actions for mutations; RSC for fast loads; single `npm run dev` to start; comprehensive test infrastructure |
| Cons | No real-time collaboration (acceptable for single-user); SQLite has no concurrent write support (irrelevant for single-user); no built-in auth (not needed) |
| Risk | SQLite may need migration to PostgreSQL if multi-user is ever needed |
| Fit | Perfectly matches "use immediately at work, single-user, local tool" requirement |

#### Option B: Next.js 15 + PostgreSQL Full-Stack

| Aspect | Detail |
|--------|--------|
| Stack | Next.js 15 App Router, Prisma + PostgreSQL, shadcn/ui |
| Pros | Production-grade DB; supports future multi-user; concurrent writes; full SQL features |
| Cons | Requires PostgreSQL installation and management; external dependency; more complex local setup; overkill for single-user |
| Invalidation Rationale | **Rejected**: Adds operational complexity (install/configure/manage PostgreSQL) that directly contradicts the "use immediately" and "zero ops overhead" requirements. Migration path from SQLite to PostgreSQL via Prisma exists if ever needed. |

#### Option C: Electron + SQLite Desktop App

| Aspect | Detail |
|--------|--------|
| Stack | Electron, React, better-sqlite3, Tailwind |
| Pros | True desktop app; system tray integration; offline by default; native OS integration |
| Cons | Massive bundle size (~150MB+); complex build/update pipeline; Electron security concerns; slower development cycle |
| Invalidation Rationale | **Rejected**: Electron adds massive complexity and development overhead for marginal benefit. Next.js provides equivalent local-first capability with `localhost` access while being dramatically faster to develop. |

### ADR (Architectural Decision Record)

| Field | Content |
|-------|---------|
| **Decision** | Next.js 15 + SQLite local-first web application with Vitest + Playwright testing |
| **Drivers** | Immediate usability, zero ops overhead, feature depth, single-user local tool, testability |
| **Alternatives Considered** | PostgreSQL full-stack (rejected: ops overhead), Electron desktop (rejected: dev complexity and delivery delay) |
| **Why Chosen** | Best balance of development speed, zero-config operation, and feature capability. Prisma + SQLite gives type-safe DB with zero external dependencies. Next.js 15 RSC + server actions provide the fastest path to a working PM tool. Vitest + Playwright provide fast, reliable test infrastructure. |
| **Consequences** | Limited to single-user (acceptable). No real-time collaboration (not needed). Future multi-user would require DB migration (Prisma makes this straightforward). Tailwind v4 CSS-based config requires awareness of differences from v3. |
| **Follow-ups** | Consider PostgreSQL migration if multi-user need arises. Consider PWA features for mobile access. Consider `next build` static export for distribution. |

---

## Open Questions

See `/Users/jongsports/pm/.omc/plans/open-questions.md` for tracked items.
