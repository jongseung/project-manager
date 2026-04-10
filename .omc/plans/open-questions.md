# Open Questions

## project-manager-app - 2026-04-10

- [ ] Should the Today view auto-pull tasks with today's due date, or only manually added tasks? -- Affects daily planning UX and whether users must explicitly plan each day
- [ ] Preferred drag-and-drop library: @dnd-kit vs pragmatic-drag-and-drop? -- @dnd-kit is mature but pragmatic-drag-and-drop (by Atlassian) is newer and may have better React 19 support
- [ ] Should recurring tasks be implemented in Phase 2 or Phase 3? -- Daily standup/weekly review tasks are common PM workflows and might be needed earlier
- [ ] Data backup strategy: automatic SQLite file copy on a schedule, or manual export only? -- Risk of data loss if SQLite file corrupts without backup
- [ ] Should the timeline/Gantt view use a library (e.g., frappe-gantt) or be built custom with CSS Grid? -- Library saves time but adds dependency; custom gives full control over UX
- [ ] Preferred color scheme / brand identity for the app? -- Affects shadcn/ui theme configuration in Phase 1

## project-manager-app (Revision 1) - 2026-04-10

- [ ] Mind map rendering approach: SVG-based or Canvas-based? -- SVG is easier to style/interact with but may lag with 200+ nodes; Canvas scales better but needs custom hit detection
- [ ] KPI auto-calculation: should some KPIs (completion rate, velocity) be auto-computed from task data, or always manually recorded? -- Auto-compute reduces friction but limits flexibility for custom KPIs
- [ ] Activity heatmap scope: track all entity mutations, or only task completions? -- Full tracking gives richer data but increases ActivityLog table size
- [ ] Sprint workflow: should sprint completion auto-move incomplete tasks to next sprint, or leave them unassigned? -- Affects sprint retrospective and backlog management UX
- [ ] Goal progress calculation: simple average of linked project completion, or weighted by project size (task count)? -- Weighted is more accurate but harder to explain to the user
- [ ] Mind map to task conversion: should it create tasks in a specific project, or prompt the user to choose? -- Standalone mind maps have no project context, so user must pick
