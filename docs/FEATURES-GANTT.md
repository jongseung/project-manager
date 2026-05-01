# 📊 FEATURES-GANTT.md — 관리자용 간트차트 & 팀 가시성 시스템

> 관리자가 한 화면에서 "누가, 무엇을, 언제까지, 지금 어디까지" 파악할 수 있는 시스템.
> 기존 FEATURES.md의 간트 차트를 관리자 관점으로 대폭 확장.

---

## 핵심 설계 원칙

```
관리자가 간트차트를 보는 이유:

1. "이 프로젝트 일정대로 가고 있나?"    → 프로젝트 타임라인
2. "누가 지금 뭐 하고 있지?"           → 멤버별 작업 현황
3. "병목이 어디지?"                    → 지연/블로커 시각화
4. "다음 주까지 뭐가 끝나야 하지?"      → 마감 기반 필터
5. "리소스가 편중되어 있진 않나?"        → 워크로드 밸런스
```

---

## 1. 간트차트 뷰 모드 3가지

### 1.1 프로젝트 간트 (Project Gantt)

단일 프로젝트의 전체 타임라인. 스토리 → 태스크 계층으로 표시.

```
┌─ 프로젝트 간트: CMP 모니터링 v2 ──────────────────────────────────────────┐
│                                                                           │
│  기간: [2026-04 ◀ ────────────────────────── ▶ 2026-07]                   │
│  줌:   [일|주|월]    필터: [담당자▾] [상태▾] [스토리▾]     [⚙ 설정]       │
│                                                                           │
│                          4월              5월              6월      7월    │
│  항목               W2  W3  W4  W1  W2  W3  W4  W1  W2  W3  W4  W1      │
│  ─────────────────  ──  ──  ──  ──  ──  ──  ──  ──  ──  ──  ──  ──      │
│                          ◆ 오늘 (4/11)                                    │
│                          │                                                │
│  ▼ 📖 데이터 수집         │                                                │
│    파이프라인 구축         │                                                │
│    ├ 센서 수집 모듈     ████████ ✅      Parker                            │
│    ├ DB 파이프라인       ░░████████       김대리  ← 2일 지연 ⚠️             │
│    └ 수집 모니터링            ░░░░░░░░   미배정                            │
│                                                                           │
│  ▼ 📖 이상감지 알고리즘 v2                                                 │
│    ├ 기존 로직 분석      ████ ✅          Parker                            │
│    ├ 새 알고리즘 설계      ████████       Parker                            │
│    ├ 구현 & 테스트              ░░░░░░░░░░   Parker                        │
│    └ A/B 테스트                      ░░░░░░   이사원                       │
│                                                                           │
│  ▶ 📖 Slack 알림 연동     (접힘)         ░░░░░░░░░░░░░░                    │
│                                                                           │
│  ▼ 📖 센서 폴링 최적화                                                    │
│    ├ 벤치마크 측정                  ░░░░░░   Parker                        │
│    ├ 최적화 구현                        ░░░░░░░░   Parker                  │
│    └ 성능 검증                                ░░░░   이사원                │
│                                                                           │
│  ▶ 📖 리포트 자동화       (접힘)                   ░░░░░░░░░░░░           │
│                                                                           │
│  ── 마일스톤 ──                                                           │
│  ◇ 5/1  데이터 수집 완료                                                  │
│  ◇ 6/1  알림 시스템 가동                                                  │
│  ◆ 7/31 프로젝트 마감                                                     │
│                                                                           │
│  범례: ████ 완료  ████ 진행중  ░░░░ 예정  ⚠️ 지연  ◇ 마일스톤            │
└───────────────────────────────────────────────────────────────────────────┘
```

### 1.2 멤버별 간트 (Resource Gantt)

**관리자 핵심 뷰**. "누가 언제 뭘 하는지" 사람 축으로 본다.

```
┌─ 멤버별 작업 현황 ─────────────────────────────────────────────────────────┐
│                                                                            │
│  워크스페이스: [업무 ▾]    기간: [이번 주 ◀ ▶]    [주|2주|월]               │
│                                                                            │
│                       4/7(월)  4/8(화)  4/9(수)  4/10(목) 4/11(금)         │
│  ─────────────────    ──────   ──────   ──────   ──────   ──────          │
│                                                         ◆ 오늘             │
│  👤 Parker                                               │                 │
│  ├ 🔴 서버 타임아웃     ████████████████████████████████████               │
│  ├ 🟠 새 알고리즘 설계              ░░░░░░░░░░░░░░░░████████             │
│  ├ 🔄 장비 가동률 체크   ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪                │
│  └ 🔄 봇 수익률 확인     ▫  ▫  ▫  ▫  ▫  ▫  ▫  ▫  ▫  ▫  ▫                │
│     워크로드: ██████████████░░ 높음 (4건 동시)                              │
│                                                                            │
│  👤 김대리                                                                 │
│  ├ 🟠 DB 파이프라인      ░░░░████████████████████████  ⚠️ 2일 지연         │
│  ├ 🟡 코드리뷰           ░░░░░░░░░░░░░░░░░░░░░░████████                   │
│  └ 🔄 주간 회의록 정리         ▪           ▪                               │
│     워크로드: ████████░░░░░░░░ 보통 (2건)                                  │
│                                                                            │
│  👤 이사원                                                                 │
│  ├ 🟡 테스트 케이스 작성                        ░░░░░░░░░░░░░░░░          │
│  └ 🔄 일일 QA 체크       ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪  ▪                │
│     워크로드: ████░░░░░░░░░░░░ 여유 (1건)                                  │
│                                                                            │
│  범례: ████ 진행중  ░░░░ 예정  ▪ 반복루틴  ⚠️ 지연                        │
│        워크로드 바: 🟢 여유  🟡 보통  🔴 높음  🔴🔴 과부하                   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 멀티 프로젝트 간트 (Portfolio Gantt)

여러 프로젝트를 한 화면에서 비교. 경영진/관리자 리포트용.

```
┌─ 전체 프로젝트 타임라인 ─────────────────────────────────────────────────┐
│                                                                          │
│  워크스페이스: [전체 ▾]         기간: [2026 Q2 ◀ ▶]                       │
│                                                                          │
│                      4월         5월         6월         7월              │
│  프로젝트        W1 W2 W3 W4 W1 W2 W3 W4 W1 W2 W3 W4 W1 W2             │
│  ─────────────   ── ── ── ── ── ── ── ── ── ── ── ── ── ──             │
│                     ◆                                                    │
│  🟣 CMP 모니터링 v2                                                      │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 68%              │
│  ├ ◇ 데이터수집 완료 (5/1)                                               │
│  ├ ◇ 알림시스템 가동 (6/1)                                               │
│  └ ◆ 프로젝트 마감 (7/31)                                                │
│     상태: 🟡 일부 지연 (DB 파이프라인 2일 초과)                            │
│                                                                          │
│  🟢 트레이딩봇 v3                                                        │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 35%                    │
│  ├ ◇ 멀티페어 구현 (5/15)                                                │
│  └ ◇ 라이브 안정화 (7/1)                                                 │
│     상태: 🟢 정상                                                        │
│                                                                          │
│  🔵 발자취 앱                                                             │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 18%                                │
│  ├ ◇ MVP 기능 완성 (6/30)                                                │
│  └ ◇ 앱스토어 출시 (8/31)                                                │
│     상태: 🟢 정상 (여유 일정)                                             │
│                                                                          │
│  🟠 홈서버 관리                                                           │
│  ████████████████████████████████████████ ongoing                        │
│     상태: 🟢 유지보수 중                                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 간트차트 인터랙션

### 2.1 바 조작

| 동작 | 결과 | 권한 |
|------|------|------|
| 바 좌우 드래그 | startDate + endDate 이동 (기간 유지) | 멤버 이상 |
| 바 오른쪽 끝 리사이즈 | endDate(마감일) 변경 | 멤버 이상 |
| 바 왼쪽 끝 리사이즈 | startDate 변경 | 멤버 이상 |
| 바 클릭 | 태스크 상세 패널 열기 | 모두 |
| 바 더블클릭 | 인라인 제목 편집 | 멤버 이상 |
| 빈 영역 드래그 | 새 태스크 생성 (기간 자동 설정) | 멤버 이상 |
| 마일스톤(◇) 드래그 | 마일스톤 날짜 변경 | 관리자 이상 |
| Ctrl+클릭 여러 바 | 복수 선택 → 일괄 이동/재배정 | 관리자 이상 |

### 2.2 우클릭 컨텍스트 메뉴

```
┌─────────────────────────┐
│ 📋 상세 보기             │
│ ✏️ 편집                 │
│ 👤 담당자 변경 →         │
│ 🏷  라벨 변경 →          │
│ 📅 마감일 변경           │
│ ─────────────────────── │
│ 🔗 의존성 추가           │
│ 📎 스토리 연결           │
│ ─────────────────────── │
│ ⚠️ 블로커로 표시         │
│ 🗑  삭제                 │
└─────────────────────────┘
```

### 2.3 의존성 (Dependencies)

태스크 간 선후 관계를 화살표로 표시:

```
  센서 수집 모듈  ████████ ──────→  DB 파이프라인  ░░████████
                  (선행)      (의존)      (후행)

  의존 타입:
  FS (Finish-to-Start): A 끝나야 B 시작  ← 기본값, 가장 많이 사용
  SS (Start-to-Start):  A 시작하면 B도 시작 가능
```

```prisma
model TaskDependency {
  id              String         @id @default(cuid())
  type            DependencyType @default(FINISH_TO_START)

  predecessorId   String
  predecessor     Task @relation("TaskPredecessor", fields: [predecessorId], references: [id], onDelete: Cascade)
  successorId     String
  successor       Task @relation("TaskSuccessor", fields: [successorId], references: [id], onDelete: Cascade)

  @@unique([predecessorId, successorId])
}

enum DependencyType {
  FINISH_TO_START
  START_TO_START
}

// Task 모델에 추가
model Task {
  // ... 기존 필드 ...
  predecessors  TaskDependency[] @relation("TaskSuccessor")
  successors    TaskDependency[] @relation("TaskPredecessor")
}
```

### 2.4 크리티컬 패스 표시

의존성 체인에서 **가장 긴 경로**를 빨간색으로 하이라이트:

```
  센서 수집 ████ → DB 파이프라인 ████ → 수집 모니터링 ████
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  크리티컬 패스 (이 경로가 지연되면 전체 프로젝트 지연)

  Slack 연동 ░░░░ → (독립적, 크리티컬 패스 아님)
```

→ 관리자가 "어디에 리소스를 집중해야 하는지" 즉시 파악 가능.

---

## 3. 지연 & 블로커 시각화

### 3.1 지연 표시

```
  예정 기간:          ░░░░░░░░░░│
  실제 진행:          ████████████████│
                               │    │
                          원래 마감  현재 위치
                               
  지연 표시: 바가 원래 마감선을 넘으면 초과 부분을 빨간색으로:
  
  DB 파이프라인     ████████████████████ ⚠️ +2일 지연
                                   │──│
                                  빨간 초과 영역
```

### 3.2 블로커 표시

태스크에 "블로커" 플래그가 있으면 다른 태스크에 영향을 시각화:

```
  DB 파이프라인  ████████████🔴██  BLOCKED: "서버 접근 권한 대기"
                                │
                                ▼ (의존하는 태스크들 자동 지연 표시)
  수집 모니터링              ░░░░⚠️░░░░  (시작 불가, 대기 중)
```

### 3.3 상태 요약 패널

간트차트 상단에 프로젝트 건강 상태 요약:

```
┌─ 프로젝트 상태 요약 ──────────────────────────────────────┐
│                                                           │
│  📊 전체: 18개 태스크                                     │
│                                                           │
│  ✅ 정상 진행    12개  ████████████████████░░░░  67%       │
│  ⚠️ 지연        2개   ████  11%                           │
│  🔴 블로커      1개   ██  6%                              │
│  ⏳ 미시작      3개   ██████  16%                          │
│                                                           │
│  🎯 다음 마일스톤: "데이터 수집 완료" — 20일 후 (5/1)      │
│     진행률: ████████████████░░░░  75%  🟡 리스크 있음      │
│                                                           │
│  ⚠️ 주의 항목:                                            │
│  • DB 파이프라인 2일 지연 (김대리) — 마일스톤 영향 가능     │
│  • 수집 모니터링 담당자 미배정                              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 4. 관리자 전용 기능

### 4.1 워크로드 밸런싱 뷰

멤버별 작업량을 시각적으로 비교:

```
┌─ 팀 워크로드 (이번 주 4/7 ~ 4/11) ──────────────────────────┐
│                                                              │
│  👤 Parker                                                   │
│     진행중 3  |  예정 2  |  반복 2  |  총 7건                 │
│     ████████████████████████████████████ 🔴 과부하            │
│     예상 소요: 38h / 가용: 40h                                │
│                                                              │
│  👤 김대리                                                    │
│     진행중 2  |  예정 1  |  반복 1  |  총 4건                 │
│     ████████████████████░░░░░░░░░░░░░░░ 🟡 보통              │
│     예상 소요: 24h / 가용: 40h                                │
│                                                              │
│  👤 이사원                                                    │
│     진행중 0  |  예정 1  |  반복 1  |  총 2건                 │
│     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 🟢 여유              │
│     예상 소요: 12h / 가용: 40h                                │
│                                                              │
│  💡 제안: Parker의 "수집 모니터링" 태스크를 이사원에게          │
│     재배정하면 워크로드가 균형잡힘     [재배정 하기]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 주간/월간 리포트 자동 생성

간트차트 데이터 기반으로 리포트 자동 생성:

```
┌─ 주간 리포트 (4/7 ~ 4/11) ─── [📋 복사] [📄 PDF] [📧 이메일] ──┐
│                                                                  │
│  ## CMP 모니터링 v2 — 주간 현황                                   │
│                                                                  │
│  ### 요약                                                        │
│  - 전체 진행률: 68% (+8% from last week)                          │
│  - 이번 주 완료: 4건 / 신규: 2건                                  │
│  - 지연 항목: 1건 (DB 파이프라인)                                  │
│                                                                  │
│  ### 완료된 작업                                                  │
│  ✅ 센서 수집 모듈 개발 (Parker)                                  │
│  ✅ 기존 알람 로직 분석 (Parker)                                   │
│  ✅ Slack 채널 구조 설계 (이사원)                                   │
│  ✅ TimescaleDB 설치 (김대리)                                     │
│                                                                  │
│  ### 진행 중                                                     │
│  🔨 DB 파이프라인 (김대리) — 75% 완료, 마감 4/15 ⚠️ 2일 지연     │
│  🔨 새 알고리즘 설계 (Parker) — 50% 완료, 마감 4/18              │
│                                                                  │
│  ### 다음 주 계획                                                │
│  📋 DB 파이프라인 완료 (김대리, 4/15)                             │
│  📋 수집 모니터링 착수 (미배정 → 이사원 배정 필요)                 │
│  📋 새 알고리즘 구현 착수 (Parker, 4/18 이후)                     │
│                                                                  │
│  ### 리스크                                                      │
│  ⚠️ DB 파이프라인 지연이 수집 모니터링 시작에 영향                 │
│     → 조치: 김대리 지원 또는 기한 재조정 필요                      │
│                                                                  │
│  ### KPI 변화                                                    │
│  감지→알림 시간: 변동 없음 (20분, 다음 변동 예상: 알고리즘 v2 배포) │
│  오탐률: 9% → 7% (-2%p) ✅ 개선                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 일정 변경 이력 (Audit Trail)

간트차트에서 변경된 모든 일정을 추적:

```
┌─ 일정 변경 이력 ──────────────────────────────────────────┐
│                                                           │
│  4/11 10:30  Parker가 "DB 파이프라인" 마감을              │
│              4/13 → 4/15로 변경 (사유: 서버 접근 대기)     │
│                                                           │
│  4/10 14:00  Parker가 "센서 수집 모듈"을 완료 처리         │
│              (예정 4/14, 실제 4/10 — 4일 조기 완료 🎉)     │
│                                                           │
│  4/9  09:15  김대리가 "DB 파이프라인" 시작일을             │
│              4/8 → 4/9로 변경                              │
│                                                           │
│  4/8  11:00  Parker가 마일스톤 "데이터 수집 완료"를        │
│              4/28 → 5/1로 변경 (사유: 일정 재조정)         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 5. 간트차트 설정 & 필터

### 5.1 표시 설정 패널 (`⚙ 설정`)

```
┌─ 간트차트 설정 ─────────────────────┐
│                                      │
│  ── 표시 항목 ──                     │
│  ✅ 태스크 바                        │
│  ✅ 마일스톤                         │
│  ✅ 반복 태스크 (점선)               │
│  ☐  완료된 항목 숨기기               │
│  ✅ 의존성 화살표                    │
│  ☐  크리티컬 패스 하이라이트         │
│  ✅ 오늘 선                          │
│                                      │
│  ── 바 표시 정보 ──                  │
│  ✅ 담당자 이름                      │
│  ✅ 진행률 (%)                       │
│  ☐  스토리 포인트                    │
│  ✅ 지연 경고                        │
│                                      │
│  ── 그룹핑 ──                        │
│  (●) 스토리별                        │
│  ( ) 담당자별                        │
│  ( ) 마일스톤별                      │
│  ( ) 우선순위별                      │
│                                      │
│  ── 색상 기준 ──                     │
│  (●) 상태별 (진행중/예정/완료)       │
│  ( ) 우선순위별                      │
│  ( ) 담당자별                        │
│  ( ) 프로젝트별 (멀티 프로젝트 시)   │
│                                      │
└──────────────────────────────────────┘
```

### 5.2 필터 조합 예시

| 관리자가 보고 싶은 것 | 필터 설정 |
|----------------------|----------|
| "Parker가 이번 달 뭐 하는지" | 멤버별 간트 + 담당자: Parker + 기간: 4월 |
| "지연된 것만 보여줘" | 상태: 지연만 + 블로커 포함 |
| "다음 마일스톤까지 남은 작업" | 마일스톤별 그룹 + 상태: 미완료 |
| "전체 프로젝트 건강 상태" | 멀티 프로젝트 간트 + 마일스톤 표시 |
| "이사원에게 더 줄 수 있는 일" | 워크로드 뷰 + 미배정 태스크 포함 |

---

## 6. 데이터 모델 추가

```prisma
// 태스크 예상 소요시간 (워크로드 계산용)
// Task 모델에 추가
model Task {
  // ... 기존 필드 ...

  estimatedHours  Float?    // 예상 소요시간 (시간 단위)
  actualHours     Float?    // 실제 소요시간

  // 의존성
  predecessors    TaskDependency[] @relation("TaskSuccessor")
  successors      TaskDependency[] @relation("TaskPredecessor")
}

// 일정 변경 이력 (기존 ActivityLog 확장 또는 별도 모델)
// ActivityLog의 action 타입에 추가:
// "schedule_changed"  → details: { field: "endDate", from: "2026-04-13", to: "2026-04-15", reason: "서버 접근 대기" }
// "milestone_moved"   → details: { from: "2026-04-28", to: "2026-05-01", reason: "일정 재조정" }
// "assignee_changed"  → details: { from: "user_abc", to: "user_xyz" }
// "blocker_added"     → details: { description: "서버 접근 권한 대기" }
// "blocker_resolved"  → details: { description: "권한 수령 완료" }

// 블로커 모델
model Blocker {
  id          String    @id @default(cuid())
  description String
  resolved    Boolean   @default(false)
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())

  taskId      String
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  reporterId  String    // 보고한 사람
}
```

---

## 7. API 엔드포인트 추가

```
# 간트차트 데이터
GET  /api/workspaces/[slug]/gantt
     ?view=project|resource|portfolio
     &projectId=xxx          (프로젝트 간트 시)
     &startDate=2026-04-01
     &endDate=2026-07-31
     &assigneeId=xxx         (멤버별 필터)
     &includeCompleted=false
     &groupBy=story|assignee|milestone|priority

# Response (프로젝트 간트):
{
  project: { id, name, startDate, endDate, progress },
  milestones: [{ id, name, dueDate, completed }],
  groups: [
    {
      type: "story",
      story: { id, title, status, storyPoints },
      items: [
        {
          type: "task",
          task: {
            id, title, status, priority,
            startDate, endDate, completedAt,
            progress,           // 서브태스크 기준 0~100
            assignee: { id, name, avatarUrl },
            isOverdue: boolean,
            delayDays: number,  // 지연일수
            blockers: [{ id, description, resolved }],
            estimatedHours: number,
          },
          dependencies: [{ predecessorId, type }],
        }
      ]
    }
  ],
  criticalPath: ["task_id_1", "task_id_2", ...],  // 크리티컬 패스 태스크 ID들
  summary: {
    total, onTrack, delayed, blocked, notStarted,
    nextMilestone: { name, dueDate, daysUntil, progress },
  }
}

# 워크로드
GET  /api/workspaces/[slug]/workload
     ?startDate=2026-04-07
     &endDate=2026-04-11

# Response:
{
  members: [
    {
      user: { id, name, avatarUrl },
      inProgress: number,
      scheduled: number,
      recurring: number,
      total: number,
      estimatedHours: number,
      availableHours: 40,     // 주당 기본 40시간
      loadLevel: "overloaded" | "high" | "normal" | "low",
      tasks: Task[],
    }
  ],
  unassignedTasks: Task[],
  suggestions: [
    { taskId, fromUserId, toUserId, reason }  // 재배정 제안
  ]
}

# 의존성
POST   /api/tasks/[id]/dependencies    // { predecessorId, type }
DELETE /api/dependencies/[depId]

# 블로커
POST   /api/tasks/[id]/blockers        // { description }
PATCH  /api/blockers/[bid]/resolve

# 주간 리포트 생성
GET  /api/workspaces/[slug]/report
     ?type=weekly|monthly
     &startDate=2026-04-07
     &endDate=2026-04-11
     &projectId=xxx           (선택)
```

---

## 8. 구현 Phase 반영

```
Phase 3 — 캘린더 & 타임라인 (확장)
  기존 캘린더 기능 +
  3.3 프로젝트 간트차트 (기본)
  3.4 태스크 바 드래그/리사이즈
  3.5 마일스톤 표시

Phase 4.5 — 관리자 뷰 (신규)
  4.5.1 멤버별 간트 (Resource Gantt)
  4.5.2 멀티 프로젝트 간트 (Portfolio Gantt)
  4.5.3 워크로드 밸런싱 뷰
  4.5.4 지연/블로커 시각화
  4.5.5 상태 요약 패널

Phase 5 — 폴리시 & 확장
  기존 +
  5.7 의존성 & 크리티컬 패스
  5.8 주간/월간 리포트 자동 생성
  5.9 일정 변경 이력 (Audit Trail)
  5.10 워크로드 재배정 제안
```

---

## 9. 기술 구현 노트

### 간트차트 라이브러리 선택

| 옵션 | 장점 | 단점 | 추천 |
|------|------|------|------|
| **커스텀 구현** (div + CSS) | 완전한 제어, 디자인 자유 | 개발 시간 많음 | ⭐ Phase 3 |
| **@bryntum/gantt** | 풀기능, 의존성/크리티컬패스 내장 | 유료($499+), 무거움 | 예산 있으면 |
| **frappe-gantt** | 가볍고 무료 | 기능 제한적, 리소스 뷰 없음 | ✗ |
| **dhtmlx-gantt** | 기능 풍부 | 유료, 리액트 통합 까다로움 | ✗ |

**권장**: Phase 3에서 커스텀 구현 (div 기반 + @dnd-kit).
기본 바 렌더링은 의외로 간단하고, 디자인 통일성을 위해 직접 만드는 게 낫다.

### 핵심 렌더링 로직

```typescript
// 간트 바 위치 계산
function getBarPosition(task: GanttTask, viewConfig: ViewConfig) {
  const { startDate, endDate, pixelsPerDay } = viewConfig;
  
  const taskStart = max(task.startDate, startDate);
  const taskEnd = min(task.endDate, endDate);
  
  const left = differenceInDays(taskStart, startDate) * pixelsPerDay;
  const width = differenceInDays(taskEnd, taskStart) * pixelsPerDay;
  
  return { left, width };
}

// 지연 계산
function getDelayInfo(task: GanttTask) {
  if (task.status === 'DONE') return null;
  if (!task.endDate) return null;
  
  const today = new Date();
  if (today > task.endDate) {
    return {
      isDelayed: true,
      delayDays: differenceInDays(today, task.endDate),
    };
  }
  return { isDelayed: false, delayDays: 0 };
}
```

### 성능 최적화

- **가상화**: 화면에 보이는 행만 렌더링 (`@tanstack/react-virtual`)
- **줌 레벨별 데이터**: 월 단위 줌이면 일별 데이터 불필요, 주 단위 요약만 fetch
- **바 드래그 시**: 낙관적 업데이트 + 디바운스 API 호출 (드래그 중에는 호출 안 함, 드롭 시 1회)
