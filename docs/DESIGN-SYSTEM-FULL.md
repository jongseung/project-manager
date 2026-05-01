# 🎨 DESIGN-SYSTEM.md — TaskFlow 디자인 시스템

> 디자인 철학: **"Linear의 미니멀리즘 + Notion의 정보 구조 + 고유한 색감"**
> 
> 참고 앱: Linear (UI 밀도/키보드), Notion (계층 구조), Height (색상 감각),
> Raycast (커맨드 팔레트), Vercel Dashboard (타이포그래피)
>
> 클로드 코드가 UI를 구현할 때 이 문서를 참고하면 일관된 디자인이 유지된다.

---

## 디자인 원칙

```
1. CALM BUT CONFIDENT
   → 눈이 편안하되, 중요한 건 확실히 눈에 들어온다.
   → 순수 검은색(#000) 대신 따뜻한 다크 그레이를 베이스로.
   → 액센트 컬러는 딱 하나, 강하게.

2. INFORMATION DENSITY WITHOUT CHAOS
   → 한 화면에 많은 정보를 담되, 계층이 명확하다.
   → 여백(negative space)으로 그룹을 구분한다.
   → 테두리보다 간격과 배경색으로 영역을 나눈다.

3. KEYBOARD-FIRST, MOUSE-FRIENDLY
   → 모든 핵심 동작은 키보드로 가능하다.
   → 마우스/터치도 자연스럽게 동작한다.

4. MOTION WITH PURPOSE
   → 애니메이션은 상태 변화를 설명할 때만 사용한다.
   → 장식적 모션 최소화. 속도감 있는 전환(150~200ms).

5. DARK-FIRST, LIGHT-READY
   → 기본은 다크 모드. 라이트 모드도 완전히 지원한다.
   → CSS 변수 기반 토큰 시스템으로 모드 전환.
```

---

## 1. 색상 시스템 (Color System)

### 1.1 색상 철학

Linear 스타일의 차가운 블루그레이 대신, **따뜻한 뉴트럴 + 인디고 액센트**를 사용한다.
이유: 장시간 사용하는 생산성 도구에서 차가운 톤은 피로감을 줄 수 있지만,
약간의 warm undertone이 있으면 더 "사람 냄새 나는" 느낌을 준다.

### 1.2 Core Palette

```
브랜드 컬러: Indigo (인디고)
이유: 전문적이면서도 차별화됨. 블루보다 깊이 있고, 퍼플보다 절제됨.
```

#### 다크 모드 (기본)

```css
:root[data-theme="dark"] {
  /* ── 배경 (Surfaces) ── */
  --bg-base:        #0C0E12;    /* 앱 최하위 배경 (따뜻한 다크, 순수 검정 아님) */
  --bg-default:     #13151A;    /* 기본 콘텐츠 배경 */
  --bg-subtle:      #1A1D24;    /* 사이드바, 카드 배경 */
  --bg-muted:       #21242C;    /* 호버 배경, 입력 필드 */
  --bg-elevated:    #282C35;    /* 모달, 드롭다운, 팝오버 */
  --bg-overlay:     rgba(0, 0, 0, 0.6); /* 오버레이 딤 */

  /* ── 텍스트 (Text) ── */
  --text-primary:   #EDEDEF;    /* 제목, 강조 텍스트 (순백 아닌 약간 따뜻한 흰색) */
  --text-secondary: #A0A3AB;    /* 본문, 설명 */
  --text-tertiary:  #62656D;    /* 비활성, 힌트 텍스트 */
  --text-disabled:  #3E4149;    /* 비활성 상태 */

  /* ── 테두리 (Borders) ── */
  --border-default: #26292F;    /* 기본 구분선 */
  --border-subtle:  #1E2027;    /* 약한 구분 */
  --border-strong:  #3A3E47;    /* 강조 테두리 (포커스 전 상태) */

  /* ── 브랜드 / 액센트 (Accent) ── */
  --accent-default: #6366F1;    /* 인디고 — 기본 액센트 */
  --accent-hover:   #818CF8;    /* 호버 */
  --accent-muted:   rgba(99, 102, 241, 0.15); /* 태그 배경, 선택 상태 */
  --accent-subtle:  rgba(99, 102, 241, 0.08); /* 매우 약한 배경 */

  /* ── 시맨틱 컬러 (Semantic) ── */
  /* 성공 / 완료 */
  --success-default: #22C55E;
  --success-muted:   rgba(34, 197, 94, 0.15);
  --success-text:    #4ADE80;

  /* 경고 / 주의 */
  --warning-default: #F59E0B;
  --warning-muted:   rgba(245, 158, 11, 0.15);
  --warning-text:    #FBBF24;

  /* 위험 / 긴급 */
  --danger-default:  #EF4444;
  --danger-muted:    rgba(239, 68, 68, 0.15);
  --danger-text:     #F87171;

  /* 정보 */
  --info-default:    #3B82F6;
  --info-muted:      rgba(59, 130, 246, 0.15);
  --info-text:       #60A5FA;
}
```

#### 라이트 모드

```css
:root[data-theme="light"] {
  /* ── 배경 ── */
  --bg-base:        #FAFAFA;
  --bg-default:     #FFFFFF;
  --bg-subtle:      #F5F5F7;
  --bg-muted:       #EEEFF2;
  --bg-elevated:    #FFFFFF;
  --bg-overlay:     rgba(0, 0, 0, 0.4);

  /* ── 텍스트 ── */
  --text-primary:   #1A1A1E;
  --text-secondary: #6B6E76;
  --text-tertiary:  #9B9EA6;
  --text-disabled:  #C5C7CC;

  /* ── 테두리 ── */
  --border-default: #E4E5E9;
  --border-subtle:  #EEEFF2;
  --border-strong:  #D1D3D8;

  /* ── 액센트 ── */
  --accent-default: #4F46E5;    /* 라이트에서는 살짝 더 진한 인디고 */
  --accent-hover:   #4338CA;
  --accent-muted:   rgba(79, 70, 229, 0.10);
  --accent-subtle:  rgba(79, 70, 229, 0.05);

  /* 시맨틱은 다크와 동일하되 muted 배경 투명도만 조정 */
  --success-default: #16A34A;
  --success-muted:   rgba(22, 163, 74, 0.10);
  --success-text:    #16A34A;

  --warning-default: #D97706;
  --warning-muted:   rgba(217, 119, 6, 0.10);
  --warning-text:    #D97706;

  --danger-default:  #DC2626;
  --danger-muted:    rgba(220, 38, 38, 0.10);
  --danger-text:     #DC2626;

  --info-default:    #2563EB;
  --info-muted:      rgba(37, 99, 235, 0.10);
  --info-text:       #2563EB;
}
```

### 1.3 우선순위 컬러

태스크 우선순위는 앱 전체에서 일관되게 사용한다:

```css
:root {
  --priority-urgent:  #EF4444;   /* 🔴 빨강 */
  --priority-high:    #F97316;   /* 🟠 주황 */
  --priority-medium:  #EAB308;   /* 🟡 노랑 */
  --priority-low:     #6366F1;   /* 🔵 인디고 (액센트와 통일) */
  --priority-none:    var(--text-tertiary); /* 회색 */
}
```

### 1.4 프로젝트 컬러 팔레트

각 프로젝트에 고유 색상을 부여할 때 사용하는 프리셋 12색:

```css
:root {
  --project-indigo:   #6366F1;
  --project-violet:   #8B5CF6;
  --project-pink:     #EC4899;
  --project-rose:     #F43F5E;
  --project-orange:   #F97316;
  --project-amber:    #F59E0B;
  --project-lime:     #84CC16;
  --project-emerald:  #10B981;
  --project-teal:     #14B8A6;
  --project-cyan:     #06B6D4;
  --project-blue:     #3B82F6;
  --project-slate:    #64748B;
}
```

### 1.5 색상 사용 규칙

```
절대 하지 말 것:
✗ 순수 검정(#000000)을 배경으로 사용
✗ 순수 백색(#FFFFFF)을 다크 모드 텍스트로 사용
✗ 시맨틱 컬러를 장식용으로 사용 (빨강은 반드시 위험/긴급만)
✗ 3가지 이상의 강한 색상을 한 화면에 동시 사용

항상 할 것:
✓ 색상은 CSS 변수로만 사용 (하드코딩 금지)
✓ 의미 있는 색상은 semantic 토큰 사용 (--danger, --success 등)
✓ 컬러 위 텍스트는 WCAG AA 이상 대비율(4.5:1) 보장
✓ 호버/포커스 상태는 배경색 한 단계 밝게
```

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 선택

```
주 폰트: "Geist Sans" (Vercel의 서체)
→ 이유: 모던하면서도 가독성 탁월. Inter보다 개성 있고, 개발자 친화적.
→ CDN: https://cdn.jsdelivr.net/npm/geist@1/dist/fonts/geist-sans/

모노스페이스: "Geist Mono"
→ 코드 블록, 숫자, 키보드 단축키 표시용
→ CDN: https://cdn.jsdelivr.net/npm/geist@1/dist/fonts/geist-mono/

대안 (Geist 로드 실패 시): system-ui, -apple-system, sans-serif
```

### 2.2 타입 스케일

```css
:root {
  /* 폰트 사이즈 */
  --text-xs:     0.75rem;    /* 12px — 뱃지, 캡션 */
  --text-sm:     0.8125rem;  /* 13px — 보조 텍스트, 메타데이터 */
  --text-base:   0.875rem;   /* 14px — 기본 본문 ★ (Linear/Notion 기준) */
  --text-md:     0.9375rem;  /* 15px — 약간 큰 본문 */
  --text-lg:     1.125rem;   /* 18px — 섹션 제목 */
  --text-xl:     1.25rem;    /* 20px — 페이지 제목 */
  --text-2xl:    1.5rem;     /* 24px — 대시보드 큰 숫자 */
  --text-3xl:    2rem;       /* 32px — 히어로/랜딩 */

  /* 폰트 굵기 */
  --font-normal:  400;
  --font-medium:  500;       /* ★ 가장 많이 사용 */
  --font-semibold: 600;      /* 제목, 강조 */
  --font-bold:    700;       /* 대시보드 숫자 */

  /* 줄 높이 */
  --leading-tight:  1.3;     /* 제목 */
  --leading-normal: 1.5;     /* 본문 */
  --leading-relaxed: 1.7;    /* 긴 텍스트 */

  /* 자간 */
  --tracking-tight:  -0.02em; /* 큰 제목 */
  --tracking-normal:  0;
  --tracking-wide:    0.02em; /* 캡션, 라벨 */
}
```

### 2.3 타이포그래피 용도별 적용

```css
/* 페이지 제목 */
.page-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

/* 섹션 제목 */
.section-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/* 태스크 카드 제목 */
.task-title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

/* 메타데이터 (날짜, 담당자 등) */
.meta {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  color: var(--text-secondary);
}

/* 대시보드 큰 숫자 */
.stat-number {
  font-family: "Geist Mono", monospace;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

/* 키보드 단축키 */
.kbd {
  font-family: "Geist Mono", monospace;
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-muted);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
}
```

---

## 3. 간격 & 레이아웃 (Spacing & Layout)

### 3.1 간격 스케일 (4px 기반)

```css
:root {
  --space-0:   0;
  --space-0.5: 0.125rem;  /* 2px */
  --space-1:   0.25rem;   /* 4px */
  --space-1.5: 0.375rem;  /* 6px */
  --space-2:   0.5rem;    /* 8px */
  --space-3:   0.75rem;   /* 12px */
  --space-4:   1rem;      /* 16px */
  --space-5:   1.25rem;   /* 20px */
  --space-6:   1.5rem;    /* 24px */
  --space-8:   2rem;      /* 32px */
  --space-10:  2.5rem;    /* 40px */
  --space-12:  3rem;      /* 48px */
  --space-16:  4rem;      /* 64px */
}
```

### 3.2 앱 레이아웃 치수

```css
:root {
  /* 사이드바 */
  --sidebar-width:           240px;
  --sidebar-width-collapsed:  52px;

  /* 탑바 */
  --topbar-height:            48px;

  /* 콘텐츠 */
  --content-max-width:       1200px;
  --content-padding:         var(--space-6);  /* 24px */

  /* 슬라이드 패널 (태스크 상세) */
  --panel-width:              480px;

  /* 모달 */
  --modal-width-sm:           400px;
  --modal-width-md:           560px;
  --modal-width-lg:           720px;
}
```

### 3.3 레이아웃 구조

```
┌────────────────────────────────────────────────────────┐
│  TopBar (48px, fixed)                                  │
│  bg: var(--bg-subtle)  border-bottom: var(--border)    │
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│ Sidebar  │  Main Content                               │
│ 240px    │  padding: 24px                              │
│          │  max-width: 1200px (선택)                    │
│ bg:      │                                             │
│ --bg-    │  bg: var(--bg-default)                      │
│ subtle   │                                             │
│          │                                             │
│ border-  │  ┌─ Slide Panel ─────────────┐              │
│ right:   │  │ 480px, right, overlay     │              │
│ --border │  │ bg: var(--bg-elevated)    │              │
│          │  │ border-left: --border     │              │
│          │  └───────────────────────────┘              │
└──────────┴─────────────────────────────────────────────┘
```

---

## 4. 컴포넌트 디자인 패턴

### 4.1 버튼 (Buttons)

```
계층:
Primary   → 배경: --accent-default, 텍스트: white
Secondary → 배경: --bg-muted, 텍스트: --text-primary
Ghost     → 배경: transparent, 텍스트: --text-secondary, 호버: --bg-muted
Danger    → 배경: --danger-default, 텍스트: white

크기:
sm → height: 28px, font: 13px, px: 10px
md → height: 32px, font: 13px, px: 12px (기본)
lg → height: 36px, font: 14px, px: 16px

공통:
border-radius: 6px
font-weight: 500
transition: all 150ms ease
focus: ring 2px --accent-default offset 2px
```

```css
.btn-primary {
  background: var(--accent-default);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: var(--font-medium);
  transition: background 150ms ease;
}
.btn-primary:hover {
  background: var(--accent-hover);
}
```

### 4.2 카드 (Cards)

```css
.card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: var(--space-4);
  transition: border-color 150ms ease, background 150ms ease;
}
.card:hover {
  border-color: var(--border-default);
  background: var(--bg-muted);
}
```

### 4.3 태스크 카드 (칸반)

```
높이: auto (콘텐츠에 따라)
너비: 컬럼 너비 (기본 280px)
좌측에 우선순위 색상 바 (3px, border-left)
내부 패딩: 12px
간격: 카드 간 8px

┌─────────────────────────────┐
│ ▌ Task Title                │  ← 3px 우선순위 컬러 바 (왼쪽)
│   Description preview...    │
│                             │
│   🏷 label  🏷 label        │  ← 라벨 (pill shape, muted 배경)
│                             │
│   ☐ 2/5  💬 3  📅 Apr 15   │  ← 메타 (--text-tertiary, --text-sm)
│                    👤 PK    │  ← 아바타 (24px, 우하단)
└─────────────────────────────┘
```

### 4.4 라벨 / 뱃지 (Labels & Badges)

```css
.label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 2px 8px;
  border-radius: 9999px;        /* pill shape */
  /* 색상은 라벨 color에 따라 동적으로 */
  background: color-mix(in srgb, var(--label-color) 15%, transparent);
  color: var(--label-color);
}

/* 우선순위 뱃지 */
.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
.priority-urgent { color: var(--priority-urgent); }
.priority-high   { color: var(--priority-high); }
.priority-medium { color: var(--priority-medium); }
.priority-low    { color: var(--priority-low); }
```

### 4.5 사이드바 네비게이션

```
구조:
- 워크스페이스 셀렉터 (상단)
- 주요 네비게이션 (아이콘 + 텍스트)
- 프로젝트 리스트 (접고 펼기)
- 하단: 설정, 테마 토글

스타일:
┌─ Sidebar ──────────────┐
│  🔷 TaskFlow           │  ← 로고/워크스페이스명
│  업무 워크스페이스  ▾   │  ← 워크스페이스 스위처
│                         │
│  ─────────────────────  │
│  📊  대시보드           │  ← 현재 선택: bg-muted + accent 텍스트
│  📋  보드               │  ← 호버: bg-muted
│  📅  캘린더             │
│  📈  타임라인           │
│  🔄  루틴               │
│                         │
│  ─────────────────────  │
│  프로젝트        [+]    │
│  🟣 CMP 모니터링       │
│  🟢 트레이딩봇         │
│  🔵 발자취 앱          │
│  🟠 홈서버 관리        │
│                         │
│  ─────────────────────  │
│  ⚙️ 설정     🌙/☀️     │
└─────────────────────────┘

네비 아이템 스타일:
height: 32px
padding: 0 12px
border-radius: 6px
font-size: 13px
color: --text-secondary
hover: bg --bg-muted
active: bg --accent-muted, color --accent-default
아이콘: 16px, Lucide Icons
```

### 4.6 입력 필드

```css
.input {
  height: 32px;
  padding: 0 var(--space-3);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--bg-muted);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input:focus {
  outline: none;
  border-color: var(--accent-default);
  box-shadow: 0 0 0 3px var(--accent-muted);
}
.input::placeholder {
  color: var(--text-tertiary);
}
```

### 4.7 프로그레스 바

```css
.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--bg-muted);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--accent-default);
  transition: width 300ms ease;
}
/* 프로젝트별 색상은 --project-color 변수로 */
.progress-fill[data-project] {
  background: var(--project-color);
}
```

### 4.8 커맨드 팔레트 (Cmd+K)

```
스타일:
- 화면 중앙, 약간 위쪽 (top: 25vh)
- width: 560px
- bg: --bg-elevated
- border: 1px solid --border-default
- border-radius: 12px
- box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5)
- backdrop-filter: blur(8px)  (배경 블러)

내부:
┌──────────────────────────────────┐
│ 🔍  [ 검색...               ]   │  ← input, 큰 사이즈
│──────────────────────────────────│
│ 최근                             │  ← 섹션 헤더 (--text-sm, uppercase)
│  📋  알람 로직 개선               │  ← 결과 아이템 (호버: bg-muted)
│  📋  서버 타임아웃 수정           │
│──────────────────────────────────│
│ 빠른 동작                         │
│  ➕  새 태스크           ⌘N      │  ← 단축키는 .kbd 스타일
│  📋  보드로 이동         ⌘B      │
└──────────────────────────────────┘
```

---

## 5. 모션 & 트랜지션

### 5.1 타이밍 함수

```css
:root {
  --ease-default:  cubic-bezier(0.16, 1, 0.3, 1);   /* 빠른 시작, 부드러운 끝 */
  --ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1); /* 약간 튕김 */

  --duration-fast:    100ms;   /* 호버 상태 */
  --duration-normal:  150ms;   /* 일반 트랜지션 */
  --duration-slow:    250ms;   /* 패널 열기/닫기 */
  --duration-slower:  350ms;   /* 모달, 페이지 전환 */
}
```

### 5.2 적용 패턴

```css
/* 호버 상태 (빠르게) */
.card { transition: all var(--duration-fast) ease; }

/* 슬라이드 패널 열기 */
.panel-enter {
  transform: translateX(100%);
  opacity: 0;
}
.panel-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all var(--duration-slow) var(--ease-default);
}

/* 태스크 완료 시 체크 애니메이션 */
@keyframes check-complete {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
.check-animation {
  animation: check-complete 300ms var(--ease-bounce);
}

/* 칸반 드래그 중 */
.dragging {
  opacity: 0.7;
  transform: rotate(2deg) scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}
```

### 5.3 모션 사용 규칙

```
항상 애니메이션:
✓ 태스크 완료 체크 (성취감)
✓ 슬라이드 패널 열기/닫기
✓ 모달 열기/닫기
✓ 드래그앤드롭 피드백
✓ 프로그레스 바 변화
✓ 커맨드 팔레트 열기

절대 애니메이션 금지:
✗ 리스트 아이템 로딩 (데이터는 즉시 표시)
✗ 페이지 간 전환 (빠르게 전환, 지연 금지)
✗ 단순 호버에 복잡한 효과
✗ 로딩 중 스켈레톤의 과도한 반짝임
```

---

## 6. 아이콘 시스템

### 6.1 아이콘 라이브러리

```
Lucide Icons (lucide-react)
→ Linear에서도 사용하는 깔끔한 아이콘 세트
→ stroke-width: 1.5px (기본 2px보다 가볍게)
→ 크기: 16px (네비/인라인), 20px (버튼), 24px (페이지 헤더)
```

### 6.2 커스텀 상태 아이콘

```
태스크 상태:
○  TODO          → 빈 원 (stroke: --text-tertiary)
◐  IN_PROGRESS   → 반원 채움 (fill: --accent-default)
◉  IN_REVIEW     → 거의 채움 (fill: --warning-default)
●  DONE          → 꽉 채움 (fill: --success-default) + 체크
⊘  CANCELLED     → 취소선 원 (stroke: --text-disabled)

우선순위:
⚡ URGENT        → 번개 아이콘 (color: --priority-urgent)
▲  HIGH          → 위 화살표 (color: --priority-high)
═  MEDIUM        → 가로줄 두 개 (color: --priority-medium)
▽  LOW           → 아래 화살표 (color: --priority-low)
```

---

## 7. 반응형 브레이크포인트

```css
:root {
  --bp-sm:   640px;    /* 모바일 */
  --bp-md:   768px;    /* 태블릿 */
  --bp-lg:   1024px;   /* 작은 데스크톱 */
  --bp-xl:   1280px;   /* 데스크톱 */
  --bp-2xl:  1536px;   /* 넓은 데스크톱 */
}

/* 모바일: 사이드바 숨김, 햄버거 메뉴 */
/* 태블릿: 사이드바 아이콘만 (52px) */
/* 데스크톱: 사이드바 풀 (240px) */
```

---

## 8. 그림자 & 깊이

```css
:root {
  /* 다크 모드에서는 그림자보다 border와 배경색 차이로 깊이 표현 */
  --shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:   0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg:   0 12px 32px rgba(0, 0, 0, 0.5);
  --shadow-xl:   0 24px 48px rgba(0, 0, 0, 0.6);

  /* 드래그 중인 카드 */
  --shadow-drag: 0 20px 40px rgba(0, 0, 0, 0.4),
                 0 0 0 1px var(--accent-default);
}

/* 깊이 계층 (다크 모드):
   가장 깊은 배경   → --bg-base     (가장 어두움)
   기본 콘텐츠      → --bg-default
   사이드바/카드    → --bg-subtle
   입력/호버        → --bg-muted
   모달/팝오버      → --bg-elevated  (가장 밝음)
   
   올라갈수록 밝아진다 (Linear/Material Design 방식)
*/
```

---

## 9. Tailwind CSS 설정

위 토큰들을 Tailwind에 통합:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "[data-theme='dark']"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist Sans", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      fontSize: {
        "2xs": "0.6875rem",  // 11px
        xs:    "0.75rem",    // 12px
        sm:    "0.8125rem",  // 13px
        base:  "0.875rem",   // 14px
        md:    "0.9375rem",  // 15px
        lg:    "1.125rem",   // 18px
        xl:    "1.25rem",    // 20px
        "2xl": "1.5rem",     // 24px
        "3xl": "2rem",       // 32px
      },
      colors: {
        bg: {
          base:     "var(--bg-base)",
          DEFAULT:  "var(--bg-default)",
          subtle:   "var(--bg-subtle)",
          muted:    "var(--bg-muted)",
          elevated: "var(--bg-elevated)",
        },
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary:  "var(--text-tertiary)",
          disabled:  "var(--text-disabled)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          subtle:  "var(--border-subtle)",
          strong:  "var(--border-strong)",
        },
        accent: {
          DEFAULT: "var(--accent-default)",
          hover:   "var(--accent-hover)",
          muted:   "var(--accent-muted)",
          subtle:  "var(--accent-subtle)",
        },
        success: {
          DEFAULT: "var(--success-default)",
          muted:   "var(--success-muted)",
          text:    "var(--success-text)",
        },
        warning: {
          DEFAULT: "var(--warning-default)",
          muted:   "var(--warning-muted)",
          text:    "var(--warning-text)",
        },
        danger: {
          DEFAULT: "var(--danger-default)",
          muted:   "var(--danger-muted)",
          text:    "var(--danger-text)",
        },
        priority: {
          urgent: "var(--priority-urgent)",
          high:   "var(--priority-high)",
          medium: "var(--priority-medium)",
          low:    "var(--priority-low)",
        },
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "9999px",
      },
      boxShadow: {
        sm:   "var(--shadow-sm)",
        md:   "var(--shadow-md)",
        lg:   "var(--shadow-lg)",
        xl:   "var(--shadow-xl)",
        drag: "var(--shadow-drag)",
      },
      transitionTimingFunction: {
        default: "var(--ease-default)",
        bounce:  "var(--ease-bounce)",
      },
      transitionDuration: {
        fast:   "100ms",
        normal: "150ms",
        slow:   "250ms",
        slower: "350ms",
      },
      width: {
        sidebar:           "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-width-collapsed)",
        panel:             "var(--panel-width)",
      },
      height: {
        topbar: "var(--topbar-height)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 10. 디자인 레퍼런스 이미지 가이드

클로드 코드에 UI를 요청할 때 이 키워드를 함께 전달하면 디자인 일관성이 유지된다:

```
"DESIGN-SYSTEM.md를 참고해서 구현해줘.
다크 모드 우선, Geist 폰트, Lucide 아이콘 사용.
색상은 CSS 변수로만, 카드/버튼은 디자인 시스템의 패턴 따라서.
호버 트랜지션 150ms, 슬라이드 패널은 250ms.
본문 14px, 제목 500 weight, 메타데이터 13px secondary 색상."
```

### 핵심 참고 앱 스크린샷 기준

| 화면 | 참고할 앱 | 핵심 포인트 |
|------|----------|------------|
| 사이드바 | Linear | 아이콘+텍스트, 프로젝트 리스트 접기, 좁은 패딩 |
| 칸반보드 | Linear | 컬럼 헤더 미니멀, 카드에 메타데이터 압축 |
| 태스크 상세 | Notion | 프로퍼티 그리드 레이아웃, 인라인 편집 |
| 캘린더 | Google Calendar | 색상 이벤트 블록, 월간 그리드 |
| 간트차트 | Height App | 미니멀 바, 의존성 곡선 화살표 |
| 대시보드 | Vercel Dashboard | 카드 그리드, 모노스페이스 숫자, 차트 미니멀 |
| 커맨드 팔레트 | Raycast | 중앙 정렬, 블러 배경, 즉시 결과 |
| 브레인스토밍 | FigJam (심플 버전) | 포스트잇 그리드, 색상으로 카테고리 |
