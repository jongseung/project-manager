import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ORG_ID = "cmo3mzab9000dqdmee5e5av28";

  // 기존 "트레이딩 봇" 워크스페이스 조회
  const workspace = await prisma.workspace.findFirst({
    where: { name: "트레이딩 봇", organizationId: ORG_ID },
  });
  if (!workspace) throw new Error("트레이딩 봇 워크스페이스 없음");

  // 기존 "코인봇" 프로젝트 삭제 (cascade로 Epic/Task 모두 삭제)
  await prisma.project.deleteMany({
    where: { workspaceId: workspace.id, name: "코인봇" },
  });

  // ─── 실제 프로젝트: Auto Coin Bot (SMC) ───────────────────────
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Auto Coin Bot (SMC)",
      description: "바이낸스 선물 SMC 자동매매 봇 — v7 운영/고도화 (Python, Docker, GitHub Actions)",
      status: "active",
      color: "#f59e0b",
      startDate: "2026-02-14",
    },
  });

  // ─── 마일스톤 ──────────────────────────────────────────────────
  await prisma.milestone.createMany({
    data: [
      { projectId: project.id, name: "v7 안정화 완료", description: "실거래 2주 운영 결과 WR 60%+ / MDD 10% 이하 달성", targetDate: "2026-05-10", status: "pending", sortOrder: 0 },
      { projectId: project.id, name: "v8 전략 리서치 완료", description: "멀티 타임프레임 + ML 기반 regime 분류기 프로토타입", targetDate: "2026-06-15", status: "pending", sortOrder: 1 },
      { projectId: project.id, name: "관측성 대시보드 런칭", description: "실시간 포지션/PnL 대시보드 + Grafana 메트릭", targetDate: "2026-05-25", status: "pending", sortOrder: 2 },
      { projectId: project.id, name: "자산 1.5배 달성", description: "누적 수익률 기반", targetDate: "2026-08-01", status: "pending", sortOrder: 3 },
    ],
  });

  // ─── KPI ───────────────────────────────────────────────────────
  await prisma.kPI.createMany({
    data: [
      { projectId: project.id, name: "월간 수익률", unit: "%", targetValue: 8, currentValue: 0, direction: "increase" },
      { projectId: project.id, name: "승률 (Win Rate)", unit: "%", targetValue: 65, currentValue: 0, direction: "increase" },
      { projectId: project.id, name: "최대 낙폭 (MDD)", unit: "%", targetValue: 10, currentValue: 0, direction: "decrease" },
      { projectId: project.id, name: "Profit Factor", unit: "배", targetValue: 1.8, currentValue: 0, direction: "increase" },
      { projectId: project.id, name: "일평균 거래 횟수", unit: "회", targetValue: 3, currentValue: 0, direction: "increase" },
    ],
  });

  // ─── 에픽 ──────────────────────────────────────────────────────
  const epics = await Promise.all([
    prisma.epic.create({ data: { projectId: project.id, name: "v7 안정화 & 실전 검증", priority: "urgent", status: "in_progress", sortOrder: 0 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "리스크 관리 고도화", priority: "urgent", status: "todo", sortOrder: 1 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "전략 최적화 & 신규 개발", priority: "high", status: "todo", sortOrder: 2 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "관측성 & 모니터링", priority: "high", status: "todo", sortOrder: 3 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "데이터 파이프라인 & 분석", priority: "medium", status: "todo", sortOrder: 4 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "인프라 & DevOps", priority: "medium", status: "todo", sortOrder: 5 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "테스트 & 품질", priority: "medium", status: "todo", sortOrder: 6 } }),
    prisma.epic.create({ data: { projectId: project.id, name: "문서화 & 지식 관리", priority: "low", status: "todo", sortOrder: 7 } }),
  ]);

  const [stabilize, risk, strategy, observ, data, infra, test, docs] = epics;

  const tasks: Array<{
    epicId: string;
    title: string;
    description?: string;
    priority: string;
    status?: string;
    estimatedHours?: number;
    sortOrder: number;
  }> = [
    // ─── v7 안정화 & 실전 검증 ───
    { epicId: stabilize.id, title: "v7 실거래 2주 모니터링 (일일 PnL/포지션 체크)", description: "서버 로그 + DB trade_history 매일 검토, 이상 패턴 즉시 대응", priority: "urgent", status: "in_progress", estimatedHours: 10, sortOrder: 0 },
    { epicId: stabilize.id, title: "v7 vs v6.1 실전 성과 비교 리포트", description: "trade_history 테이블 기반 WR/PF/MDD 비교 분석 문서 작성", priority: "high", estimatedHours: 4, sortOrder: 1 },
    { epicId: stabilize.id, title: "이상 청산 패턴 조사 (exchange_closed 재발 확인)", description: "v6.1에서 해결했던 폭탄 손실 재발 여부 점검", priority: "urgent", estimatedHours: 3, sortOrder: 2 },
    { epicId: stabilize.id, title: "멀티 심볼 동시 포지션 안정성 검증", description: "BTC/ETH/SOL 동시 진입 시 잔고 부족, 레이스 컨디션 체크", priority: "high", estimatedHours: 5, sortOrder: 3 },
    { epicId: stabilize.id, title: "티커 스캐너 자동 종목 선정 품질 평가", description: "스캔된 종목의 실제 거래 후 성과 역추적", priority: "medium", estimatedHours: 4, sortOrder: 4 },

    // ─── 리스크 관리 고도화 ───
    { epicId: risk.id, title: "ATR 기반 동적 포지션 사이징 재검토", description: "현재 RISK_PER_TRADE 3% 고정 → 변동성 기반 조정", priority: "urgent", estimatedHours: 6, sortOrder: 0 },
    { epicId: risk.id, title: "연속 손실 시 자동 쿨다운 로직 추가", description: "3연속 손절 시 N시간 거래 중단", priority: "high", estimatedHours: 3, sortOrder: 1 },
    { epicId: risk.id, title: "FOMC/CPI 등 고변동성 이벤트 자동 회피", description: "경제 지표 캘린더 연동, 이벤트 전후 거래 차단", priority: "high", estimatedHours: 6, sortOrder: 2 },
    { epicId: risk.id, title: "계정 단위 최대 노출 한도 (total exposure cap)", description: "멀티 포지션 합산 노출 한도 설정", priority: "high", estimatedHours: 4, sortOrder: 3 },
    { epicId: risk.id, title: "킬 스위치 원격 제어 (텔레그램 명령)", description: "/stop, /resume 명령으로 봇 즉시 중단/재개", priority: "medium", estimatedHours: 4, sortOrder: 4 },
    { epicId: risk.id, title: "거래소 연결 장애 시 포지션 보호 로직 강화", description: "API timeout/rate limit 시 안전 모드 진입", priority: "high", estimatedHours: 5, sortOrder: 5 },

    // ─── 전략 최적화 & 신규 개발 ───
    { epicId: strategy.id, title: "전략별 per-symbol 파라미터 재최적화", description: "BTC/ETH/SOL/알트별 RSI/EMA/ATR 파라미터 grid search", priority: "high", estimatedHours: 10, sortOrder: 0 },
    { epicId: strategy.id, title: "Regime 분류기 정확도 개선 (trending/ranging)", description: "현재 룰 기반 → ADX + Bollinger squeeze + 히스토그램", priority: "high", estimatedHours: 8, sortOrder: 1 },
    { epicId: strategy.id, title: "멀티 타임프레임 확인 (15m + 1h + 4h)", description: "상위 TF 추세 확인 후 진입", priority: "high", estimatedHours: 12, sortOrder: 2 },
    { epicId: strategy.id, title: "Liquidity Sweep 전략 정확도 개선", description: "가짜 sweep 필터링 (즉시 회귀 조건)", priority: "medium", estimatedHours: 6, sortOrder: 3 },
    { epicId: strategy.id, title: "Breaker Block 전략 백테스트 보강", description: "실거래 성과 저조 → 조건 재검증", priority: "medium", estimatedHours: 6, sortOrder: 4 },
    { epicId: strategy.id, title: "ML 기반 regime 분류 프로토타입 (v8 리서치)", description: "XGBoost로 trending/ranging/volatile 분류", priority: "low", estimatedHours: 20, sortOrder: 5 },
    { epicId: strategy.id, title: "Signal aggregator 가중치 자동 조정 (베이지안)", description: "전략별 최근 성과에 따라 가중치 실시간 재계산", priority: "low", estimatedHours: 15, sortOrder: 6 },

    // ─── 관측성 & 모니터링 ───
    { epicId: observ.id, title: "Streamlit 실시간 대시보드 재가동", description: "포지션 현황, 당일 PnL, 최근 시그널 실시간 표시", priority: "high", estimatedHours: 8, sortOrder: 0 },
    { epicId: observ.id, title: "Grafana + Prometheus 메트릭 연동", description: "봇 내부 상태 (시그널/체결/에러) 메트릭화", priority: "medium", estimatedHours: 10, sortOrder: 1 },
    { epicId: observ.id, title: "텔레그램 일일 리포트 고도화", description: "전략별 PnL, WR, 최대 연속승/패 요약", priority: "medium", estimatedHours: 4, sortOrder: 2 },
    { epicId: observ.id, title: "슬랙/디스코드 이중 알림 채널", description: "텔레그램 장애 시 대체 채널", priority: "low", estimatedHours: 3, sortOrder: 3 },
    { epicId: observ.id, title: "에러 분류 및 Sentry 연동", description: "예외 자동 수집, 반복 에러 감지", priority: "medium", estimatedHours: 4, sortOrder: 4 },
    { epicId: observ.id, title: "전략 감사 로그 분석 자동화", description: "최근 커밋의 observability 로그 기반 리포트 생성", priority: "medium", estimatedHours: 5, sortOrder: 5 },

    // ─── 데이터 파이프라인 & 분석 ───
    { epicId: data.id, title: "trade_history DB 스키마 확장 (전략 메타 컬럼)", description: "진입 컨플루언스 점수, regime, 전략 신뢰도 저장", priority: "high", estimatedHours: 4, sortOrder: 0 },
    { epicId: data.id, title: "OHLCV 데이터 로컬 캐시 (백테스트 가속)", description: "DuckDB/Parquet로 캔들 데이터 저장", priority: "medium", estimatedHours: 6, sortOrder: 1 },
    { epicId: data.id, title: "월간 성과 리포트 자동 생성 파이프라인", description: "매월 1일 PDF/HTML 리포트 자동 생성 및 발송", priority: "medium", estimatedHours: 8, sortOrder: 2 },
    { epicId: data.id, title: "청산/펀딩비 데이터 수집 연구", description: "whale/liquidation 모듈 활용도 향상", priority: "low", estimatedHours: 8, sortOrder: 3 },
    { epicId: data.id, title: "온체인 데이터 통합 PoC (glassnode/cryptoquant)", description: "기관 흐름 시그널 후보", priority: "low", estimatedHours: 15, sortOrder: 4 },

    // ─── 인프라 & DevOps ───
    { epicId: infra.id, title: "GitHub Actions 배포 파이프라인 안정화", description: "실패 시 자동 롤백, 배포 전 헬스체크", priority: "high", estimatedHours: 5, sortOrder: 0 },
    { epicId: infra.id, title: "Docker 이미지 경량화 (multi-stage build)", description: "현재 이미지 크기 축소, 시작 시간 단축", priority: "low", estimatedHours: 3, sortOrder: 1 },
    { epicId: infra.id, title: "서버 자동 재시작 & 헬스체크 강화", description: "컨테이너 죽음 감지 시 즉시 복구 + 알림", priority: "high", estimatedHours: 4, sortOrder: 2 },
    { epicId: infra.id, title: "백업 자동화 (DB 스냅샷 + journal)", description: "일일 백업, 7일 보관", priority: "medium", estimatedHours: 4, sortOrder: 3 },
    { epicId: infra.id, title: "API 키/시크릿 로테이션 정책 수립", description: "Binance API 키 정기 교체 프로세스", priority: "medium", estimatedHours: 2, sortOrder: 4 },
    { epicId: infra.id, title: "서버 리소스 모니터링 (CPU/메모리/디스크)", description: "임계치 초과 시 텔레그램 알림", priority: "medium", estimatedHours: 3, sortOrder: 5 },

    // ─── 테스트 & 품질 ───
    { epicId: test.id, title: "기존 테스트 스위트 실행 및 커버리지 측정", description: "test_strategies, test_signal_aggregator 등", priority: "high", estimatedHours: 3, sortOrder: 0 },
    { epicId: test.id, title: "Signal Aggregator 주요 엣지케이스 테스트 추가", description: "극단적 변동성, 데이터 결측 시나리오", priority: "high", estimatedHours: 6, sortOrder: 1 },
    { epicId: test.id, title: "SL/TP 주문 Fallback 체인 통합 테스트", description: "거래소 API mock으로 3단 fallback 검증", priority: "high", estimatedHours: 5, sortOrder: 2 },
    { epicId: test.id, title: "백테스터 엔진 수수료/슬리피지 정확도 검증", description: "실거래 체결가와 백테스트 가정 비교", priority: "medium", estimatedHours: 5, sortOrder: 3 },
    { epicId: test.id, title: "CI 파이프라인에 pytest 자동 실행 추가", description: "PR 시 테스트 통과 강제", priority: "medium", estimatedHours: 2, sortOrder: 4 },

    // ─── 문서화 & 지식 관리 ───
    { epicId: docs.id, title: "README v7 버전 업데이트", description: "현재 v4 수준으로 남아있음, 최신 구조 반영", priority: "medium", estimatedHours: 3, sortOrder: 0 },
    { epicId: docs.id, title: "전략별 개요 문서 작성 (strategies/README.md)", description: "각 전략 개념, 파라미터, 성과 표준 형식", priority: "medium", estimatedHours: 6, sortOrder: 1 },
    { epicId: docs.id, title: "운영 런북 (Runbook) 작성", description: "장애 시 대응 절차, 긴급 중단, 복구 순서", priority: "high", estimatedHours: 4, sortOrder: 2 },
    { epicId: docs.id, title: "TRADE_ANALYSIS_LOG.md 정기 업데이트 프로세스 정립", description: "주간 분석 → 문서 반영 루틴", priority: "low", estimatedHours: 2, sortOrder: 3 },
    { epicId: docs.id, title: "v8 로드맵 문서 초안 작성", description: "ML regime 분류, 멀티 TF, 자동 가중치 조정 등", priority: "low", estimatedHours: 3, sortOrder: 4 },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: { projectId: project.id, ...t } });
  }

  // ─── 라벨 생성 ─────────────────────────────────────────────────
  const existingLabels = await prisma.label.findMany({ where: { workspaceId: workspace.id } });
  const needLabels = ["실전운영", "리서치", "버그", "성능", "리스크"];
  for (const name of needLabels) {
    if (!existingLabels.find(l => l.name === name)) {
      await prisma.label.create({
        data: { workspaceId: workspace.id, name, color: name === "버그" ? "#ef4444" : name === "리스크" ? "#f59e0b" : "#6366f1" },
      });
    }
  }

  console.log("✅ Auto Coin Bot (SMC) 프로젝트 생성 완료");
  console.log(`   - 에픽: ${epics.length}개`);
  console.log(`   - 태스크: ${tasks.length}개`);
  console.log(`   - 마일스톤: 4개`);
  console.log(`   - KPI: 5개`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
