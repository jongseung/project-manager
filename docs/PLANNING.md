# 🎯 TaskFlow — 프로젝트 매니지먼트 웹앱

## 프로젝트 개요

소규모 팀(2~5명)을 위한 프로젝트 매니지먼트 웹앱.
데일리 루틴부터 장기 프로젝트까지 체계적으로 관리할 수 있는 올인원 도구.

---

## 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | SSR/SSG, API Routes 통합 |
| 언어 | TypeScript | 타입 안전성 |
| DB | PostgreSQL | 관계형 데이터, 반복 태스크 스케줄링에 적합 |
| ORM | Prisma | 스키마 관리, 마이그레이션 자동화 |
| 인증 | NextAuth.js (Auth.js v5) | 소셜 로그인 + credentials |
| 스타일링 | Tailwind CSS + shadcn/ui | 빠른 UI 개발 |
| 상태관리 | Zustand (클라이언트) + React Query (서버) | 심플하고 강력 |
| 드래그앤드롭 | @dnd-kit/core | 칸반보드용, 접근성 우수 |
| 캘린더 | @fullcalendar/react | 타임라인/캘린더 뷰 |
| 차트 | Recharts | 대시보드 통계 |
| 배포 | Vercel + Supabase PostgreSQL (또는 Neon) | 무료 티어로 시작 가능 |

---

## 데이터 모델

### 핵심 엔티티 관계도

```
User (팀원)
 ├── Workspace (워크스페이스) — 팀 단위 컨테이너
 │    ├── Project (프로젝트) — 장기 목표
 │    │    ├── Milestone (마일스톤) — 중간 체크포인트
 │    │    │    └── Task (태스크) — 실제 작업 단위
 │    │    │         ├── Subtask (서브태스크) — 체크리스트 항목
 │    │    │         ├── Comment (코멘트)
 │    │    │         └── ActivityLog (활동 로그)
 │    │    └── Task (프로젝트 직속 태스크)
 │    ├── RecurringTemplate (반복 태스크 템플릿)
 │    ├── Label (라벨/태그)
 │    └── BoardView (칸반보드 설정)
 └── Notification (알림)
```

### 스키마 상세

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── 사용자 & 워크스페이스 ───

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  avatarUrl     String?
  createdAt     DateTime @default(now())

  memberships   WorkspaceMember[]
  assignedTasks Task[]           @relation("TaskAssignee")
  comments      Comment[]
  notifications Notification[]
}

model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())

  members   WorkspaceMember[]
  projects  Project[]
  labels    Label[]
  recurring RecurringTemplate[]
  boards    BoardView[]
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  role        Role     @default(MEMBER)
  joinedAt    DateTime @default(now())

  userId      String
  user        User      @relation(fields: [userId], references: [id])
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([userId, workspaceId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

// ─── 프로젝트 & 태스크 계층 ───

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  color       String        @default("#6366f1") // 인디고
  status      ProjectStatus @default(ACTIVE)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  workspaceId String
  workspace   Workspace  @relation(fields: [workspaceId], references: [id])
  milestones  Milestone[]
  tasks       Task[]
}

enum ProjectStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

model Milestone {
  id        String    @id @default(cuid())
  name      String
  dueDate   DateTime?
  completed Boolean   @default(false)
  sortOrder Int       @default(0)

  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    Priority     @default(MEDIUM)
  dueDate     DateTime?
  startDate   DateTime?
  sortOrder   Int          @default(0)
  boardColumn String       @default("todo") // 칸반 컬럼
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  completedAt DateTime?

  // 관계
  projectId   String?
  project     Project?   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  milestoneId String?
  milestone   Milestone? @relation(fields: [milestoneId], references: [id], onDelete: SetNull)
  assigneeId  String?
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id])

  // 반복 태스크 원본
  recurringId String?
  recurring   RecurringTemplate? @relation(fields: [recurringId], references: [id])

  // 스토리 연결 (FEATURES-INCEPTION.md 참고)
  storyId     String?
  story       Story?    @relation("StoryTasks", fields: [storyId], references: [id])

  subtasks    Subtask[]
  comments    Comment[]
  labels      TaskLabel[]
  activities  ActivityLog[]
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}

enum Priority {
  URGENT
  HIGH
  MEDIUM
  LOW
}

model Subtask {
  id        String  @id @default(cuid())
  title     String
  completed Boolean @default(false)
  sortOrder Int     @default(0)

  taskId String
  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

// ─── 반복 태스크 ───

model RecurringTemplate {
  id          String         @id @default(cuid())
  title       String
  description String?
  priority    Priority       @default(MEDIUM)
  frequency   Frequency
  interval    Int            @default(1)    // 매 N번째
  daysOfWeek  Int[]          @default([])   // 0=일, 1=월, ..., 6=토
  dayOfMonth  Int?                          // 월간: 몇일
  timeOfDay   String?                       // "09:00" 형식
  isActive    Boolean        @default(true)
  nextRunAt   DateTime
  lastRunAt   DateTime?
  createdAt   DateTime       @default(now())

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  tasks       Task[]    // 이 템플릿으로 생성된 태스크들

  subtaskTemplates SubtaskTemplate[]
  labelIds         String[] @default([]) // 자동 부여할 라벨 ID
}

enum Frequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
  CUSTOM
}

model SubtaskTemplate {
  id        String @id @default(cuid())
  title     String
  sortOrder Int    @default(0)

  recurringId String
  recurring   RecurringTemplate @relation(fields: [recurringId], references: [id], onDelete: Cascade)
}

// ─── 라벨 & 보드 ───

model Label {
  id    String @id @default(cuid())
  name  String
  color String @default("#8b5cf6")

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  tasks       TaskLabel[]
}

model TaskLabel {
  taskId  String
  task    Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  labelId String
  label   Label @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([taskId, labelId])
}

model BoardView {
  id      String   @id @default(cuid())
  name    String
  columns Json     // [{ id, title, color, taskStatuses }]

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}

// ─── 커뮤니케이션 & 로그 ───

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())

  taskId String
  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId String
  user   User @relation(fields: [userId], references: [id])
}

model ActivityLog {
  id        String   @id @default(cuid())
  action    String   // "status_changed", "assigned", "commented" 등
  details   Json?    // { from: "TODO", to: "DONE" }
  createdAt DateTime @default(now())

  taskId String
  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model Notification {
  id        String   @id @default(cuid())
  type      String   // "task_assigned", "due_soon", "mentioned"
  message   String
  read      Boolean  @default(false)
  link      String?  // 클릭 시 이동할 경로
  createdAt DateTime @default(now())

  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

---

## 기능 우선순위 & 구현 페이즈

### Phase 1 — 기반 (MVP)
> 목표: 기본 CRUD + 반복 태스크가 동작하는 최소 기능 앱

| # | 기능 | 설명 | 예상 난이도 |
|---|------|------|------------|
| 1.1 | 인증 | 이메일/비밀번호 + Google OAuth | ⭐⭐ |
| 1.2 | 워크스페이스 생성 | 팀 생성, 초대 링크 | ⭐⭐ |
| 1.3 | 프로젝트 CRUD | 생성/수정/삭제/아카이브 | ⭐ |
| 1.4 | 태스크 CRUD | 생성/수정/삭제, 상태변경, 우선순위 | ⭐⭐ |
| 1.5 | 서브태스크 | 체크리스트 형태 | ⭐ |
| 1.6 | **반복 태스크** | 템플릿 생성, cron 기반 자동 생성, 주기 설정 UI | ⭐⭐⭐ |
| 1.7 | 라벨/태그 | 태스크에 라벨 부여, 필터링 | ⭐ |

### Phase 2 — 칸반보드
> 목표: 드래그앤드롭으로 태스크 상태 관리

| # | 기능 | 설명 | 예상 난이도 |
|---|------|------|------------|
| 2.1 | 칸반 보드 뷰 | 컬럼별 태스크 배치, @dnd-kit | ⭐⭐⭐ |
| 2.2 | 컬럼 커스텀 | 컬럼 추가/삭제/이름변경 | ⭐⭐ |
| 2.3 | 필터 & 정렬 | 담당자, 라벨, 우선순위, 기한 필터 | ⭐⭐ |
| 2.4 | 태스크 상세 모달 | 클릭 시 상세보기/편집 슬라이드패널 | ⭐⭐ |
| 2.5 | 멀티 보드 뷰 | 프로젝트별/전체 보드 전환 | ⭐⭐ |

### Phase 2.5 — 스토리 & OKR 시스템 (신규)
> 목표: 프로젝트 기획 → 스토리 → 태스크 분해 흐름 + KPI 추적
> 상세: FEATURES-INCEPTION.md 참고

| # | 기능 | 설명 | 예상 난이도 |
|---|------|------|------------|
| 2.5.1 | 프로젝트 인셉션 | problemStatement, definitionOfDone 필드 | ⭐ |
| 2.5.2 | Objective / KR CRUD | OKR 설정 UI, 방향/단위/목표값 | ⭐⭐ |
| 2.5.3 | Story CRUD | 스토리 생성, 유저스토리 형식, 포인트 | ⭐⭐ |
| 2.5.4 | Story ↔ KR 연결 | 다대다 연결, 예상 영향도 | ⭐⭐ |
| 2.5.5 | Story → Task 분해 | 스토리 상세에서 태스크 생성 UI | ⭐⭐ |
| 2.5.6 | 스토리 보드 | 칸반 형태 스토리 관리 | ⭐⭐ |

### Phase 3 — 캘린더 & 타임라인
> 목표: 시간 기반 태스크 시각화

| # | 기능 | 설명 | 예상 난이도 |
|---|------|------|------------|
| 3.1 | 캘린더 뷰 | 월/주/일 뷰, 태스크 기한 표시 | ⭐⭐⭐ |
| 3.2 | 드래그 리스케줄 | 캘린더에서 드래그로 기한 변경 | ⭐⭐ |
| 3.3 | 간트 차트 | 프로젝트/마일스톤 타임라인 | ⭐⭐⭐ |
| 3.4 | 반복 태스크 캘린더 | 루틴 일정 시각화 | ⭐⭐ |

### Phase 3.5 — 브레인스토밍 (신규)
> 목표: 아이디어를 시각적으로 정리하고 스토리로 변환
> 상세: FEATURES-INCEPTION.md 참고

| # | 기능 | 설명 | 예상 난이도 |
|---|------|------|------------|
| 3.5.1 | 브레인스토밍 리스트 뷰 | 계층형 노드 CRUD, 들여쓰기 | ⭐⭐ |
| 3.5.2 | 카드 뷰 | 포스트잇 스타일 그리드 | ⭐⭐ |
| 3.5.3 | 노드 → 스토리 변환 | 원클릭 변환, 연결 유지 | ⭐⭐ |
| 3.5.4 | 마인드맵 캔버스 | 드래그 배치, 연결선 (Phase 5로 연기 가능) | ⭐⭐⭐⭐ |

### Phase 4 — 대시보드 & KPI 분석
> 목표: 생산성 인사이트

| # | 기능 | 설명 | 예상 난이도 |
|---|------|------|------------|
| 4.1 | 개인 대시보드 | 오늘 할 일, 오버듀, 이번 주 요약 | ⭐⭐ |
| 4.2 | 팀 대시보드 | 멤버별 진행률, 워크로드 분포 | ⭐⭐⭐ |
| 4.3 | 완료율 차트 | 일별/주별/월별 태스크 완료 추이 | ⭐⭐ |
| 4.4 | 프로젝트 진행률 | 마일스톤 기반 진행 바 | ⭐ |
| 4.5 | **KPI 대시보드** | OKR 진행률, KR 추이 차트, 목표선 | ⭐⭐⭐ |
| 4.6 | **KPI vs 액션 타임라인** | KR 변화 + 완료된 스토리 오버레이 | ⭐⭐⭐ |
| 4.7 | **KR 스냅샷 기록** | 수동 값 입력 + 메모, 이력 관리 | ⭐⭐ |
| 4.8 | **스토리 완료→KPI 리마인더** | 자동 알림으로 KR 값 업데이트 유도 | ⭐⭐ |

### Phase 5 — 폴리시 & 확장
> 목표: 사용성 개선, 팀 협업 강화

| # | 기능 | 설명 |
|---|------|------|
| 5.1 | 실시간 알림 | WebSocket 기반 알림 |
| 5.2 | 코멘트 & 멘션 | @멘션, 태스크 토론 |
| 5.3 | 활동 로그 | 태스크 변경 이력 타임라인 |
| 5.4 | 모바일 반응형 | 모바일 최적화 |
| 5.5 | 검색 | 글로벌 태스크/프로젝트 검색 |
| 5.6 | 다크모드 | 테마 전환 |

---

## 페이지 & 라우팅 구조

```
/                           → 랜딩 페이지 (미인증 시)
/login                      → 로그인
/signup                     → 회원가입

/[workspace-slug]/           → 워크스페이스 홈 (대시보드)
/[workspace-slug]/board      → 칸반 보드 (기본 뷰)
/[workspace-slug]/calendar   → 캘린더 뷰
/[workspace-slug]/timeline   → 간트 차트
/[workspace-slug]/routines   → 반복 태스크 관리
/[workspace-slug]/projects   → 프로젝트 목록
/[workspace-slug]/projects/[id] → 프로젝트 상세 (태스크 리스트)
/[workspace-slug]/settings   → 워크스페이스 설정 (멤버 관리)
```

---

## API 엔드포인트 설계

```
# 인증
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/session

# 워크스페이스
POST   /api/workspaces
GET    /api/workspaces
GET    /api/workspaces/[slug]
PATCH  /api/workspaces/[slug]
POST   /api/workspaces/[slug]/invite

# 프로젝트
GET    /api/workspaces/[slug]/projects
POST   /api/workspaces/[slug]/projects
PATCH  /api/projects/[id]
DELETE /api/projects/[id]

# 마일스톤
GET    /api/projects/[id]/milestones
POST   /api/projects/[id]/milestones
PATCH  /api/milestones/[id]
DELETE /api/milestones/[id]

# 태스크
GET    /api/workspaces/[slug]/tasks          # 필터: project, status, assignee, label, dueDate
POST   /api/workspaces/[slug]/tasks
GET    /api/tasks/[id]
PATCH  /api/tasks/[id]
DELETE /api/tasks/[id]
PATCH  /api/tasks/[id]/move                  # 칸반 이동 (column + sortOrder)
POST   /api/tasks/[id]/subtasks
PATCH  /api/subtasks/[id]

# 반복 태스크
GET    /api/workspaces/[slug]/recurring
POST   /api/workspaces/[slug]/recurring
PATCH  /api/recurring/[id]
DELETE /api/recurring/[id]
POST   /api/recurring/[id]/trigger           # 수동 실행

# 라벨
GET    /api/workspaces/[slug]/labels
POST   /api/workspaces/[slug]/labels
PATCH  /api/labels/[id]
DELETE /api/labels/[id]

# 보드
GET    /api/workspaces/[slug]/boards
POST   /api/workspaces/[slug]/boards
PATCH  /api/boards/[id]

# 코멘트
GET    /api/tasks/[id]/comments
POST   /api/tasks/[id]/comments

# 대시보드
GET    /api/workspaces/[slug]/dashboard      # 오늘 할일, 오버듀, 통계
GET    /api/workspaces/[slug]/analytics       # 완료율 추이 등

# 알림
GET    /api/notifications
PATCH  /api/notifications/read-all
```

---

## 반복 태스크 시스템 상세 설계

반복 태스크는 이 앱의 핵심 차별 기능이므로 상세히 설계한다.

### 동작 방식

1. 사용자가 `RecurringTemplate`을 생성 (예: "매주 월/수/금 코드리뷰", "매월 1일 월간보고")
2. **Cron Job** (Vercel Cron 또는 별도 스케줄러)이 주기적으로 실행
3. `nextRunAt`이 현재 시간 이전인 템플릿을 찾아 태스크 자동 생성
4. 태스크 생성 후 `nextRunAt`을 다음 실행 시간으로 업데이트

### Cron 실행 로직 (의사코드)

```
매 시간 실행:
  templates = RecurringTemplate.findMany({ nextRunAt <= now, isActive: true })
  for each template:
    task = Task.create({
      title: template.title,
      description: template.description,
      priority: template.priority,
      recurringId: template.id,
      dueDate: calculateDueDate(template),
      labels: template.labelIds,
      subtasks: template.subtaskTemplates
    })
    template.nextRunAt = calculateNextRun(template)
    template.lastRunAt = now
```

### 주기 계산 예시

| frequency | interval | daysOfWeek | 의미 |
|-----------|----------|------------|------|
| DAILY | 1 | [] | 매일 |
| DAILY | 2 | [] | 이틀마다 |
| WEEKLY | 1 | [1,3,5] | 매주 월/수/금 |
| MONTHLY | 1 | [], dayOfMonth=15 | 매월 15일 |
| QUARTERLY | 1 | [], dayOfMonth=1 | 분기 첫날 |

### UI 화면

- 반복 태스크 목록 (`/routines`): 활성/비활성 토글, 다음 실행 시간 표시
- 생성 폼: 제목, 설명, 주기 선택 (직관적 UI), 자동 부여 라벨, 서브태스크 템플릿
- 생성된 태스크에는 🔄 반복 아이콘 + 원본 템플릿 링크 표시

---

## UI/UX 가이드라인

### 레이아웃

```
┌─────────────────────────────────────────────┐
│  Top Bar: 워크스페이스 이름 | 검색 | 알림 | 프로필 │
├──────┬──────────────────────────────────────┤
│      │                                      │
│ Side │         Main Content Area            │
│ Nav  │                                      │
│      │   (Board / Calendar / Dashboard)     │
│  📋  │                                      │
│  📅  │                                      │
│  📊  │                                      │
│  🔄  │                                      │
│  ⚙️  │                                      │
│      │                                      │
└──────┴──────────────────────────────────────┘
```

### 디자인 원칙
- **정보 밀도 최적화**: 한 화면에서 필요한 정보를 바로 파악
- **최소 클릭**: 태스크 상태 변경은 1클릭, 생성은 인라인 입력 지원
- **키보드 단축키**: N(새 태스크), B(보드), C(캘린더), D(대시보드)
- **다크모드 우선**: 기본 다크, 라이트 전환 지원

### 컬러 팔레트

```
Primary:    #6366f1 (인디고)
Success:    #22c55e (그린)
Warning:    #f59e0b (앰버)
Danger:     #ef4444 (레드)
Background: #0f172a (다크) / #ffffff (라이트)
Surface:    #1e293b (다크) / #f8fafc (라이트)
Border:     #334155 (다크) / #e2e8f0 (라이트)
```

### 우선순위 색상
- 🔴 URGENT: #ef4444
- 🟠 HIGH: #f97316
- 🟡 MEDIUM: #eab308
- 🔵 LOW: #3b82f6

---

## 환경변수

```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## 클로드 코드 세션 가이드

### 세션 시작 시 항상 이 프롬프트로:

```
PLANNING.md, FEATURES.md, FEATURES-INCEPTION.md, FEATURES-GANTT.md, DESIGN-SYSTEM.md, CONVENTIONS.md, PROGRESS.md를 읽고,
현재 Phase와 진행 상태를 파악한 뒤,
다음 구현해야 할 기능을 알려줘.
FEATURES.md와 FEATURES-INCEPTION.md에서 해당 기능의 상세 명세를 참고해서 구현해줘.
```

### 세션 종료 시:

```
이번 세션에서 완료한 작업을 PROGRESS.md에 업데이트해줘.
```

### 기능 구현 요청 시:

```
Phase [N]의 [기능 번호]를 구현해줘.
PLANNING.md의 데이터 모델과 API 설계를 따라서 구현하고,
CONVENTIONS.md의 코딩 컨벤션을 지켜줘.
```
