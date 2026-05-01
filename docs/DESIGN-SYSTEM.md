# DESIGN-SYSTEM.md - PM Design System

> Design Philosophy: "Linear's minimalism + Notion's information structure + unique color identity"
> Brand Color: **Teal** - professional, calming, distinctive

---

## 1. Color System

### Brand Color: Teal (#0D9488)

Teal was chosen over Indigo for distinctiveness from competitors (Linear=purple, Jira=blue)
and its calming, professional quality for a productivity tool.

### Light Mode (`:root`)

```
Background:      oklch(1 0 0)        -- #FFFFFF
Foreground:      oklch(0.145 0 0)     -- near-black
Primary:         #0D9488              -- Teal 600
Primary Hover:   #0F766E              -- Teal 700
Primary Muted:   rgba(13,148,136,0.1) -- Teal 10%
Card:            oklch(1 0 0)
Muted:           oklch(0.97 0 0)
Border:          oklch(0.922 0 0)
```

### Dark Mode (`.dark`)

```
Background:      oklch(0.145 0 0)     -- near-black
Foreground:      oklch(0.985 0 0)     -- near-white
Primary:         #2DD4BF              -- Teal 400
Primary Hover:   #5EEAD4              -- Teal 300
Primary Muted:   rgba(45,212,191,0.15)
Card:            oklch(0.205 0 0)
Muted:           oklch(0.269 0 0)
Border:          oklch(1 0 0 / 10%)
```

### Semantic Colors

```
Success:  #22C55E (green-500)
Warning:  #F59E0B (amber-500)
Danger:   #EF4444 (red-500)
Info:     #3B82F6 (blue-500)
```

### Priority Colors

```
Urgent:   #EF4444 (red)
High:     #F97316 (orange)
Medium:   #EAB308 (yellow)
Low:      #0D9488 (teal, matches brand)
None:     muted-foreground (gray)
```

### Project Preset Colors (12)

```
#0D9488 (teal)     #8B5CF6 (violet)   #EC4899 (pink)
#F43F5E (rose)     #F97316 (orange)   #F59E0B (amber)
#84CC16 (lime)     #10B981 (emerald)  #14B8A6 (teal-light)
#06B6D4 (cyan)     #3B82F6 (blue)     #64748B (slate)
```

---

## 2. Typography

- **Font**: Geist Sans (already configured)
- **Mono**: Geist Mono (for numbers, code, kbd)
- **Base size**: 14px (0.875rem) -- consistent with Linear/Notion
- **Weights**: 400 (normal), 500 (medium, most used), 600 (semibold, titles)
- **Page title**: 20px / semibold / tracking-tight
- **Section header**: 13px / medium / uppercase / muted-foreground
- **Body**: 14px / normal
- **Meta/caption**: 13px / normal / muted-foreground
- **Badge**: 12px / medium

---

## 3. Spacing & Layout

- **Scale**: 4px base (Tailwind default)
- **Sidebar**: 256px (w-64), hidden on mobile
- **Header**: 56px (h-14)
- **Content padding**: 24px (p-6)
- **Content max-width**: varies by page type
  - Dashboard/Reports: max-w-5xl mx-auto
  - Settings/Today: max-w-2xl mx-auto
  - Grid pages (goals, workspaces): max-w-6xl mx-auto
  - Full-width (kanban, calendar, timeline): no max-width
- **Card gap**: 16px (gap-4)
- **Section gap**: 32px (space-y-8)

---

## 4. Component Patterns

### Buttons
- Primary: bg-primary text-primary-foreground, rounded-md
- Secondary: bg-secondary text-secondary-foreground
- Ghost: transparent, hover:bg-accent
- Danger: bg-destructive text-destructive-foreground
- Size: sm(28px), default(36px), lg(40px), icon(36x36)

### Cards
- shadcn Card with ring-1 ring-foreground/10
- hover:shadow-md transition-shadow for clickable cards
- py-4 px-4 internal padding

### Task Card (Kanban)
- Left priority color bar (border-l-3)
- Title + priority badge + due date
- Drag handle (grip icon)
- p-3 internal padding

### Labels/Badges
- Pill shape (rounded-full)
- 12px font, medium weight
- Background: color at 15% opacity, text: full color

### Empty States
- Centered, py-12
- Icon (48px, muted-foreground) + title + description
- Action button when applicable

### Navigation
- Sidebar: icon + text, rounded-md, py-2 px-3
- Active: bg-sidebar-accent text-sidebar-accent-foreground
- ProjectHeader: breadcrumb + tabs, border-b

---

## 5. Motion

- **Hover**: 150ms ease
- **Panel open/close**: 200ms ease
- **Modal**: 200ms ease
- **Drag feedback**: opacity-50 shadow-lg
- **Progress bar**: transition-all

---

## 6. Dark Mode Rules

- No pure black (#000) backgrounds
- No pure white (#FFF) text in dark mode
- Use oklch color space for smooth transitions
- All colors via CSS variables (never hardcode)
- Semantic colors adapt between modes

---

## 7. Responsive Breakpoints

- **Mobile** (<768px): sidebar hidden, hamburger menu, stacked layouts
- **Tablet** (768-1024px): sidebar visible, 2-column grids
- **Desktop** (>1024px): full layout, 3-column grids
- **Wide** (>1280px): content max-width prevents excessive stretching

---

## 8. Icon System

- **Library**: Lucide Icons (lucide-react)
- **Sizes**: 16px (inline), 20px (buttons), 24px (page headers), 48px (empty states)
- **Stroke**: default (no custom stroke-width)
