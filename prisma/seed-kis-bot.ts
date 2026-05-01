import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ORG_ID = "cmo3mzab9000dqdmee5e5av28";

  const workspace = await prisma.workspace.findFirst({
    where: { name: "트레이딩 봇", organizationId: ORG_ID },
  });
  if (!workspace) throw new Error("트레이딩 봇 워크스페이스 없음");

  // 기존 "한국투자증권 투자봇" 삭제
  await prisma.project.deleteMany({
    where: { workspaceId: workspace.id, name: { in: ["한국투자증권 투자봇", "KIS Auto Trader"] } },
  });

  // ─── 프로젝트 ──────────────────────────────────────────────────
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "KIS Auto Trader",
      description: "한국투자증권 OpenAPI 기반 국내 주식 비동기 자동매매 시스템 — 멀티 에이전트 + 100점 스크리닝",
      status: "active",
      color: "#3b82f6",
      startDate: "2026-02-14",
    },
  });

  // ─── 라벨 준비 ─────────────────────────────────────────────────
  const labelDefs = [
    { name: "실전운영", color: "#10b981" },
    { name: "버그", color: "#ef4444" },
    { name: "리스크", color: "#f59e0b" },
    { name: "리서치", color: "#8b5cf6" },
    { name: "성능", color: "#06b6d4" },
    { name: "에이전트", color: "#ec4899" },
    { name: "백테스트", color: "#6366f1" },
  ];
  const labels: Record<string, string> = {};
  for (const def of labelDefs) {
    const existing = await prisma.label.findFirst({ where: { workspaceId: workspace.id, name: def.name } });
    const l = existing ?? await prisma.label.create({ data: { workspaceId: workspace.id, ...def } });
    labels[def.name] = l.id;
  }

  // ─── Goal (전략 목표) ──────────────────────────────────────────
  const goal1 = await prisma.goal.create({
    data: {
      workspaceId: workspace.id,
      title: "KIS 봇 월간 수익률 5% 달성 & 실전 안정화",
      description: "Q2 베치헤드 — 100만원 시드 3개월 실전 검증, 매매 0건 이슈 완전 해소",
      status: "in_progress",
      startDate: "2026-04-19",
      targetDate: "2026-07-19",
    },
  });
  await prisma.goalProject.create({ data: { goalId: goal1.id, projectId: project.id } });

  // ─── KPI ───────────────────────────────────────────────────────
  await prisma.kPI.createMany({
    data: [
      { projectId: project.id, goalId: goal1.id, name: "월간 수익률", unit: "%", targetValue: 5, direction: "increase" },
      { projectId: project.id, name: "승률 (백테스트)", unit: "%", targetValue: 55, direction: "increase" },
      { projectId: project.id, name: "승률 (실전)", unit: "%", targetValue: 50, direction: "increase" },
      { projectId: project.id, name: "최대 낙폭 MDD", unit: "%", targetValue: 12, direction: "decrease" },
      { projectId: project.id, name: "Sharpe Ratio", unit: "배", targetValue: 1.5, direction: "increase" },
      { projectId: project.id, name: "일평균 매매 횟수", unit: "회", targetValue: 2, direction: "increase" },
      { projectId: project.id, name: "스크리닝 정확도 (선정종목 중 수익 비율)", unit: "%", targetValue: 60, direction: "increase" },
      { projectId: project.id, name: "백테스트↔실전 괴리율", unit: "%", targetValue: 15, direction: "decrease" },
    ],
  });

  // ─── 마일스톤 ──────────────────────────────────────────────────
  await prisma.milestone.createMany({
    data: [
      { projectId: project.id, name: "매매 0건 이슈 완전 해소 (v1.0)", description: "스크리닝 통과 종목이 실제 매매로 이어지는 E2E 검증", targetDate: "2026-05-02", status: "pending", sortOrder: 0 },
      { projectId: project.id, name: "백테스트 1년치 성과 리포트 (v1.1)", description: "2025 전종목 백테스트, 월별/섹터별 성과 분석", targetDate: "2026-05-16", status: "pending", sortOrder: 1 },
      { projectId: project.id, name: "멀티 에이전트 시스템 안정화 (v1.2)", description: "8개 에이전트 간 메시지 큐, 장애 격리", targetDate: "2026-05-30", status: "pending", sortOrder: 2 },
      { projectId: project.id, name: "실전 1개월 운영 리포트 (v2.0)", description: "실제 계좌 수익률 공개, KPI 달성 여부 평가", targetDate: "2026-06-30", status: "pending", sortOrder: 3 },
    ],
  });

  // ─── Sprint (2주 단위 4개) ─────────────────────────────────────
  const sprints = await Promise.all([
    prisma.sprint.create({ data: { projectId: project.id, name: "Sprint 1: 실전 안정화", startDate: "2026-04-19", endDate: "2026-05-02", status: "active",    goalDescription: "매매 0건 이슈 해소, 실전 모드 E2E 검증" } }),
    prisma.sprint.create({ data: { projectId: project.id, name: "Sprint 2: 백테스트 고도화", startDate: "2026-05-03", endDate: "2026-05-16", status: "planning", goalDescription: "옵티마이저 활용 전략 튜닝 + 1년치 전종목 백테스트" } }),
    prisma.sprint.create({ data: { projectId: project.id, name: "Sprint 3: 에이전트 협력", startDate: "2026-05-17", endDate: "2026-05-30", status: "planning", goalDescription: "멀티 에이전트 메시지 버스 + 장애 격리" } }),
    prisma.sprint.create({ data: { projectId: project.id, name: "Sprint 4: 관측성 & 운영", startDate: "2026-05-31", endDate: "2026-06-13", status: "planning", goalDescription: "대시보드 + 일일 리포트 + 자동 장애 복구" } }),
  ]);
  const [sp1, sp2, sp3, sp4] = sprints;

  // ─── 에픽 ──────────────────────────────────────────────────────
  const epics = await Promise.all([
    prisma.epic.create({ data: { projectId: project.id, name: "실전 안정화 & 매매 E2E 검증", priority: "urgent", status: "in_progress", sortOrder: 0 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "스크리닝 시스템 고도화", priority: "high", status: "todo", sortOrder: 1 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "백테스트 & 전략 최적화", priority: "high", status: "todo", sortOrder: 2 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "멀티 에이전트 시스템 고도화", priority: "high", status: "todo", sortOrder: 3 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "리스크 관리 강화", priority: "urgent", status: "todo", sortOrder: 4 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "관측성 & 대시보드", priority: "medium", status: "todo", sortOrder: 5 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "운영 자동화 & 인프라", priority: "medium", status: "todo", sortOrder: 6 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "테스트 & 품질 보증", priority: "medium", status: "todo", sortOrder: 7 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "문서화 & 지식 축적", priority: "low", status: "todo", sortOrder: 8 } }),
  ]);
  const [stab, screen, bt, agent, risk, obs, ops, qa, docs] = epics;

  // ─── 태스크 정의 (에픽/스프린트/라벨 매핑) ─────────────────────
  type TaskDef = {
    epicId: string;
    title: string;
    description?: string;
    priority: string;
    status?: string;
    estimatedHours?: number;
    sortOrder: number;
    sprintId?: string;
    labelNames?: string[];
  };

  const tasks: TaskDef[] = [
    // ─── Sprint 1 (실전 안정화 & 매매 E2E) ───
    { epicId: stab.id, title: "2026-03-03 매매 0건 원인 재검증 (Issues #11~#14)", description: "최근 수정된 패치가 실제 장 시간에 동작하는지 2일 연속 페이퍼 모니터링", priority: "urgent", status: "in_progress", estimatedHours: 6, sortOrder: 0, sprintId: sp1.id, labelNames: ["실전운영", "버그"] },
    { epicId: stab.id, title: "장 시작 09:00 동시호가 차단 로직 검증", description: "Issues #6~#8 패치 이후 동시호가 구간에서 주문 차단되는지 확인", priority: "urgent", estimatedHours: 3, sortOrder: 1, sprintId: sp1.id, labelNames: ["실전운영"] },
    { epicId: stab.id, title: "모의투자 → 실전 전환 체크리스트 작성 및 실행", description: "API URL 전환, Semaphore 조정, 주문 금액 축소 테스트", priority: "urgent", estimatedHours: 4, sortOrder: 2, sprintId: sp1.id, labelNames: ["실전운영"] },
    { epicId: stab.id, title: "실계좌 소액(100만원) 실전 거래 5영업일 운영", description: "일일 성과/이슈 기록, 예상외 동작 즉시 중단", priority: "urgent", estimatedHours: 10, sortOrder: 3, sprintId: sp1.id, labelNames: ["실전운영"] },
    { epicId: stab.id, title: "매매 실행 전 최종 검증 훅 추가 (pre-order guard)", description: "잔고/한도/중복주문 체크 pre-flight 강화", priority: "high", estimatedHours: 5, sortOrder: 4, sprintId: sp1.id, labelNames: ["리스크"] },
    { epicId: risk.id, title: "일일 손실 한도 초과 시 강제 종료 로직 재검증", description: "RiskManager 일일 손실 한도 실제 동작 테스트", priority: "urgent", estimatedHours: 3, sortOrder: 0, sprintId: sp1.id, labelNames: ["리스크"] },
    { epicId: risk.id, title: "텔레그램 /stop /status 명령어 구현", description: "원격 긴급 중단, 현재 상태 조회", priority: "high", estimatedHours: 4, sortOrder: 1, sprintId: sp1.id },

    // ─── Sprint 2 (백테스트 고도화) ───
    { epicId: bt.id, title: "2025 전종목 1년치 백테스트 실행 & 리포트", description: "KOSPI200 전종목, threshold 50/55/60 3가지 시나리오 비교", priority: "high", estimatedHours: 8, sortOrder: 0, sprintId: sp2.id, labelNames: ["백테스트"] },
    { epicId: bt.id, title: "run_optimizer.py 활용 파라미터 grid search", description: "진입/청산 임계값, 보유일, 손절/익절 최적화", priority: "high", estimatedHours: 10, sortOrder: 1, sprintId: sp2.id, labelNames: ["백테스트", "성능"] },
    { epicId: bt.id, title: "섹터별 성과 분석 리포트 추가", description: "반도체/2차전지/바이오 등 섹터별 WR/PF 분해", priority: "medium", estimatedHours: 6, sortOrder: 2, sprintId: sp2.id, labelNames: ["백테스트"] },
    { epicId: bt.id, title: "백테스트 엔진에 수급 데이터 반영 (현재 0 처리)", description: "KIS 과거 수급 데이터 수집 방법 리서치, 가능 시 반영", priority: "medium", estimatedHours: 8, sortOrder: 3, sprintId: sp2.id, labelNames: ["리서치"] },
    { epicId: bt.id, title: "Walk-forward 분석 구현", description: "Out-of-sample 검증으로 오버피팅 방지", priority: "medium", estimatedHours: 10, sortOrder: 4, sprintId: sp2.id, labelNames: ["백테스트"] },
    { epicId: screen.id, title: "뉴스 감성 분석 가중치 재튜닝", description: "10점 배점 적정성 검토, KoBERT 재학습 검토", priority: "medium", estimatedHours: 8, sortOrder: 0, sprintId: sp2.id, labelNames: ["리서치"] },
    { epicId: screen.id, title: "오버나이트 보너스 로직 실전 효과 측정", description: "+15~20점 가산이 실제 수익에 기여하는지 A/B", priority: "medium", estimatedHours: 5, sortOrder: 1, sprintId: sp2.id, labelNames: ["백테스트"] },

    // ─── Sprint 3 (에이전트 협력) ───
    { epicId: agent.id, title: "coordinator.py 에이전트 메시지 큐 구조 리팩토링", description: "현재 직접 호출 → asyncio.Queue 기반 이벤트 드리븐", priority: "high", estimatedHours: 12, sortOrder: 0, sprintId: sp3.id, labelNames: ["에이전트"] },
    { epicId: agent.id, title: "alpha_agent 신호 품질 로깅 및 분석", description: "각 에이전트 신호 정확도 측정 인프라", priority: "high", estimatedHours: 6, sortOrder: 1, sprintId: sp3.id, labelNames: ["에이전트"] },
    { epicId: agent.id, title: "risk_agent 단위 테스트 및 시나리오 검증", description: "포지션 한도/일일손실/집중투자 차단 검증", priority: "high", estimatedHours: 6, sortOrder: 2, sprintId: sp3.id, labelNames: ["에이전트", "리스크"] },
    { epicId: agent.id, title: "sentiment_agent → 뉴스 분석 실시간성 개선", description: "현재 배치 수집 → 실시간 스트림", priority: "medium", estimatedHours: 10, sortOrder: 3, sprintId: sp3.id, labelNames: ["에이전트"] },
    { epicId: agent.id, title: "execution_agent 주문 체결/실패 재시도 정책 표준화", description: "체결 대기/부분체결/실패 시나리오 매트릭스", priority: "high", estimatedHours: 6, sortOrder: 4, sprintId: sp3.id, labelNames: ["에이전트"] },
    { epicId: agent.id, title: "에이전트 장애 격리 (circuit breaker)", description: "한 에이전트 실패가 전체 시스템으로 전파되지 않도록", priority: "medium", estimatedHours: 8, sortOrder: 5, sprintId: sp3.id, labelNames: ["에이전트"] },
    { epicId: agent.id, title: "portfolio_agent 자산 배분 전략 정립", description: "종목별 비중 상한, 섹터 분산 규칙", priority: "medium", estimatedHours: 5, sortOrder: 6, sprintId: sp3.id, labelNames: ["에이전트", "리스크"] },

    // ─── Sprint 4 (관측성 & 운영) ───
    { epicId: obs.id, title: "실시간 대시보드 구축 (Streamlit 또는 FastAPI)", description: "포지션/PnL/시그널/에이전트 상태 단일 화면", priority: "high", estimatedHours: 15, sortOrder: 0, sprintId: sp4.id },
    { epicId: obs.id, title: "일일 거래 리포트 자동 생성 (텔레그램 발송)", description: "장 마감 후 당일 매매 요약 + KPI 현황", priority: "high", estimatedHours: 5, sortOrder: 1, sprintId: sp4.id },
    { epicId: obs.id, title: "구조화 로깅 (JSON) 및 로그 레벨 정비", description: "분석하기 쉬운 로그 포맷, ELK/Loki 수용 준비", priority: "medium", estimatedHours: 4, sortOrder: 2, sprintId: sp4.id },
    { epicId: obs.id, title: "에러 집계 및 Sentry 연동", description: "예외 자동 수집 + 반복 오류 감지", priority: "medium", estimatedHours: 3, sortOrder: 3, sprintId: sp4.id },
    { epicId: obs.id, title: "스크리닝 점수 분포 히스토그램 자동 출력", description: "일일 스크리닝 결과 시각화", priority: "low", estimatedHours: 3, sortOrder: 4, sprintId: sp4.id },
    { epicId: ops.id, title: "systemd 서비스 / launchd 자동 시작 설정", description: "장 시작 전 자동 기동, 장 마감 후 자동 종료", priority: "high", estimatedHours: 4, sortOrder: 0, sprintId: sp4.id },
    { epicId: ops.id, title: "API 토큰 24시간 자동 갱신 안정화", description: "토큰 만료 시 자동 재발급, 실패 시 알림", priority: "high", estimatedHours: 3, sortOrder: 1, sprintId: sp4.id, labelNames: ["실전운영"] },
    { epicId: ops.id, title: "PostgreSQL 거래 내역 저장 레이어", description: "trade_history 테이블, 매매 전체 이력 DB화", priority: "medium", estimatedHours: 8, sortOrder: 2, sprintId: sp4.id },

    // ─── 백로그 (스프린트 미배정) ───
    { epicId: screen.id, title: "ML 기반 종목 선정 프로토타입 (XGBoost)", description: "현재 룰 기반 100점 → ML 스코어링 병행", priority: "low", estimatedHours: 20, sortOrder: 2, labelNames: ["리서치"] },
    { epicId: screen.id, title: "실시간 차트 패턴 인식 (컵앤핸들/헤드앤숄더)", description: "이미지 기반 또는 특징 벡터 기반", priority: "low", estimatedHours: 15, sortOrder: 3, labelNames: ["리서치"] },
    { epicId: bt.id, title: "Monte Carlo 시뮬레이션으로 전략 robustness 평가", description: "매매 순서 shuffle 1000회 시뮬레이션", priority: "low", estimatedHours: 8, sortOrder: 5, labelNames: ["백테스트"] },
    { epicId: risk.id, title: "코스피 지수 급락 시 자동 포지션 정리 로직", description: "전일 대비 -3% 시 모든 포지션 청산", priority: "medium", estimatedHours: 5, sortOrder: 2, labelNames: ["리스크"] },
    { epicId: risk.id, title: "트레일링 스탑 구현 (현재 없음)", description: "수익 도달 후 고점 대비 -X% 하락 시 청산", priority: "high", estimatedHours: 6, sortOrder: 3, labelNames: ["리스크"] },
    { epicId: risk.id, title: "종목별 ATR 기반 동적 손절 라인", description: "변동성 큰 종목일수록 넓은 손절폭", priority: "medium", estimatedHours: 5, sortOrder: 4, labelNames: ["리스크"] },
    { epicId: qa.id, title: "pytest 단위 테스트 커버리지 70% 달성", description: "core/strategy/risk/backtest 모듈 중심", priority: "medium", estimatedHours: 15, sortOrder: 0 },
    { epicId: qa.id, title: "KIS API mock 통합 테스트 환경 구축", description: "실제 API 호출 없이 통합 테스트 가능하도록", priority: "medium", estimatedHours: 8, sortOrder: 1 },
    { epicId: qa.id, title: "GitHub Actions CI에 lint + test 자동 실행", description: "ruff + pytest, PR 시 자동 검증", priority: "medium", estimatedHours: 3, sortOrder: 2 },
    { epicId: qa.id, title: "백테스트 결과 골든 스냅샷 테스트", description: "주요 파라미터 조합의 결과 고정, 회귀 감지", priority: "low", estimatedHours: 4, sortOrder: 3, labelNames: ["백테스트"] },
    { epicId: docs.id, title: "ARCHITECTURE.md 작성 (에이전트 간 관계도)", description: "coordinator/alpha/risk/execution 흐름 다이어그램", priority: "medium", estimatedHours: 4, sortOrder: 0 },
    { epicId: docs.id, title: "운영 런북 작성 (장애 시 대응 절차)", description: "API 장애/토큰 만료/매매 0건 등 시나리오별 대응", priority: "high", estimatedHours: 4, sortOrder: 1, labelNames: ["실전운영"] },
    { epicId: docs.id, title: "전략 설명 문서 (스크리닝 100점 체계)", description: "신규 참여자/미래의 나를 위한 설명", priority: "low", estimatedHours: 3, sortOrder: 2 },
    { epicId: docs.id, title: "PDCA 사이클 정기 리뷰 프로세스 수립", description: "docs/01-plan ~ 03-analysis 주간 업데이트", priority: "low", estimatedHours: 2, sortOrder: 3 },
  ];

  // ─── 태스크 생성 + 라벨 연결 ─────────────────────────────────────
  for (const t of tasks) {
    const { labelNames, sprintId, ...rest } = t;
    const task = await prisma.task.create({ data: { projectId: project.id, ...rest } });

    if (sprintId) {
      await prisma.sprintTask.create({ data: { sprintId, taskId: task.id } });
    }
    if (labelNames) {
      for (const name of labelNames) {
        const labelId = labels[name];
        if (labelId) await prisma.taskLabel.create({ data: { taskId: task.id, labelId } });
      }
    }
  }

  console.log("✅ KIS Auto Trader 프로젝트 생성 완료");
  console.log(`   - 에픽: ${epics.length}개`);
  console.log(`   - 스프린트: ${sprints.length}개 (2주 단위)`);
  console.log(`   - 태스크: ${tasks.length}개`);
  console.log(`   - 마일스톤: 4개`);
  console.log(`   - KPI: 8개`);
  console.log(`   - Goal: 1개`);
  console.log(`   - 라벨: ${Object.keys(labels).length}개`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
