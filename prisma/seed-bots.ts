import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "트레이딩 봇",
      description: "코인봇 & 한국투자증권 자동매매 봇",
      color: "#6366f1",
      icon: "🤖",
    },
  });

  // ─── 코인봇 프로젝트 ───────────────────────────────────────────
  const coinProject = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "코인봇",
      description: "암호화폐 자동매매 봇 (업비트/빗썸)",
      status: "active",
      color: "#f59e0b",
    },
  });

  const coinEpics = await Promise.all([
    prisma.epic.create({ data: { projectId: coinProject.id, name: "거래소 API 연동", priority: "urgent", status: "todo", sortOrder: 0 } }),
    prisma.epic.create({ data: { projectId: coinProject.id, name: "자동매매 전략", priority: "high", status: "todo", sortOrder: 1 } }),
    prisma.epic.create({ data: { projectId: coinProject.id, name: "리스크 관리", priority: "high", status: "todo", sortOrder: 2 } }),
    prisma.epic.create({ data: { projectId: coinProject.id, name: "백테스팅 시스템", priority: "medium", status: "todo", sortOrder: 3 } }),
    prisma.epic.create({ data: { projectId: coinProject.id, name: "모니터링 & 알림", priority: "medium", status: "todo", sortOrder: 4 } }),
  ]);

  const [apiEpic, strategyEpic, riskEpic, backtestEpic, monitorEpic] = coinEpics;

  const coinTasks = [
    // 거래소 API 연동
    { epicId: apiEpic.id, title: "업비트 API 키 발급 및 환경변수 설정", priority: "urgent", status: "todo", sortOrder: 0 },
    { epicId: apiEpic.id, title: "업비트 REST API 클라이언트 구현 (잔고/시세/주문)", priority: "urgent", status: "todo", sortOrder: 1 },
    { epicId: apiEpic.id, title: "업비트 WebSocket 실시간 시세 수신 구현", priority: "high", status: "todo", sortOrder: 2 },
    { epicId: apiEpic.id, title: "빗썸 API 연동 (선택)", priority: "low", status: "todo", sortOrder: 3 },
    { epicId: apiEpic.id, title: "API 요청 rate limit 핸들링", priority: "high", status: "todo", sortOrder: 4 },
    { epicId: apiEpic.id, title: "API 에러 재시도 로직 구현", priority: "medium", status: "todo", sortOrder: 5 },

    // 자동매매 전략
    { epicId: strategyEpic.id, title: "RSI 지표 계산 및 매매 신호 구현", priority: "high", status: "todo", sortOrder: 0 },
    { epicId: strategyEpic.id, title: "이동평균선(SMA/EMA) 골든크로스 전략 구현", priority: "high", status: "todo", sortOrder: 1 },
    { epicId: strategyEpic.id, title: "볼린저 밴드 전략 구현", priority: "medium", status: "todo", sortOrder: 2 },
    { epicId: strategyEpic.id, title: "전략 조합 및 가중치 설정 시스템", priority: "medium", status: "todo", sortOrder: 3 },
    { epicId: strategyEpic.id, title: "매매 신호 필터링 (거래량 조건)", priority: "medium", status: "todo", sortOrder: 4 },
    { epicId: strategyEpic.id, title: "전략별 파라미터 설정 파일 구성", priority: "low", status: "todo", sortOrder: 5 },

    // 리스크 관리
    { epicId: riskEpic.id, title: "종목별 손절매 라인 설정 및 자동 주문", priority: "urgent", status: "todo", sortOrder: 0 },
    { epicId: riskEpic.id, title: "익절 목표가 설정 및 자동 주문", priority: "urgent", status: "todo", sortOrder: 1 },
    { epicId: riskEpic.id, title: "일일 최대 손실 한도 초과 시 거래 중단", priority: "high", status: "todo", sortOrder: 2 },
    { epicId: riskEpic.id, title: "포지션 사이징 (자산 대비 비중 제한)", priority: "high", status: "todo", sortOrder: 3 },
    { epicId: riskEpic.id, title: "트레일링 스탑 구현", priority: "medium", status: "todo", sortOrder: 4 },

    // 백테스팅
    { epicId: backtestEpic.id, title: "업비트 과거 캔들 데이터 수집 스크립트", priority: "high", status: "todo", sortOrder: 0 },
    { epicId: backtestEpic.id, title: "백테스트 엔진 구현 (수수료/슬리피지 반영)", priority: "high", status: "todo", sortOrder: 1 },
    { epicId: backtestEpic.id, title: "성과 지표 계산 (수익률, 샤프비율, MDD)", priority: "medium", status: "todo", sortOrder: 2 },
    { epicId: backtestEpic.id, title: "전략별 백테스트 결과 비교 리포트", priority: "medium", status: "todo", sortOrder: 3 },
    { epicId: backtestEpic.id, title: "파라미터 최적화 (그리드 서치)", priority: "low", status: "todo", sortOrder: 4 },

    // 모니터링 & 알림
    { epicId: monitorEpic.id, title: "텔레그램 봇 연동 및 기본 알림 구현", priority: "high", status: "todo", sortOrder: 0 },
    { epicId: monitorEpic.id, title: "매수/매도 체결 시 텔레그램 알림", priority: "high", status: "todo", sortOrder: 1 },
    { epicId: monitorEpic.id, title: "에러/비정상 상황 즉시 알림", priority: "high", status: "todo", sortOrder: 2 },
    { epicId: monitorEpic.id, title: "일일 수익 요약 리포트 자동 발송", priority: "medium", status: "todo", sortOrder: 3 },
    { epicId: monitorEpic.id, title: "실시간 포트폴리오 현황 조회 명령어", priority: "medium", status: "todo", sortOrder: 4 },
    { epicId: monitorEpic.id, title: "봇 상태 헬스체크 및 자동 재시작", priority: "medium", status: "todo", sortOrder: 5 },
    { epicId: monitorEpic.id, title: "거래 내역 DB 로깅 및 조회", priority: "low", status: "todo", sortOrder: 6 },
  ];

  for (const task of coinTasks) {
    await prisma.task.create({ data: { projectId: coinProject.id, ...task } });
  }

  // ─── 한국투자증권 투자봇 프로젝트 ─────────────────────────────
  const kisProject = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "한국투자증권 투자봇",
      description: "KIS OpenAPI 기반 국내/해외 주식 자동매매 봇",
      status: "active",
      color: "#3b82f6",
    },
  });

  const kisEpics = await Promise.all([
    prisma.epic.create({ data: { projectId: kisProject.id, name: "KIS OpenAPI 연동", priority: "urgent", status: "todo", sortOrder: 0 } }),
    prisma.epic.create({ data: { projectId: kisProject.id, name: "자동매매 주문 실행", priority: "high", status: "todo", sortOrder: 1 } }),
    prisma.epic.create({ data: { projectId: kisProject.id, name: "종목 스크리닝", priority: "high", status: "todo", sortOrder: 2 } }),
    prisma.epic.create({ data: { projectId: kisProject.id, name: "포트폴리오 관리", priority: "medium", status: "todo", sortOrder: 3 } }),
    prisma.epic.create({ data: { projectId: kisProject.id, name: "리스크 & 모니터링", priority: "medium", status: "todo", sortOrder: 4 } }),
  ]);

  const [kisApiEpic, orderEpic, screenEpic, portfolioEpic, kisRiskEpic] = kisEpics;

  const kisTasks = [
    // KIS OpenAPI 연동
    { epicId: kisApiEpic.id, title: "한국투자증권 OpenAPI 계좌 등록 및 앱키 발급", priority: "urgent", status: "todo", sortOrder: 0 },
    { epicId: kisApiEpic.id, title: "OAuth2 액세스 토큰 발급 및 자동 갱신 구현", priority: "urgent", status: "todo", sortOrder: 1 },
    { epicId: kisApiEpic.id, title: "국내 주식 현재가/호가 조회 API 연동", priority: "urgent", status: "todo", sortOrder: 2 },
    { epicId: kisApiEpic.id, title: "국내 주식 잔고 조회 API 연동", priority: "high", status: "todo", sortOrder: 3 },
    { epicId: kisApiEpic.id, title: "실시간 체결가 WebSocket 구독 구현", priority: "high", status: "todo", sortOrder: 4 },
    { epicId: kisApiEpic.id, title: "해외 주식(미국) API 연동", priority: "medium", status: "todo", sortOrder: 5 },
    { epicId: kisApiEpic.id, title: "모의투자 계좌 연동 및 테스트 환경 구성", priority: "high", status: "todo", sortOrder: 6 },

    // 자동매매 주문 실행
    { epicId: orderEpic.id, title: "국내 주식 시장가 매수/매도 주문 구현", priority: "urgent", status: "todo", sortOrder: 0 },
    { epicId: orderEpic.id, title: "국내 주식 지정가 주문 구현", priority: "high", status: "todo", sortOrder: 1 },
    { epicId: orderEpic.id, title: "주문 체결 상태 모니터링 및 미체결 처리", priority: "high", status: "todo", sortOrder: 2 },
    { epicId: orderEpic.id, title: "주문 취소/정정 API 구현", priority: "medium", status: "todo", sortOrder: 3 },
    { epicId: orderEpic.id, title: "분할 매수 로직 구현 (DCA 전략)", priority: "medium", status: "todo", sortOrder: 4 },
    { epicId: orderEpic.id, title: "장 시작/종료 시간 체크 및 주문 차단", priority: "high", status: "todo", sortOrder: 5 },

    // 종목 스크리닝
    { epicId: screenEpic.id, title: "재무 데이터 수집 (PER, PBR, ROE)", priority: "medium", status: "todo", sortOrder: 0 },
    { epicId: screenEpic.id, title: "기술적 지표 기반 스크리닝 (RSI, MACD)", priority: "high", status: "todo", sortOrder: 1 },
    { epicId: screenEpic.id, title: "거래량 급증 종목 탐지 알고리즘", priority: "high", status: "todo", sortOrder: 2 },
    { epicId: screenEpic.id, title: "DART 공시 수집 및 파싱", priority: "medium", status: "todo", sortOrder: 3 },
    { epicId: screenEpic.id, title: "네이버/카카오 뉴스 크롤링 및 감성 분석", priority: "low", status: "todo", sortOrder: 4 },
    { epicId: screenEpic.id, title: "관심 종목 리스트 관리 및 알림 설정", priority: "medium", status: "todo", sortOrder: 5 },

    // 포트폴리오 관리
    { epicId: portfolioEpic.id, title: "목표 자산 배분 비율 설정 시스템", priority: "high", status: "todo", sortOrder: 0 },
    { epicId: portfolioEpic.id, title: "자동 리밸런싱 로직 구현", priority: "high", status: "todo", sortOrder: 1 },
    { epicId: portfolioEpic.id, title: "손실 확정 매도 (세금 최적화) 로직", priority: "medium", status: "todo", sortOrder: 2 },
    { epicId: portfolioEpic.id, title: "보유 종목 수익률 집계 및 대시보드", priority: "medium", status: "todo", sortOrder: 3 },
    { epicId: portfolioEpic.id, title: "배당금 수령 내역 추적", priority: "low", status: "todo", sortOrder: 4 },
    { epicId: portfolioEpic.id, title: "월간/연간 성과 리포트 자동 생성", priority: "medium", status: "todo", sortOrder: 5 },

    // 리스크 & 모니터링
    { epicId: kisRiskEpic.id, title: "종목별 손절 라인 설정 및 자동 매도", priority: "urgent", status: "todo", sortOrder: 0 },
    { epicId: kisRiskEpic.id, title: "포트폴리오 전체 손실 한도 관리", priority: "high", status: "todo", sortOrder: 1 },
    { epicId: kisRiskEpic.id, title: "집중 투자 방지 (단일 종목 비중 상한)", priority: "high", status: "todo", sortOrder: 2 },
    { epicId: kisRiskEpic.id, title: "텔레그램 알림 봇 연동 (매매/에러)", priority: "high", status: "todo", sortOrder: 3 },
    { epicId: kisRiskEpic.id, title: "일일 거래 요약 자동 발송", priority: "medium", status: "todo", sortOrder: 4 },
    { epicId: kisRiskEpic.id, title: "API 장애 감지 및 거래 중단 처리", priority: "high", status: "todo", sortOrder: 5 },
    { epicId: kisRiskEpic.id, title: "거래 전체 이력 로깅 및 감사 추적", priority: "medium", status: "todo", sortOrder: 6 },
  ];

  for (const task of kisTasks) {
    await prisma.task.create({ data: { projectId: kisProject.id, ...task } });
  }

  console.log("✅ 코인봇 & 한국투자증권 투자봇 태스크 생성 완료");
  console.log(`   - 코인봇: ${coinTasks.length}개 태스크`);
  console.log(`   - 한국투자증권 투자봇: ${kisTasks.length}개 태스크`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
