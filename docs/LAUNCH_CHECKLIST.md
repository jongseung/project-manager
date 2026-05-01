# Launch Checklist

작성일: 2026-04-24

## ✅ 완료된 것 — 이 리포지토리에 반영됨

### 보안 / 멀티테넌시
- 모든 API 라우트 `requireApiOrg()` 적용, 조직 스코프 필터링
  - `/api/pm`, `/api/workspaces`, `/api/projects`, `/api/members`, `/api/tasks/[id]`, `/api/today-tasks`, `/api/search`, `/api/notifications`, `/api/notifications/mentions`, `/api/attachments`
- `/api/pm` 공개 노출 해제 (미들웨어 `publicPaths`에서 제거)
- 모든 서버 액션에 소유권 체크 (`userOwnsProject/Workspace/Task/Goal/Objective/KeyResult/Story/Epic/Sprint/Milestone/KPI/Label/MindMap/RecurringTemplate`)
- `import.ts` — 가져오는 모든 레코드를 호출자의 조직으로 강제 재귀속
- `comment.ts` — 태스크/워크스페이스 소유권 검증 후 멘션 알림 생성

### UX / 크래시 방지
- `(app)` 레이아웃에서 `requireOrganization()` 강제 → 세션 없으면 `/login`, 조직 없으면 `/onboarding` 리다이렉트
- `not-found.tsx` 2개 (루트, `(app)` 세그먼트)
- 브랜드 404 페이지 (한국어 + 복귀 버튼)
- `loading.tsx` 5개 (board, backlog, stories, okr, goals/[id])
- 빈 `catch {}` 66개에 `console.error(e)` 추가 (작업 로그 누락 방지)
- `ConfirmDialog` 컴포넌트 추가 + 연결: Task 상세 패널, Epic Card, Story Card, Milestone List, Recurring Card

### 코드 품질
- `validators.ts` — 흩어진 Zod 스키마 통합
- `dependency.ts` 사이클 감지 — 단일 쿼리 + in-memory BFS
- `dashboard/page.tsx` — `count()` / `Promise.all`
- `useServerAction` — `useRef(options)` 안정화
- 마인드맵 `convertedToTaskId`에 `"epic"/"story"` 문자열 저장하던 FK 깨짐 버그 수정

### 파일 업로드 보안
- `/api/attachments` — MIME 타입 화이트리스트, 20MB 크기 제한, 태스크 소유권 검증, 삭제 시 디스크 파일 정리

### 환경 변수
- `.env.example` — `AUTH_SECRET`, `CRON_SECRET` 생성 가이드 추가

---

## 🔴 배포 전 반드시 실행 — DB 마이그레이션

현재 스키마는 **nullable tenant 필드**로 추가됨. DB는 아직 반영 안 됨. 데이터 손실 방지를 위해 단계적으로:

### 1단계: 스키마 변경 적용 (컬럼 추가)

```bash
# Phase 1 마이그레이션이 이미 prisma/migrations/20260423000000_tenant_scoping/ 에 있습니다.
npx prisma migrate deploy   # 프로덕션
# 또는 로컬 개발:
npx prisma migrate dev
```

이 단계에서 추가되는 컬럼:
- `Member.workspaceId` (nullable)
- `Notification.organizationId` (nullable)
- `StandupNote.organizationId` + unique `[organizationId, date]`
- `TaskTemplate.organizationId` (nullable)
- `DailyPlan.organizationId` + unique `[organizationId, date]`

### 2단계: 기존 데이터 백필

```bash
# 첫 번째 조직으로 모든 레거시 데이터 귀속:
npx tsx prisma/backfill-tenant.ts

# 특정 조직으로 귀속:
TENANT_ORG_ID=clxyz123 npx tsx prisma/backfill-tenant.ts
```

### 3단계: NOT NULL 강제 (follow-up 마이그레이션 필요)

`prisma/migrations/<next>_tenant_scoping_not_null/migration.sql` 파일을 수동으로 만들어서:

```sql
ALTER TABLE "Member"       ALTER COLUMN "workspaceId"    SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "StandupNote"  ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "TaskTemplate" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "DailyPlan"    ALTER COLUMN "organizationId" SET NOT NULL;
```

그리고 `schema.prisma`에서 해당 필드 `?` 제거 후 `prisma migrate dev`.

---

## 🟡 런칭 전 권장 점검 (코드는 OK, 운영 설정 필요)

### Secrets
- [ ] `AUTH_SECRET` — `openssl rand -base64 32`로 생성한 값으로 교체 (현재 `.env`는 개발용 약한 값)
- [ ] `CRON_SECRET` — `openssl rand -hex 32`로 생성
- [ ] `DATABASE_URL` — 운영 PostgreSQL 연결 문자열

### CI/CD
- [ ] `prisma migrate deploy`를 배포 파이프라인에 포함
- [ ] 빌드 실패 시 배포 차단
- [ ] `next build`가 CI에서 통과하는지 확인

### Cron
- [ ] `/api/cron/recurring`을 스케줄러 (Vercel Cron, EventBridge 등)에 등록 — 매일 1회 이상
- [ ] `Authorization: Bearer ${CRON_SECRET}` 헤더 필수

### 모니터링
- [ ] Sentry 또는 유사 에러 추적 도구 연결 권장 (현재 `console.error`만 출력)
- [ ] 로그 드레인/파이프라인 설정

---

## 🟢 후속 개선 (런칭 후 해도 됨)

### 기능 완성
- [ ] Member 등록 UI에 workspaceId 선택기 추가 (현재 백엔드는 준비됨, 프론트 폼에 workspaceId 전달 필요)
- [ ] `createMember` validator에 `workspaceId` 추가
- [ ] 마인드맵 노드 → 에픽/스토리 변환 시 변환 표시기 (필요하면 `convertedEpicId`/`convertedStoryId` 컬럼 추가)
- [ ] KPI 스냅샷 UI
- [ ] 스탠드업 액션 아이템 toggle UI

### PAT (Personal Access Token) 레이어
외부 Claude Code 연동 자동화를 원하면 `/api/pm`에 세션 쿠키 외에 PAT 기반 인증 추가 필요:
- 모델: `PersonalAccessToken { userId, token, organizationId, expiresAt }`
- 미들웨어 또는 `requireApiOrg` 확장
- 토큰 발급/revoke UI

### 테스트
- [ ] E2E: 두 테넌트를 만들고 서로의 데이터가 보이지 않는지 Playwright로 검증
- [ ] 회원가입 → 온보딩 → 프로젝트 생성 → 태스크 생성 → 삭제 흐름
- [ ] 동시 편집/재시도 경쟁 조건

### 성능
- [ ] Prisma 쿼리에 `take`/`skip` 페이지네이션 일관화 (현재 일부만)
- [ ] 대시보드 통계는 무겁게 집계 — Redis/Materialized View 검토
- [ ] 알림 SSE가 연결 수에 비례해 DB 폴링 → Postgres LISTEN/NOTIFY 또는 Redis Pub/Sub으로 개선

### 접근성
- [ ] 모든 Dialog에 focus trap 확인
- [ ] 키보드 네비게이션 팔레트 시각 표시 (Cmd+K 이외)
- [ ] 색상 대비 WCAG AA

### 법무
- [ ] 이용약관 / 개인정보처리방침 페이지
- [ ] 쿠키 배너 (GDPR 대상이면)
- [ ] 결제 연동 (Stripe 권장)
