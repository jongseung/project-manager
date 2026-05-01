import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * SMC 봇 프로젝트 — AI(Claude) 실행 가능한 수준의 상세 플랜
 *
 * 각 태스크는 다음을 포함:
 * - 작업 대상 파일/모듈 경로
 * - 현재 상태 (As-is) 및 목표 상태 (To-be)
 * - 수용 기준 (Acceptance Criteria)
 * - 참고할 리소스 (DB 테이블, SSH, 기존 로직)
 */

const PROJECT_ROOT = "~/auto-coin-bot";
const SSH = "ssh jongseung@192.168.45.53 (pw: gkdms)";
const DB_DSN = "PGPASSWORD=gkdms psql -h 192.168.45.53 -p 5432 -U trading_user -d trading_bot_v2";

async function main() {
  const ORG_ID = "cmo3mzab9000dqdmee5e5av28";

  const workspace = await prisma.workspace.findFirst({
    where: { name: "트레이딩 봇", organizationId: ORG_ID },
  });
  if (!workspace) throw new Error("트레이딩 봇 워크스페이스 없음");

  // 기존 SMC 프로젝트 삭제
  await prisma.project.deleteMany({
    where: { workspaceId: workspace.id, name: { in: ["코인봇", "Auto Coin Bot (SMC)"] } },
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Auto Coin Bot (SMC)",
      description: `바이낸스 선물 SMC 자동매매 봇 — v7 운영/고도화
**운영**: 서버 Docker 배포 (GitHub Actions 자동배포), 로컬 실행 X
**SSH**: ${SSH}
**DB**: ${DB_DSN} → trade_history 테이블
**Repo**: ${PROJECT_ROOT}
**Tech**: Python / ccxt / PostgreSQL / Docker / Telegram`,
      status: "active",
      color: "#f59e0b",
      startDate: "2026-02-14",
    },
  });

  // ─── 라벨 ──────────────────────────────────────────────────────
  const labelDefs = [
    { name: "실전운영", color: "#10b981" },
    { name: "버그", color: "#ef4444" },
    { name: "리스크", color: "#f59e0b" },
    { name: "리서치", color: "#8b5cf6" },
    { name: "성능", color: "#06b6d4" },
    { name: "백테스트", color: "#6366f1" },
    { name: "AI작업가능", color: "#22c55e" },
    { name: "수동필요", color: "#64748b" },
  ];
  const labels: Record<string, string> = {};
  for (const def of labelDefs) {
    const existing = await prisma.label.findFirst({ where: { workspaceId: workspace.id, name: def.name } });
    const l = existing ?? await prisma.label.create({ data: { workspaceId: workspace.id, ...def } });
    labels[def.name] = l.id;
  }

  // ─── Goal ──────────────────────────────────────────────────────
  const goal = await prisma.goal.create({
    data: {
      workspaceId: workspace.id,
      title: "SMC 봇 v7 월간 수익률 10% 안정 달성",
      description: "v7 실거래 검증 → v8 리서치 병행 → 3개월 복리 30% 목표. MDD 10% 이하 유지.",
      status: "in_progress",
      startDate: "2026-04-19",
      targetDate: "2026-07-19",
    },
  });
  await prisma.goalProject.create({ data: { goalId: goal.id, projectId: project.id } });

  // ─── KPI ───────────────────────────────────────────────────────
  await prisma.kPI.createMany({
    data: [
      { projectId: project.id, goalId: goal.id, name: "월간 수익률", unit: "%", targetValue: 10, direction: "increase" },
      { projectId: project.id, name: "승률 (WR)", unit: "%", targetValue: 60, direction: "increase" },
      { projectId: project.id, name: "Profit Factor", unit: "배", targetValue: 1.8, direction: "increase" },
      { projectId: project.id, name: "최대 낙폭 MDD", unit: "%", targetValue: 10, direction: "decrease" },
      { projectId: project.id, name: "일평균 거래 횟수", unit: "회", targetValue: 3, direction: "increase" },
      { projectId: project.id, name: "평균 RR (손익비)", unit: "배", targetValue: 2.0, direction: "increase" },
      { projectId: project.id, name: "exchange_closed 에러 횟수", unit: "회/주", targetValue: 0, direction: "decrease" },
    ],
  });

  // ─── 마일스톤 ──────────────────────────────────────────────────
  await prisma.milestone.createMany({
    data: [
      { projectId: project.id, name: "v7 실거래 2주 안정화", description: "MDD 10% 이하, 폭탄손실 0건", targetDate: "2026-05-03", status: "pending", sortOrder: 0 },
      { projectId: project.id, name: "관측성 대시보드 런칭", description: "Streamlit + Grafana, 실시간 포지션/PnL/에러", targetDate: "2026-05-17", status: "pending", sortOrder: 1 },
      { projectId: project.id, name: "v7.1 릴리즈 (리스크 강화)", description: "동적 포지션 사이징 + 연속손실 쿨다운 + 이벤트 회피", targetDate: "2026-05-31", status: "pending", sortOrder: 2 },
      { projectId: project.id, name: "v8 리서치 프로토타입", description: "ML regime 분류 + 멀티 TF 확인", targetDate: "2026-06-28", status: "pending", sortOrder: 3 },
    ],
  });

  // ─── 스프린트 ──────────────────────────────────────────────────
  const sprintDefs = [
    { projectId: project.id, name: "Sprint A: v7 안정화 & 검증",   startDate: "2026-04-19", endDate: "2026-05-03", status: "active",   goalDescription: "v7 실거래 2주 운영 검증, 이상 청산 0건, KPI 측정 파이프라인 구축" },
    { projectId: project.id, name: "Sprint B: 리스크 & 관측성",   startDate: "2026-05-04", endDate: "2026-05-17", status: "planning", goalDescription: "동적 포지션 사이징 + 실시간 대시보드 + 텔레그램 킬스위치" },
    { projectId: project.id, name: "Sprint C: 전략 최적화 (v7.1)", startDate: "2026-05-18", endDate: "2026-05-31", status: "planning", goalDescription: "Regime 분류 개선, per-symbol 파라미터 재최적화, Liquidity Sweep 정교화" },
    { projectId: project.id, name: "Sprint D: v8 리서치",          startDate: "2026-06-01", endDate: "2026-06-28", status: "planning", goalDescription: "ML regime 분류기, 멀티 TF, 베이지안 가중치 자동조정 PoC" },
  ];
  const sprints = [];
  for (const d of sprintDefs) sprints.push(await prisma.sprint.create({ data: d }));
  const [spA, spB, spC, spD] = sprints;

  // ─── 에픽 ──────────────────────────────────────────────────────
  const epicDefs = [
    { projectId: project.id, name: "v7 안정화 & 실전 검증",     priority: "urgent", status: "in_progress", sortOrder: 0 },
    { projectId: project.id, name: "리스크 관리 고도화",        priority: "urgent", status: "todo", sortOrder: 1 },
    { projectId: project.id, name: "전략 최적화 (v7.1)",        priority: "high",   status: "todo", sortOrder: 2 },
    { projectId: project.id, name: "관측성 & 모니터링",         priority: "high",   status: "todo", sortOrder: 3 },
    { projectId: project.id, name: "데이터 파이프라인 & 분석",   priority: "medium", status: "todo", sortOrder: 4 },
    { projectId: project.id, name: "인프라 & DevOps",           priority: "medium", status: "todo", sortOrder: 5 },
    { projectId: project.id, name: "테스트 & 품질",             priority: "medium", status: "todo", sortOrder: 6 },
    { projectId: project.id, name: "v8 리서치 & 신전략",        priority: "low",    status: "todo", sortOrder: 7 },
    { projectId: project.id, name: "문서화 & 지식 관리",        priority: "low",    status: "todo", sortOrder: 8 },
  ];
  const epics = [];
  for (const d of epicDefs) epics.push(await prisma.epic.create({ data: d }));
  const [stab, risk, strat, obs, data, infra, qa, research, docsE] = epics;

  // ─── AI 실행 가능 수준의 태스크 정의 ─────────────────────────────
  type TaskDef = {
    epicId: string;
    title: string;
    description: string;
    priority: string;
    status?: string;
    estimatedHours?: number;
    sortOrder: number;
    sprintId?: string;
    labelNames?: string[];
  };

  const tasks: TaskDef[] = [
    // ═══ Sprint A: v7 안정화 & 검증 ═══
    {
      epicId: stab.id, priority: "urgent", status: "in_progress", sortOrder: 0, sprintId: spA.id,
      labelNames: ["실전운영", "AI작업가능"], estimatedHours: 6,
      title: "v7 vs v6.1 실전 성과 비교 리포트 생성",
      description: `### 목적
v7 "실거래 데이터 기반 전략 구조 전면 개편"(5fccdc8)이 v6.1 대비 실제로 개선됐는지 검증.

### 작업 대상
- DB: \`trade_history\` 테이블 (${DB_DSN})
- 접속: ${SSH}
- 코드 참고: \`smc_trader/analysis/analyze_journal.py\`

### 수행 절차
1. DB에서 v6.1 기간(2026-03-XX ~ v7 배포 전)과 v7 기간(v7 배포 이후) 거래 내역 쿼리
2. 각 기간별로: WR, PF, 평균 RR, MDD, 총 수익률 계산
3. 전략별(Order Block, FVG, Liquidity Sweep 등) 분해 비교
4. 결과를 \`docs/v7_vs_v6.1_comparison.md\`로 저장 (마크다운 테이블)

### 수용 기준
- [ ] 두 버전의 기간이 DB에서 정확히 구분됨 (배포 시각 기준)
- [ ] 최소 WR/PF/MDD/거래수 4개 지표 비교
- [ ] 전략별 승률 차이가 있는 경우 추정 원인 서술
- [ ] PM의 "월간 수익률" KPI에 반영할 수치 도출`,
    },
    {
      epicId: stab.id, priority: "urgent", sortOrder: 1, sprintId: spA.id,
      labelNames: ["실전운영", "버그"], estimatedHours: 4,
      title: "exchange_closed 에러 재발 여부 점검 및 재현 테스트",
      description: `### 배경
v6.1에서 "exchange_closed 감지 강화" 패치 이후 폭탄 손실 방지됨(커밋 78050a9, 672efd1).
v7 전환 후 재발 여부 확인 필요.

### 작업 대상
- 로그: ${SSH} → \`/var/log/...\` 또는 Docker \`docker logs <container>\`
- 코드: \`smc_trader/core/exchange.py\`, \`main.py\` 재시작 포지션 복구 로직

### 수행 절차
1. 서버 로그에서 "exchange_closed" 문자열 grep (최근 2주)
2. 발생 시각/종목/손실액 집계
3. 유닛 테스트로 API timeout 시나리오 재현 (mock)
4. 미발생 시 → KPI에 "exchange_closed 0건/주" 기록
5. 발생 시 → 핫픽스 서브태스크 생성

### 수용 기준
- [ ] 최근 2주 로그 전수 검색
- [ ] 발생 패턴 분류 (timeout / rate limit / WebSocket 끊김)
- [ ] 재현 테스트 케이스 작성`,
    },
    {
      epicId: stab.id, priority: "urgent", sortOrder: 2, sprintId: spA.id,
      labelNames: ["실전운영", "AI작업가능"], estimatedHours: 5,
      title: "멀티 심볼 동시 포지션 안정성 검증",
      description: `### 배경
v4에서 "동시 포지션 2개 허용"(c737ec3). 실제 동시 진입 시 잔고/레이스 컨디션 확인 필요.

### 작업 대상
- 코드: \`main.py\` \`_execute_with_symbol()\`, \`smc_trader/trading/signal_aggregator.py\`
- DB: trade_history에서 entry_time 근접한 건 쿼리

### 수행 절차
1. 지난 2주 중 동시 오픈된 포지션 쌍 추출 (entry_time 차이 < 10초)
2. 잔고 부족으로 실패한 주문 로그 확인
3. \`asyncio\` 또는 \`threading\` 사용 여부 확인 → 락 필요 여부 판단
4. 필요 시 \`asyncio.Lock\` 또는 잔고 사전 예약 로직 추가

### 수용 기준
- [ ] 동시 진입 케이스 N건 식별
- [ ] 잔고 부족 실패 0건 확인 또는 수정
- [ ] 테스트: 2개 종목 시뮬레이션 진입 시 양쪽 체결`,
    },
    {
      epicId: stab.id, priority: "high", sortOrder: 3, sprintId: spA.id,
      labelNames: ["AI작업가능"], estimatedHours: 4,
      title: "티커 스캐너 선정 종목 품질 역추적 분석",
      description: `### 목적
\`ticker_scanner.py\`가 자동 선정한 종목의 실제 거래 성과 측정.

### 작업 대상
- 코드: \`smc_trader/trading/ticker_scanner.py\` (43KB)
- 로그/DB: 스캔 결과 + trade_history

### 수행 절차
1. 로그에서 "스캔 결과" 블록 파싱하여 선정 종목 리스트 추출
2. 각 종목의 실제 거래 PnL 매칭 (trade_history)
3. 스캔 점수 상위 N개 vs 실제 수익률 상관계수 계산
4. 점수 대비 성과 저조 종목 블랙리스트 후보 도출

### 수용 기준
- [ ] 상관계수 수치화
- [ ] 블랙리스트 후보 제시 (근거 포함)
- [ ] 리포트: \`docs/scanner_quality_report.md\``,
    },
    {
      epicId: qa.id, priority: "high", sortOrder: 0, sprintId: spA.id,
      labelNames: ["AI작업가능"], estimatedHours: 3,
      title: "기존 pytest 스위트 실행 & 커버리지 측정",
      description: `### 작업 대상
- \`tests/test_strategies.py\`, \`tests/test_signal_aggregator.py\`, \`tests/test_momentum_breakout.py\`, \`tests/test_partial_tp.py\`, \`tests/test_phase8_poc.py\`

### 수행 절차
1. \`pytest --cov=smc_trader --cov-report=html --cov-report=term\` 실행
2. 커버리지 < 50% 모듈 식별
3. \`docs/test_coverage_baseline.md\`에 현재 상태 기록
4. 다음 스프린트 테스트 보강 우선순위 결정

### 수용 기준
- [ ] 모든 테스트 PASS (실패 시 원인 기록)
- [ ] 모듈별 커버리지 수치 표로 정리
- [ ] 우선순위 상위 3개 모듈 선정`,
    },

    // ═══ Sprint B: 리스크 & 관측성 ═══
    {
      epicId: risk.id, priority: "urgent", sortOrder: 0, sprintId: spB.id,
      labelNames: ["리스크", "AI작업가능"], estimatedHours: 6,
      title: "ATR 기반 동적 포지션 사이징 구현",
      description: `### 현재 상태 (As-is)
\`config.py\` \`RISK_PER_TRADE = 3%\` 고정. 변동성 높은 날에도 동일 리스크.

### 목표 상태 (To-be)
당일 ATR 백분위(rolling 30일)에 따라 0.5x ~ 1.5x 스케일링.
- ATR > 90th percentile → 0.5x
- ATR 50~90th → 1.0x
- ATR < 50th → 1.2x

### 작업 대상
- \`smc_trader/core/config.py\`: \`DYNAMIC_SIZING_ENABLED\`, 백분위 구간 추가
- \`smc_trader/trading/signal_aggregator.py\`: 포지션 사이즈 계산 함수
- \`tests/test_signal_aggregator.py\`: 사이징 테스트 추가

### 수용 기준
- [ ] config 플래그로 on/off 가능
- [ ] 기존 고정값 동작과 후방호환
- [ ] 백테스트 결과: 동일 전략에서 MDD 감소 확인
- [ ] pytest 통과`,
    },
    {
      epicId: risk.id, priority: "high", sortOrder: 1, sprintId: spB.id,
      labelNames: ["리스크", "AI작업가능"], estimatedHours: 3,
      title: "연속 손실 자동 쿨다운 로직",
      description: `### 목표
N회 연속 손절 시 M시간 거래 중단 (기본: 3회/2시간).

### 작업 대상
- \`smc_trader/trading/signal_aggregator.py\` 또는 신규 \`risk_gate.py\`
- \`config.py\`: \`CONSECUTIVE_LOSS_LIMIT\`, \`COOLDOWN_HOURS\`

### 수행 절차
1. 최근 N건 closed trade를 메모리/DB로 추적
2. 연속 loss 카운터가 임계치 도달 시 신호 차단
3. 텔레그램으로 "쿨다운 진입 | N시간 동안 매매 중단" 알림
4. 쿨다운 종료 시 자동 재개 알림

### 수용 기준
- [ ] 3회 연속 손실 시뮬레이션 테스트 통과
- [ ] 텔레그램 알림 실제 발송 확인
- [ ] 쿨다운 해제 후 정상 매매 재개`,
    },
    {
      epicId: risk.id, priority: "high", sortOrder: 2, sprintId: spB.id,
      labelNames: ["리스크"], estimatedHours: 4,
      title: "텔레그램 킬 스위치 원격 제어 (/stop /resume /status)",
      description: `### 목표
텔레그램 명령어로 봇 즉시 중단/재개/상태 조회.

### 작업 대상
- \`smc_trader/core/telegram_notifier.py\`
- 봇 프로세스 간 상태 공유 (redis 또는 파일)

### 명령어 명세
- \`/stop\`: 새로운 진입 차단 (기존 포지션은 유지)
- \`/force_close\`: 모든 포지션 즉시 청산
- \`/resume\`: 매매 재개
- \`/status\`: 잔고/포지션/당일 PnL 요약

### 수용 기준
- [ ] 4개 명령 모두 동작
- [ ] 권한 체크 (본인 chat_id만 허용)
- [ ] 재시작 후에도 stop 상태 유지`,
    },
    {
      epicId: obs.id, priority: "high", sortOrder: 0, sprintId: spB.id,
      labelNames: ["AI작업가능"], estimatedHours: 8,
      title: "Streamlit 실시간 대시보드 구축",
      description: `### 구성 요소
1. 상단: 현재 포지션 테이블 (종목/진입가/현재가/PnL/SL/TP)
2. 중단: 당일 누적 PnL 차트 (15분 단위)
3. 하단 좌: 최근 시그널 10개 (컨플루언스 점수 + 진입 여부)
4. 하단 우: 에러/경고 로그 스트림

### 작업 대상
- 신규: \`dashboard.py\` (또는 \`smc_trader/analysis/dashboard.py\`)
- 데이터 소스: trade_history DB + positions_live.json

### 수용 기준
- [ ] \`streamlit run dashboard.py\`로 실행
- [ ] 30초 자동 새로고침
- [ ] 서버에서 실행 + 포트 포워딩으로 로컬 접근
- [ ] 모바일 화면에서도 가독성 확보`,
    },
    {
      epicId: obs.id, priority: "medium", sortOrder: 1, sprintId: spB.id,
      labelNames: ["AI작업가능"], estimatedHours: 4,
      title: "텔레그램 일일 리포트 고도화",
      description: `### 현재 상태
기본 매매 알림만 존재.

### 목표 포맷 (매일 00:00 UTC)
\`\`\`
📊 일일 리포트 2026-05-07
━━━━━━━━━━━━━━━━━━
💰 당일 PnL: +2.3% (+$230)
📈 거래 수: 4건 (승 3 / 패 1)
🎯 승률: 75% | PF: 3.2
📉 최대 드로다운: -0.8%
━━━━━━━━━━━━━━━━━━
전략별 성과:
  Order Block: 2건 / +1.5%
  FVG: 1건 / +0.6%
  Liquidity Sweep: 1건 / -0.2%
\`\`\`

### 작업 대상
- \`smc_trader/core/telegram_notifier.py\`
- \`smc_trader/analysis/analyze_journal.py\`
- cron 또는 APScheduler로 스케줄링

### 수용 기준
- [ ] 매일 자동 발송
- [ ] 전략별 분해
- [ ] 주간/월간 요약 옵션`,
    },
    {
      epicId: obs.id, priority: "medium", sortOrder: 2, sprintId: spB.id,
      labelNames: ["AI작업가능"], estimatedHours: 4,
      title: "Sentry 예외 수집 연동",
      description: `### 작업 대상
- \`requirements.txt\`: \`sentry-sdk\` 추가
- \`main.py\` 또는 \`smc_trader/__init__.py\` 초기화
- \`.env\`: \`SENTRY_DSN\` 추가

### 수용 기준
- [ ] Sentry 프로젝트 생성 + DSN 설정
- [ ] 예외 자동 전송 확인
- [ ] 민감 정보(API 키) 필터링 검증
- [ ] 반복 에러 그룹핑 확인`,
    },

    // ═══ Sprint C: 전략 최적화 (v7.1) ═══
    {
      epicId: strat.id, priority: "high", sortOrder: 0, sprintId: spC.id,
      labelNames: ["백테스트", "AI작업가능"], estimatedHours: 10,
      title: "per-symbol 파라미터 그리드 서치 재실행",
      description: `### 배경
v3에서 per-symbol 최적화(d1a4fd1), v5에서 재최적화(532dee9) 했으나 시장 환경 변화 반영 필요.

### 대상 종목
BTC/USDT, ETH/USDT, SOL/USDT, + 당시 거래 상위 알트 3개

### 최적화 파라미터
- RSI period (7, 14, 21)
- EMA fast/slow (12/26, 9/21, 20/50)
- ATR multiplier for SL (1.0, 1.5, 2.0, 2.5)
- TP RR ratio (1.5, 2.0, 2.5, 3.0)

### 작업 대상
- \`optimize_strategies.py\`, \`optimize_ev.py\` 재사용
- 백테스트 기간: 2026-01-01 ~ 2026-04-15

### 수용 기준
- [ ] 각 종목별 상위 3개 파라미터 조합 도출
- [ ] 현재 config와 비교 표 작성
- [ ] v7.1 config 업데이트 PR 생성 (A/B 준비)`,
    },
    {
      epicId: strat.id, priority: "high", sortOrder: 1, sprintId: spC.id,
      labelNames: ["리서치", "AI작업가능"], estimatedHours: 8,
      title: "Regime 분류기 개선 (ADX + BB squeeze + 히스토그램)",
      description: `### 현재
룰 기반 + c7b14c4에서 EMA PB + VWAP 필터 추가, a6a963c 완화.

### 목표
3개 regime으로 분류: \`trending\` / \`ranging\` / \`volatile\`
- trending: ADX > 25 & EMA 기울기 > 임계치
- ranging: ADX < 20 & BB width < 30th percentile
- volatile: ATR > 90th percentile

### 작업 대상
- \`smc_trader/strategies/indicators.py\`: ADX/BB/ATR 통합
- 신규: \`smc_trader/strategies/regime.py\`
- \`smc_trader/trading/signal_aggregator.py\`: regime별 전략 가중치 조정

### 수용 기준
- [ ] 3-class regime 분류 정확도 시각화
- [ ] 백테스트: regime별 성과 표 작성
- [ ] 기존 대비 ranging 시장 손실 감소 확인`,
    },
    {
      epicId: strat.id, priority: "high", sortOrder: 2, sprintId: spC.id,
      labelNames: ["리서치"], estimatedHours: 12,
      title: "멀티 타임프레임 확인 (15m + 1h + 4h)",
      description: `### 목표
15m 시그널 발생 시 1h와 4h 추세가 일치할 때만 진입.

### 구현
1. \`smc_trader/core/exchange.py\`: 멀티 TF OHLCV 조회 메서드
2. \`smc_trader/trading/signal_aggregator.py\`: MTF confirmation 레이어
3. 캐시: 상위 TF는 캔들 갱신 시에만 재계산 (성능 최적화)

### 수용 기준
- [ ] 백테스트에서 false positive 감소 확인
- [ ] 캐시 적중률 측정 로그
- [ ] config 플래그로 MTF on/off 가능`,
    },
    {
      epicId: strat.id, priority: "medium", sortOrder: 3, sprintId: spC.id,
      labelNames: ["리서치"], estimatedHours: 6,
      title: "Liquidity Sweep 가짜 스윕 필터링 강화",
      description: `### 문제
현재 \`liquidity_sweep.py\`는 스윕 발생 시 즉시 진입.
가짜 스윕(즉시 회귀 없는 지속적 돌파) 손실 발생.

### 해결
스윕 후 M캔들 이내 반대 방향 회귀 확인 후 진입.

### 작업 대상
- \`smc_trader/strategies/liquidity_sweep.py\`

### 수용 기준
- [ ] 백테스트 WR 5%p 이상 상승
- [ ] 단위 테스트 추가`,
    },
    {
      epicId: strat.id, priority: "medium", sortOrder: 4, sprintId: spC.id,
      labelNames: ["리서치", "백테스트"], estimatedHours: 6,
      title: "Breaker Block 전략 실거래 성과 검증 & 조건 재검토",
      description: `### 현황
\`breaker_block.py\` 존재하나 실거래 성과 저조 보고.

### 작업
1. DB에서 Breaker Block 전략 거래만 추출
2. 실패 케이스 차트 5개 수동 검토
3. 실패 패턴 일반화 → 진입 조건 추가 (거래량/BOS 확인 등)
4. 백테스트 재실행

### 수용 기준
- [ ] 실패 패턴 3가지 이상 식별
- [ ] 수정 후 WR 개선 확인 or 전략 비활성화 결정`,
    },

    // ═══ Sprint D: v8 리서치 ═══
    {
      epicId: research.id, priority: "medium", sortOrder: 0, sprintId: spD.id,
      labelNames: ["리서치"], estimatedHours: 20,
      title: "ML 기반 regime 분류기 PoC (XGBoost)",
      description: `### 목표
룰 기반 regime → 머신러닝 분류기로 교체 가능성 검증.

### 피처
- ADX, BB width, ATR, RSI, OBV slope, volume zscore, 상위 TF 추세

### 라벨 생성
과거 데이터에서 후행적으로 regime 라벨링
- trending: 이후 20캔들 동안 한방향 이동폭 > N%
- ranging: 박스권 유지
- volatile: ATR 급증

### 수용 기준
- [ ] 교차검증 정확도 ≥ 70%
- [ ] 룰 기반 대비 백테스트 개선 여부 정량 평가
- [ ] 추론 지연 < 50ms`,
    },
    {
      epicId: research.id, priority: "low", sortOrder: 1, sprintId: spD.id,
      labelNames: ["리서치"], estimatedHours: 15,
      title: "전략 가중치 베이지안 자동 조정 PoC",
      description: `### 목표
각 전략의 최근 N일 성과에 따라 Signal Aggregator 가중치 동적 조정.

### 접근
- Beta 분포 기반 Thompson sampling
- 각 전략의 win/loss를 베타 분포 파라미터로 업데이트
- 매일 자정 가중치 재계산

### 작업 대상
- 신규: \`smc_trader/optimization/bayesian_weights.py\`
- \`signal_aggregator.py\`: 외부 가중치 주입

### 수용 기준
- [ ] 시뮬레이션: 6개월 데이터에서 고정 가중치 대비 수익률 개선
- [ ] 가중치 변화 시각화
- [ ] A/B 테스트 설계 문서`,
    },
    {
      epicId: research.id, priority: "low", sortOrder: 2, sprintId: spD.id,
      labelNames: ["리서치"], estimatedHours: 8,
      title: "온체인 데이터 통합 PoC (glassnode/cryptoquant)",
      description: `### 목표
거래소 외 온체인 시그널(거래소 유입/유출, 고래 활동)을 시그널로 통합 가능성 검증.

### 작업
1. glassnode 또는 cryptoquant 무료 티어 API 조사
2. BTC 주요 지표 3개 선정 (SOPR, Exchange Net Flow 등)
3. 상관관계 분석 (15m/1h 가격 변동과)
4. 유의미 시 별도 시그널로 통합 설계 제안

### 수용 기준
- [ ] API 비용/제약 분석
- [ ] 상관관계 > 0.3인 지표 식별
- [ ] 통합 설계 문서 초안`,
    },

    // ═══ 백로그 (스프린트 미배정) ═══
    {
      epicId: data.id, priority: "high", sortOrder: 0,
      labelNames: ["AI작업가능"], estimatedHours: 4,
      title: "trade_history 스키마 확장 (컨플루언스/regime/전략신뢰도)",
      description: `### 추가 컬럼
- \`confluence_score\` FLOAT
- \`regime\` VARCHAR(20)
- \`strategy_confidence\` FLOAT
- \`mtf_agreement\` BOOLEAN

### 작업
1. \`sql_setup.sql\`에 ALTER TABLE 추가
2. \`smc_trader/core/database.py\` insert 로직 업데이트
3. migration 스크립트 작성 (기존 row는 NULL 허용)

### 수용 기준
- [ ] 서버 DB 마이그레이션 무중단
- [ ] 신규 거래부터 컬럼 채워짐 확인`,
    },
    {
      epicId: data.id, priority: "medium", sortOrder: 1,
      labelNames: ["AI작업가능"], estimatedHours: 6,
      title: "OHLCV 로컬 캐시 (DuckDB/Parquet)",
      description: `### 목표
백테스트 속도 개선 — 현재 매번 API 호출.

### 작업
1. DuckDB 설치 및 \`data/ohlcv_cache.duckdb\` 생성
2. 캔들 조회 시 캐시 → 미스 시 API → 저장
3. 만료 전략 (최근 1시간은 캐시 미적용)

### 수용 기준
- [ ] 반복 백테스트 속도 10배 개선
- [ ] 디스크 사용량 < 500MB`,
    },
    {
      epicId: data.id, priority: "medium", sortOrder: 2,
      estimatedHours: 8,
      title: "월간 성과 리포트 자동 생성 파이프라인",
      description: `### 출력
매월 1일 03:00 UTC → HTML 리포트 생성 → 텔레그램 전송.

### 포함 내용
- 월간 수익률, MDD, Sharpe, WR
- 전략별 기여도 파이차트
- 일별 PnL 곡선
- TOP 10 수익/손실 거래`,
    },
    {
      epicId: infra.id, priority: "high", sortOrder: 0,
      labelNames: ["실전운영"], estimatedHours: 5,
      title: "GitHub Actions 배포 파이프라인 안정화",
      description: `### 요구사항
- 배포 전 pytest 통과 강제
- 배포 후 헬스체크 (텔레그램 /status 응답 확인)
- 실패 시 자동 롤백 (이전 이미지로 복귀)

### 작업 대상
- \`.github/workflows/*.yml\``,
    },
    {
      epicId: infra.id, priority: "high", sortOrder: 1,
      labelNames: ["실전운영"], estimatedHours: 4,
      title: "컨테이너 헬스체크 & 자동 재시작",
      description: `### 작업 대상
- \`docker-compose.yaml\` healthcheck 설정
- restart policy: \`unless-stopped\` → \`always\` 검토

### 수용 기준
- [ ] 컨테이너 죽음 감지 < 30초
- [ ] 자동 재시작 후 텔레그램 알림
- [ ] 복구 실패 3회 시 에스컬레이션`,
    },
    {
      epicId: infra.id, priority: "medium", sortOrder: 2,
      estimatedHours: 4,
      title: "DB + journal 일일 자동 백업 (S3 또는 로컬 rotate)",
      description: `### 작업
1. cron으로 매일 04:00 UTC PostgreSQL \`pg_dump\`
2. 7일 로테이션
3. 옵션: S3/R2 업로드`,
    },
    {
      epicId: qa.id, priority: "high", sortOrder: 1,
      labelNames: ["AI작업가능"], estimatedHours: 6,
      title: "Signal Aggregator 엣지케이스 테스트 추가",
      description: `### 추가할 시나리오
- 극단적 변동성 (ATR × 10 급등)
- 캔들 데이터 결측
- 컨플루언스 점수 동점 처리
- SL/TP 계산 음수 방어

### 작업 대상
- \`tests/test_signal_aggregator.py\``,
    },
    {
      epicId: qa.id, priority: "high", sortOrder: 2,
      labelNames: ["AI작업가능"], estimatedHours: 5,
      title: "SL/TP 주문 3단 Fallback 통합 테스트",
      description: `### 배경
\`exchange.py\`의 SL/TP 주문은 1차 Algo → 2차 STOP_MARKET → 3차 LIMIT reduceOnly 체인.
현재 단위 테스트 부재.

### 작업
- ccxt API mock (\`unittest.mock\` 또는 \`respx\`)
- 1차 실패 → 2차 성공, 1+2 실패 → 3차 확인
- 최종 전부 실패 시 알림 발송 확인`,
    },
    {
      epicId: qa.id, priority: "medium", sortOrder: 3,
      labelNames: ["AI작업가능"], estimatedHours: 2,
      title: "CI 파이프라인에 pytest 자동 실행",
      description: `### 작업 대상
- \`.github/workflows/test.yml\` 신규
- PR 시 자동 실행
- 커버리지 배지 README에 추가`,
    },
    {
      epicId: docsE.id, priority: "high", sortOrder: 0,
      labelNames: ["AI작업가능"], estimatedHours: 4,
      title: "운영 런북 작성 (장애 대응 절차)",
      description: `### 포함 시나리오
1. 바이낸스 API 장애 (rate limit / 503)
2. exchange_closed 감지 시
3. 텔레그램 봇 다운
4. DB 연결 끊김
5. 컨테이너 OOM
6. 잔고 부족으로 주문 거절

각 시나리오별: 증상 / 즉시 조치 / 근본 해결 / 재발 방지`,
    },
    {
      epicId: docsE.id, priority: "medium", sortOrder: 1,
      labelNames: ["AI작업가능"], estimatedHours: 3,
      title: "README v7 버전으로 업데이트",
      description: `### 현재
README는 v4 구조로 남아있음.

### 업데이트 필요
- 디렉토리 구조 (smc_trader/ 하위 모듈)
- config.py 파라미터 최신값
- 전략 15+ 목록 및 가중치
- v7 변경사항 섹션 추가`,
    },
    {
      epicId: docsE.id, priority: "medium", sortOrder: 2,
      labelNames: ["AI작업가능"], estimatedHours: 6,
      title: "전략별 README 작성 (smc_trader/strategies/README.md)",
      description: `### 각 전략마다
- 개념 & 이론 배경
- 탐색 조건
- 진입/SL/TP 규칙
- 파라미터 목록
- 최근 6개월 실전 성과 표
- 알려진 한계/실패 케이스`,
    },
    {
      epicId: docsE.id, priority: "low", sortOrder: 3,
      estimatedHours: 3,
      title: "v8 로드맵 문서 초안",
      description: `### 포함
- ML regime 분류
- 멀티 TF 확인
- 베이지안 가중치
- 온체인 데이터
- 목표 일정`,
    },
  ];

  for (const t of tasks) {
    const { labelNames, sprintId, ...rest } = t;
    const task = await prisma.task.create({ data: { projectId: project.id, ...rest } });

    if (sprintId) await prisma.sprintTask.create({ data: { sprintId, taskId: task.id } });
    if (labelNames) {
      for (const name of labelNames) {
        const labelId = labels[name];
        if (labelId) await prisma.taskLabel.create({ data: { taskId: task.id, labelId } });
      }
    }
  }

  console.log("✅ Auto Coin Bot (SMC) v2 — AI 실행 가능 플랜 생성 완료");
  console.log(`   - 에픽: ${epics.length}개`);
  console.log(`   - 스프린트: ${sprints.length}개`);
  console.log(`   - 태스크: ${tasks.length}개 (상세 설명/수용기준 포함)`);
  console.log(`   - 마일스톤: 4개`);
  console.log(`   - KPI: 7개`);
  console.log(`   - Goal: 1개`);
  console.log(`   - 라벨: ${Object.keys(labels).length}개`);
  console.log();
  console.log("💡 각 태스크는 파일 경로 + As-is/To-be + 수용 기준 포함 → Claude가 바로 작업 가능");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
