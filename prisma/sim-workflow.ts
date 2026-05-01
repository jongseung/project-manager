/**
 * 반도체 CMP팀 실제 업무 워크플로우 시뮬레이션
 *
 * 시나리오: 삼성/SK 수준의 반도체 FAB에서 CMP(Chemical Mechanical Polishing) 공정팀
 *
 * 팀 구성:
 * - 박팀장: CMP 공정팀 리드, 장비 자동화 + 데이터 분석 총괄
 * - 김민수: 백엔드/인프라 개발 (장비 인터페이스, 데이터 파이프라인)
 * - 이지연: 프론트엔드 (대시보드, 알림 시스템 UI)
 * - 정대리: QA/데이터 분석 (품질 검증, 공정 데이터 분석)
 * - 최사원: 주니어 (운영 지원, 문서화, 테스트)
 *
 * 프로젝트:
 * 1. CMP 실시간 모니터링 시스템 v2 (대형 - 3개월)
 * 2. Wafer 불량률 예측 AI 모델 (중형 - 2개월)
 * 3. 공정 표준화 & SOP 자동화 (소형 - 1개월)
 */

import { PrismaClient } from "@prisma/client";
import { format, addDays, subDays, addWeeks } from "date-fns";

const db = new PrismaClient();

async function simulate() {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  console.log("═══════════════════════════════════════════");
  console.log("  반도체 CMP팀 업무 워크플로우 시뮬레이션");
  console.log("═══════════════════════════════════════════\n");

  // ═══════════════════════════════════════
  // STEP 1: 관리자(박팀장)가 팀원 등록
  // UI: Settings > Members > Add Member
  // ═══════════════════════════════════════
  console.log("📋 STEP 1: 팀원 등록 (Settings > Members)");

  const park = await db.member.create({ data: { name: "박팀장", role: "CMP공정팀 리드", email: "park.lead@fab.com", color: "#6366f1" } });
  const kim = await db.member.create({ data: { name: "김민수", role: "백엔드/인프라 개발", email: "kim.ms@fab.com", color: "#3b82f6" } });
  const lee = await db.member.create({ data: { name: "이지연", role: "프론트엔드 개발", email: "lee.jy@fab.com", color: "#ec4899" } });
  const jung = await db.member.create({ data: { name: "정대리", role: "QA/데이터 분석", email: "jung.qc@fab.com", color: "#f59e0b" } });
  const choi = await db.member.create({ data: { name: "최사원", role: "운영 지원", email: "choi.jr@fab.com", color: "#10b981" } });
  console.log("  ✅ 5명 등록: 박팀장, 김민수, 이지연, 정대리, 최사원\n");

  // ═══════════════════════════════════════
  // STEP 2: 워크스페이스 생성
  // UI: Workspaces > Create Workspace
  // ═══════════════════════════════════════
  console.log("📋 STEP 2: 워크스페이스 생성 (Workspaces)");

  const ws = await db.workspace.create({
    data: { name: "CMP 공정팀", description: "CMP(Chemical Mechanical Polishing) 장비 자동화 및 공정 최적화", color: "#6366f1", icon: "🏭" },
  });
  console.log("  ✅ 워크스페이스: CMP 공정팀\n");

  // ═══════════════════════════════════════
  // STEP 3: 라벨 생성
  // UI: Workspace Settings > Labels
  // ═══════════════════════════════════════
  console.log("📋 STEP 3: 라벨 생성");

  const lblBackend = await db.label.create({ data: { workspaceId: ws.id, name: "Backend", color: "#3b82f6" } });
  const lblFrontend = await db.label.create({ data: { workspaceId: ws.id, name: "Frontend", color: "#8b5cf6" } });
  const lblInfra = await db.label.create({ data: { workspaceId: ws.id, name: "Infra", color: "#14b8a6" } });
  const lblData = await db.label.create({ data: { workspaceId: ws.id, name: "Data", color: "#f59e0b" } });
  const lblUrgent = await db.label.create({ data: { workspaceId: ws.id, name: "긴급", color: "#ef4444" } });
  const lblBlocked = await db.label.create({ data: { workspaceId: ws.id, name: "Blocked", color: "#6b7280" } });
  const lblReview = await db.label.create({ data: { workspaceId: ws.id, name: "Review필요", color: "#a855f7" } });
  console.log("  ✅ 7개 라벨 생성\n");

  // ═══════════════════════════════════════
  // STEP 4: 프로젝트 1 - CMP 실시간 모니터링 시스템 v2
  // UI: Workspace > Create Project (Full Planning 모드)
  // 관리자가 인셉션 필드를 채움
  // ═══════════════════════════════════════
  console.log("📋 STEP 4: 프로젝트 생성 (Full Planning 모드)");
  console.log("  🎯 프로젝트 1: CMP 실시간 모니터링 시스템 v2");

  const proj1 = await db.project.create({
    data: {
      workspaceId: ws.id,
      name: "CMP 실시간 모니터링 v2",
      description: "CMP 장비 4대의 실시간 센서 데이터 수집, 이상 감지, 자동 알림 시스템",
      color: "#6366f1",
      status: "active",
      startDate: format(subDays(now, 21), "yyyy-MM-dd"),
      targetDate: format(addDays(now, 70), "yyyy-MM-dd"),
      // 인셉션 필드 - 관리자가 "Full Planning" 버튼 클릭 후 입력
      summary: "CMP 장비 이상감지 자동화로 Unplanned Downtime 50% 감소",
      problemStatement: "현재 CMP 4대 장비의 이상 감지가 작업자 육안 확인에 의존. 평균 감지 시간 45분, 이로 인한 Wafer Scrap이 분기당 약 200매. 야간 근무 시 감지 지연이 심각하여 불량률이 주간 대비 2배.",
      definitionOfDone: "1) 장비 이상 발생 3분 이내 자동 알림\n2) 오탐률(False Positive) 5% 미만\n3) 24시간 무중단 모니터링\n4) 월간 Wafer Scrap 50% 감소 검증\n5) 야간 근무자도 독립 운영 가능",
    },
  });

  // 에픽 생성 - 관리자가 큰 카테고리로 분류
  const epic1_sensor = await db.epic.create({ data: { projectId: proj1.id, name: "센서 데이터 수집 시스템", status: "in_progress", priority: "high", startDate: format(subDays(now, 21), "yyyy-MM-dd"), targetDate: format(addDays(now, 7), "yyyy-MM-dd") } });
  const epic1_algo = await db.epic.create({ data: { projectId: proj1.id, name: "이상감지 알고리즘", status: "todo", priority: "urgent", sortOrder: 1 } });
  const epic1_alert = await db.epic.create({ data: { projectId: proj1.id, name: "알림 & 대응 시스템", status: "todo", priority: "high", sortOrder: 2 } });
  const epic1_dashboard = await db.epic.create({ data: { projectId: proj1.id, name: "운영 대시보드", status: "todo", priority: "medium", sortOrder: 3 } });

  // 마일스톤 - 관리자가 주요 체크포인트 설정
  await db.milestone.create({ data: { projectId: proj1.id, name: "센서 수집 검증 완료", targetDate: format(addDays(now, 7), "yyyy-MM-dd"), status: "pending" } });
  await db.milestone.create({ data: { projectId: proj1.id, name: "알고리즘 POC 완료", targetDate: format(addDays(now, 28), "yyyy-MM-dd"), status: "pending", sortOrder: 1 } });
  await db.milestone.create({ data: { projectId: proj1.id, name: "파일럿 운영 시작", targetDate: format(addDays(now, 49), "yyyy-MM-dd"), status: "pending", sortOrder: 2 } });
  await db.milestone.create({ data: { projectId: proj1.id, name: "정식 운영 전환", targetDate: format(addDays(now, 70), "yyyy-MM-dd"), status: "pending", sortOrder: 3 } });

  console.log("  ✅ 에픽 4개, 마일스톤 4개 생성\n");

  // ═══════════════════════════════════════
  // STEP 5: OKR 설정
  // UI: Project > OKR 탭 > New Objective
  // 관리자가 팀 목표를 수치로 정의
  // ═══════════════════════════════════════
  console.log("📋 STEP 5: OKR 설정 (Project > OKR)");

  const obj1_1 = await db.objective.create({ data: { projectId: proj1.id, title: "장비 이상 감지 속도 혁신" } });
  const kr1_detect = await db.keyResult.create({ data: { objectiveId: obj1_1.id, title: "이상 감지 → 알림 3분 이내", unit: "분", startValue: 45, currentValue: 45, targetValue: 3, direction: "decrease", deadline: format(addDays(now, 49), "yyyy-MM-dd") } });
  const kr1_fp = await db.keyResult.create({ data: { objectiveId: obj1_1.id, title: "오탐률 5% 미만", unit: "%", startValue: 0, currentValue: 0, targetValue: 5, direction: "decrease", sortOrder: 1 } });
  const kr1_uptime = await db.keyResult.create({ data: { objectiveId: obj1_1.id, title: "시스템 가용성 99.5%", unit: "%", startValue: 0, currentValue: 0, targetValue: 99.5, direction: "increase", sortOrder: 2 } });

  const obj1_2 = await db.objective.create({ data: { projectId: proj1.id, title: "Wafer 불량 최소화", sortOrder: 1 } });
  const kr1_scrap = await db.keyResult.create({ data: { objectiveId: obj1_2.id, title: "월간 Scrap 100매 이하", unit: "매", startValue: 200, currentValue: 200, targetValue: 100, direction: "decrease" } });
  const kr1_night = await db.keyResult.create({ data: { objectiveId: obj1_2.id, title: "야간 불량률 주간 대비 1.2배 이하", unit: "배", startValue: 2.0, currentValue: 2.0, targetValue: 1.2, direction: "decrease", sortOrder: 1 } });

  console.log("  ✅ Objective 2개, KR 5개 설정\n");

  // ═══════════════════════════════════════
  // STEP 6: 스토리 작성
  // UI: Project > Stories > New Story
  // 관리자가 유저 스토리 형식으로 요구사항 정리
  // ═══════════════════════════════════════
  console.log("📋 STEP 6: 스토리 작성 (Project > Stories)");

  const story1_1 = await db.story.create({
    data: {
      projectId: proj1.id, title: "OPC-UA 센서 데이터 실시간 수집",
      userStory: "장비 엔지니어로서, CMP 4대 장비의 OPC-UA 센서 데이터(압력, 회전속도, 슬러리 유량, 온도)를 초 단위로 수집하고 싶다",
      description: "Acceptance Criteria:\n- 4대 장비 동시 수집\n- 센서 20개 채널/장비\n- 수집 주기: 1초\n- 데이터 유실률 0.1% 미만",
      storyPoints: 13, status: "in_progress", priority: "high",
    },
  });
  const story1_2 = await db.story.create({
    data: {
      projectId: proj1.id, title: "시계열 DB 파이프라인",
      userStory: "데이터 엔지니어로서, 수집된 센서 데이터를 TimescaleDB에 효율적으로 저장하고 쿼리하고 싶다",
      storyPoints: 8, status: "in_progress", priority: "high", sortOrder: 1,
    },
  });
  const story1_3 = await db.story.create({
    data: {
      projectId: proj1.id, title: "Rule-based 이상 감지 엔진",
      userStory: "운영팀으로서, 센서 값이 관리 한계(Spec Limit)를 벗어나면 즉시 알림을 받고 싶다",
      description: "Phase 1: Rule-based (SPC 관리도 기반)\nPhase 2: ML 기반 (다음 스프린트)",
      storyPoints: 13, status: "todo", priority: "urgent", sortOrder: 2,
    },
  });
  const story1_4 = await db.story.create({
    data: {
      projectId: proj1.id, title: "Slack & 사내 메신저 알림 연동",
      userStory: "야간 근무자로서, 장비 이상 시 즉시 Slack과 사내 메신저로 알림받고 싶다",
      storyPoints: 5, status: "backlog", priority: "medium", sortOrder: 3,
    },
  });
  const story1_5 = await db.story.create({
    data: {
      projectId: proj1.id, title: "실시간 장비 상태 대시보드",
      userStory: "관리자로서, 한 화면에서 4대 장비의 실시간 상태와 이상 이력을 보고 싶다",
      storyPoints: 13, status: "backlog", priority: "medium", sortOrder: 4,
    },
  });
  const story1_6 = await db.story.create({
    data: {
      projectId: proj1.id, title: "ML 기반 예지 보전(Predictive Maintenance)",
      userStory: "장비 엔지니어로서, 장비 고장 전 24시간 이내에 예측 알림을 받고 싶다",
      storyPoints: 21, status: "backlog", priority: "high", sortOrder: 5,
    },
  });

  // Story ↔ KR 연결 - 관리자가 "이 스토리가 어떤 KR에 기여하는지" 설정
  await db.storyKRLink.create({ data: { storyId: story1_1.id, keyResultId: kr1_detect.id, estimatedImpact: 0.2 } });
  await db.storyKRLink.create({ data: { storyId: story1_2.id, keyResultId: kr1_detect.id, estimatedImpact: 0.1 } });
  await db.storyKRLink.create({ data: { storyId: story1_3.id, keyResultId: kr1_detect.id, estimatedImpact: 0.4 } });
  await db.storyKRLink.create({ data: { storyId: story1_3.id, keyResultId: kr1_fp.id, estimatedImpact: 0.7 } });
  await db.storyKRLink.create({ data: { storyId: story1_3.id, keyResultId: kr1_scrap.id, estimatedImpact: 0.5 } });
  await db.storyKRLink.create({ data: { storyId: story1_4.id, keyResultId: kr1_detect.id, estimatedImpact: 0.2 } });
  await db.storyKRLink.create({ data: { storyId: story1_4.id, keyResultId: kr1_night.id, estimatedImpact: 0.3 } });
  await db.storyKRLink.create({ data: { storyId: story1_5.id, keyResultId: kr1_uptime.id, estimatedImpact: 0.4 } });
  await db.storyKRLink.create({ data: { storyId: story1_6.id, keyResultId: kr1_scrap.id, estimatedImpact: 0.4 } });

  console.log("  ✅ 6개 스토리, 9개 KR 연결\n");

  // ═══════════════════════════════════════
  // STEP 7: 스토리 → 태스크 분해 (관리자 + 시니어)
  // UI: Stories > Story Card > Decompose to Tasks
  // 관리자가 시니어(김민수)와 함께 태스크를 세분화
  // ═══════════════════════════════════════
  console.log("📋 STEP 7: 스토리→태스크 분해 + 멤버 할당");

  // Story 1: OPC-UA 센서 수집 → 김민수 담당
  const t1_1 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_sensor.id, storyId: story1_1.id, memberId: kim.id, title: "OPC-UA 클라이언트 라이브러리 선정 및 POC", status: "done", priority: "high", dueDate: format(subDays(now, 14), "yyyy-MM-dd"), completedAt: subDays(now, 15), sortOrder: 0 } });
  const t1_2 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_sensor.id, storyId: story1_1.id, memberId: kim.id, title: "CMP-01 장비 OPC-UA 연동 개발", status: "done", priority: "high", dueDate: format(subDays(now, 7), "yyyy-MM-dd"), completedAt: subDays(now, 8), sortOrder: 1 } });
  const t1_3 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_sensor.id, storyId: story1_1.id, memberId: kim.id, title: "CMP-02~04 장비 연동 확장", status: "in_progress", priority: "high", dueDate: format(addDays(now, 2), "yyyy-MM-dd"), sortOrder: 2 } });
  // 서브태스크
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t1_3.id, title: "CMP-02 연동", status: "done", sortOrder: 0, completedAt: subDays(now, 1) } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t1_3.id, title: "CMP-03 연동", status: "in_progress", sortOrder: 1 } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t1_3.id, title: "CMP-04 연동", status: "todo", sortOrder: 2 } });

  const t1_4 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_sensor.id, storyId: story1_1.id, memberId: choi.id, title: "센서 데이터 수집 통합 테스트", status: "todo", priority: "high", dueDate: format(addDays(now, 5), "yyyy-MM-dd"), sortOrder: 3 } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t1_4.id, title: "수집 주기 1초 검증", status: "todo", sortOrder: 0 } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t1_4.id, title: "데이터 유실률 측정", status: "todo", sortOrder: 1 } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t1_4.id, title: "4대 동시 수집 부하 테스트", status: "todo", sortOrder: 2 } });

  // Story 2: DB 파이프라인 → 김민수 담당
  const t2_1 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_sensor.id, storyId: story1_2.id, memberId: kim.id, title: "TimescaleDB 설치 및 스키마 설계", status: "done", priority: "high", completedAt: subDays(now, 10), sortOrder: 4 } });
  const t2_2 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_sensor.id, storyId: story1_2.id, memberId: kim.id, title: "Kafka → TimescaleDB 스트리밍 파이프라인", status: "in_progress", priority: "high", dueDate: format(addDays(now, 3), "yyyy-MM-dd"), sortOrder: 5 } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t2_2.id, title: "Kafka Producer (센서→Kafka)", status: "done", sortOrder: 0, completedAt: subDays(now, 3) } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t2_2.id, title: "Kafka Consumer (Kafka→TimescaleDB)", status: "in_progress", sortOrder: 1 } });
  await db.task.create({ data: { projectId: proj1.id, parentTaskId: t2_2.id, title: "Dead Letter Queue 처리", status: "todo", sortOrder: 2 } });

  const t2_3 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_sensor.id, storyId: story1_2.id, memberId: jung.id, title: "파이프라인 데이터 정합성 검증", status: "todo", priority: "medium", dueDate: format(addDays(now, 7), "yyyy-MM-dd"), sortOrder: 6 } });

  // Story 3: 이상 감지 엔진 → 박팀장 + 정대리
  const t3_1 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_algo.id, storyId: story1_3.id, memberId: park.id, title: "SPC 관리 한계 기준 정의 (장비별 Spec Limit)", status: "todo", priority: "urgent", dueDate: format(addDays(now, 5), "yyyy-MM-dd"), sortOrder: 7 } });
  const t3_2 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_algo.id, storyId: story1_3.id, memberId: kim.id, title: "Rule Engine 프레임워크 설계 및 구현", status: "todo", priority: "urgent", dueDate: format(addDays(now, 14), "yyyy-MM-dd"), sortOrder: 8 } });
  const t3_3 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_algo.id, storyId: story1_3.id, memberId: jung.id, title: "과거 이상 데이터 기반 Rule 검증", status: "backlog", priority: "high", sortOrder: 9 } });
  const t3_4 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_algo.id, storyId: story1_3.id, memberId: jung.id, title: "오탐률 분석 및 Threshold 최적화", status: "backlog", priority: "high", sortOrder: 10 } });

  // Story 4: 알림 연동 → 이지연
  const t4_1 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_alert.id, storyId: story1_4.id, memberId: lee.id, title: "Slack Webhook 연동 개발", status: "backlog", priority: "medium", sortOrder: 11 } });
  const t4_2 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_alert.id, storyId: story1_4.id, memberId: lee.id, title: "사내 메신저 API 연동", status: "backlog", priority: "medium", sortOrder: 12 } });
  const t4_3 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_alert.id, storyId: story1_4.id, memberId: lee.id, title: "알림 레벨 설정 UI (Warning/Critical/Emergency)", status: "backlog", priority: "medium", sortOrder: 13 } });

  // Story 5: 대시보드 → 이지연
  const t5_1 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_dashboard.id, storyId: story1_5.id, memberId: lee.id, title: "장비 상태 Overview 화면 설계", status: "backlog", priority: "medium", sortOrder: 14 } });
  const t5_2 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_dashboard.id, storyId: story1_5.id, memberId: lee.id, title: "실시간 센서 차트 (Grafana 연동 or 자체 구현)", status: "backlog", priority: "medium", sortOrder: 15 } });
  const t5_3 = await db.task.create({ data: { projectId: proj1.id, epicId: epic1_dashboard.id, storyId: story1_5.id, memberId: lee.id, title: "이상 이력 타임라인 뷰", status: "backlog", priority: "low", sortOrder: 16 } });

  // 라벨 할당
  for (const t of [t1_1, t1_2, t1_3, t2_1, t2_2, t3_2]) await db.taskLabel.create({ data: { taskId: t.id, labelId: lblBackend.id } });
  for (const t of [t4_1, t4_2, t4_3, t5_1, t5_2, t5_3]) await db.taskLabel.create({ data: { taskId: t.id, labelId: lblFrontend.id } });
  for (const t of [t2_1, t2_2]) await db.taskLabel.create({ data: { taskId: t.id, labelId: lblInfra.id } });
  for (const t of [t2_3, t3_3, t3_4]) await db.taskLabel.create({ data: { taskId: t.id, labelId: lblData.id } });
  await db.taskLabel.create({ data: { taskId: t3_1.id, labelId: lblUrgent.id } });

  // 코멘트 - 실제 업무 커뮤니케이션
  await db.comment.create({ data: { taskId: t1_3.id, content: "CMP-02 연동 완료. CMP-03은 OPC-UA 서버 버전이 달라서 별도 설정 필요합니다.", authorName: "김민수" } });
  await db.comment.create({ data: { taskId: t1_3.id, content: "CMP-03 장비는 OPC-UA v1.03이라 호환성 이슈 있을 수 있음. 장비팀에 확인 요청했습니다.", authorName: "박팀장" } });
  await db.comment.create({ data: { taskId: t2_2.id, content: "Kafka Consumer 처리 속도가 예상보다 느림. 배치 사이즈 튜닝 중.", authorName: "김민수" } });
  await db.comment.create({ data: { taskId: t3_1.id, content: "기존 SPC 관리 기준은 정대리가 정리한 CMP_SPC_Spec_v3.xlsx 참고. 추가로 비가동 시간 기준도 필요.", authorName: "박팀장" } });

  console.log("  ✅ 프로젝트1: 18개 태스크 + 8개 서브태스크 + 4개 코멘트\n");

  // ═══════════════════════════════════════
  // STEP 8: 프로젝트 2 - Wafer 불량률 예측 AI
  // ═══════════════════════════════════════
  console.log("  🎯 프로젝트 2: Wafer 불량률 예측 AI 모델");

  const proj2 = await db.project.create({
    data: {
      workspaceId: ws.id,
      name: "Wafer 불량률 예측 AI",
      description: "CMP 공정 데이터 기반 Wafer 불량 사전 예측 모델 개발",
      color: "#10b981",
      status: "active",
      startDate: format(subDays(now, 7), "yyyy-MM-dd"),
      targetDate: format(addDays(now, 56), "yyyy-MM-dd"),
      summary: "AI 기반 불량 예측으로 Scrap Wafer 70% 감소",
      problemStatement: "CMP 공정 후 불량 발견까지 평균 4시간 소요(후공정 검사 시). 이미 후속 공정이 진행된 상태라 손실이 크다.",
      definitionOfDone: "1) 예측 정확도 85% 이상\n2) 불량 예측 → 조치까지 30분 이내\n3) 월간 Scrap 30% 감소 달성",
    },
  });

  const epic2_data = await db.epic.create({ data: { projectId: proj2.id, name: "데이터 수집 & 전처리", status: "in_progress", priority: "high" } });
  const epic2_model = await db.epic.create({ data: { projectId: proj2.id, name: "ML 모델 개발", status: "todo", priority: "high", sortOrder: 1 } });
  const epic2_deploy = await db.epic.create({ data: { projectId: proj2.id, name: "모델 서빙 & 통합", status: "todo", priority: "medium", sortOrder: 2 } });

  // OKR
  const obj2 = await db.objective.create({ data: { projectId: proj2.id, title: "불량 사전 예측 체계 구축" } });
  await db.keyResult.create({ data: { objectiveId: obj2.id, title: "예측 정확도 85% 이상", unit: "%", startValue: 0, currentValue: 0, targetValue: 85, direction: "increase" } });
  await db.keyResult.create({ data: { objectiveId: obj2.id, title: "예측→조치 30분 이내", unit: "분", startValue: 240, currentValue: 240, targetValue: 30, direction: "decrease", sortOrder: 1 } });

  // Stories
  const story2_1 = await db.story.create({ data: { projectId: proj2.id, title: "학습 데이터 구축", userStory: "데이터 사이언티스트로서, 최근 6개월 CMP 공정 데이터와 불량 이력을 정제된 형태로 확보하고 싶다", storyPoints: 8, status: "in_progress", priority: "high" } });
  const story2_2 = await db.story.create({ data: { projectId: proj2.id, title: "Feature Engineering", userStory: "데이터 사이언티스트로서, 불량과 상관관계 높은 공정 변수를 추출하고 싶다", storyPoints: 13, status: "todo", priority: "high", sortOrder: 1 } });
  const story2_3 = await db.story.create({ data: { projectId: proj2.id, title: "모델 학습 & 평가", userStory: "데이터 사이언티스트로서, 여러 알고리즘을 비교하고 최적 모델을 선정하고 싶다", storyPoints: 13, status: "backlog", priority: "high", sortOrder: 2 } });

  // Tasks
  await db.task.create({ data: { projectId: proj2.id, epicId: epic2_data.id, storyId: story2_1.id, memberId: jung.id, title: "MES에서 공정 이력 데이터 추출 (6개월)", status: "done", priority: "high", completedAt: subDays(now, 3), sortOrder: 0 } });
  await db.task.create({ data: { projectId: proj2.id, epicId: epic2_data.id, storyId: story2_1.id, memberId: jung.id, title: "검사기 불량 데이터와 공정 데이터 Join", status: "in_progress", priority: "high", dueDate: format(addDays(now, 3), "yyyy-MM-dd"), sortOrder: 1 } });
  await db.task.create({ data: { projectId: proj2.id, epicId: epic2_data.id, storyId: story2_1.id, memberId: choi.id, title: "데이터 클린징 (이상치 제거, 결측값 처리)", status: "todo", priority: "medium", dueDate: format(addDays(now, 7), "yyyy-MM-dd"), sortOrder: 2 } });
  await db.task.create({ data: { projectId: proj2.id, epicId: epic2_data.id, storyId: story2_2.id, memberId: jung.id, title: "상관분석 & 변수 중요도 분석", status: "backlog", priority: "high", sortOrder: 3 } });
  await db.task.create({ data: { projectId: proj2.id, epicId: epic2_model.id, storyId: story2_3.id, memberId: park.id, title: "모델 후보 선정 (XGBoost, LSTM, AutoML)", status: "backlog", priority: "high", sortOrder: 4 } });
  await db.task.create({ data: { projectId: proj2.id, epicId: epic2_model.id, storyId: story2_3.id, memberId: jung.id, title: "학습/검증 데이터셋 분할", status: "backlog", priority: "medium", sortOrder: 5 } });

  console.log("  ✅ 프로젝트2: 6개 태스크, 3개 스토리\n");

  // ═══════════════════════════════════════
  // STEP 9: 프로젝트 3 - 공정 표준화 & SOP 자동화
  // ═══════════════════════════════════════
  console.log("  🎯 프로젝트 3: 공정 표준화 & SOP 자동화");

  const proj3 = await db.project.create({
    data: {
      workspaceId: ws.id,
      name: "공정 SOP 자동화",
      description: "CMP 공정 표준 운영 절차(SOP)를 디지털화하고 체크리스트 자동화",
      color: "#f59e0b",
      status: "active",
      startDate: today,
      targetDate: format(addDays(now, 28), "yyyy-MM-dd"),
      summary: "종이 SOP → 디지털 체크리스트 전환, 작업 누락 제로화",
      problemStatement: "현재 CMP 공정 SOP가 종이 문서로 관리됨. 신입 작업자 교육 시 3주 소요, SOP 변경 시 현장 반영이 느림.",
      definitionOfDone: "1) 주요 SOP 5개 디지털화\n2) 모바일 체크리스트 앱\n3) SOP 변경 이력 추적\n4) 신입 교육 기간 2주로 단축",
    },
  });

  await db.story.create({ data: { projectId: proj3.id, title: "SOP 디지털 템플릿 시스템", userStory: "공정 관리자로서, SOP를 웹에서 작성하고 버전 관리하고 싶다", storyPoints: 8, status: "todo", priority: "high" } });
  await db.story.create({ data: { projectId: proj3.id, title: "모바일 체크리스트 앱", userStory: "현장 작업자로서, 태블릿에서 SOP 체크리스트를 따라가며 작업하고 싶다", storyPoints: 13, status: "backlog", priority: "high", sortOrder: 1 } });
  await db.story.create({ data: { projectId: proj3.id, title: "SOP 교육 모드", userStory: "신입 작업자로서, SOP를 단계별로 학습하며 실습하고 싶다", storyPoints: 5, status: "backlog", priority: "medium", sortOrder: 2 } });

  await db.task.create({ data: { projectId: proj3.id, memberId: choi.id, title: "기존 종이 SOP 5개 디지털 문서화", status: "in_progress", priority: "high", dueDate: format(addDays(now, 7), "yyyy-MM-dd"), sortOrder: 0 } });
  await db.task.create({ data: { projectId: proj3.id, memberId: lee.id, title: "SOP 에디터 UI 프로토타입", status: "todo", priority: "high", dueDate: format(addDays(now, 10), "yyyy-MM-dd"), sortOrder: 1 } });
  await db.task.create({ data: { projectId: proj3.id, memberId: lee.id, title: "체크리스트 컴포넌트 개발", status: "backlog", priority: "medium", sortOrder: 2 } });
  await db.task.create({ data: { projectId: proj3.id, memberId: kim.id, title: "SOP 버전 관리 API", status: "backlog", priority: "medium", sortOrder: 3 } });

  console.log("  ✅ 프로젝트3: 4개 태스크, 3개 스토리\n");

  // ═══════════════════════════════════════
  // STEP 10: 스프린트 생성 (관리자)
  // UI: Project > Sprints > Create Sprint
  // 관리자가 2주 스프린트로 업무 계획
  // ═══════════════════════════════════════
  console.log("📋 STEP 10: 스프린트 생성 및 태스크 배정");

  const sprint1 = await db.sprint.create({
    data: {
      projectId: proj1.id,
      name: "Sprint 1 - 센서 수집 완성",
      startDate: format(subDays(now, 7), "yyyy-MM-dd"),
      endDate: format(addDays(now, 7), "yyyy-MM-dd"),
      status: "active",
      goalDescription: "CMP 4대 장비 센서 수집 완료 + DB 파이프라인 안정화",
    },
  });

  // 스프린트에 태스크 배정
  for (const t of [t1_3, t1_4, t2_2, t2_3]) {
    await db.sprintTask.create({ data: { sprintId: sprint1.id, taskId: t.id } });
  }

  const sprint2 = await db.sprint.create({
    data: {
      projectId: proj1.id,
      name: "Sprint 2 - 이상 감지 엔진 POC",
      startDate: format(addDays(now, 8), "yyyy-MM-dd"),
      endDate: format(addDays(now, 21), "yyyy-MM-dd"),
      status: "planning",
      goalDescription: "Rule-based 이상 감지 엔진 개발 + Slack 알림 연동",
    },
  });

  for (const t of [t3_1, t3_2, t3_3, t4_1]) {
    await db.sprintTask.create({ data: { sprintId: sprint2.id, taskId: t.id } });
  }

  console.log("  ✅ Sprint 1 (active) + Sprint 2 (planning)\n");

  // ═══════════════════════════════════════
  // STEP 11: 반복 루틴 설정 (관리자)
  // UI: Routines > New Routine
  // ═══════════════════════════════════════
  console.log("📋 STEP 11: 반복 업무 루틴 설정");

  await db.recurringTemplate.create({
    data: {
      workspaceId: ws.id, projectId: proj1.id, memberId: choi.id,
      title: "장비 일일 가동 상태 점검",
      description: "CMP 4대 장비 가동률 확인, 이상 유무 체크, PM 일정 확인",
      priority: "high", frequency: "daily", interval: 1,
      daysOfWeek: JSON.stringify([1,2,3,4,5]), timeOfDay: "08:30",
      isActive: true, nextRunAt: addDays(now, 1),
      labelIds: JSON.stringify([]),
      subtaskTemplates: {
        create: [
          { title: "CMP-01 가동 상태 확인", sortOrder: 0 },
          { title: "CMP-02 가동 상태 확인", sortOrder: 1 },
          { title: "CMP-03 가동 상태 확인", sortOrder: 2 },
          { title: "CMP-04 가동 상태 확인", sortOrder: 3 },
          { title: "이상 발견 시 팀장 보고", sortOrder: 4 },
        ],
      },
    },
  });

  await db.recurringTemplate.create({
    data: {
      workspaceId: ws.id, projectId: proj1.id, memberId: park.id,
      title: "주간 CMP 공정 리뷰 미팅",
      description: "주간 불량률 리뷰, 장비 이슈 공유, 다음 주 계획",
      priority: "high", frequency: "weekly", interval: 1,
      daysOfWeek: JSON.stringify([1]), timeOfDay: "10:00",
      isActive: true, nextRunAt: addWeeks(now, 1),
      labelIds: JSON.stringify([]),
      subtaskTemplates: {
        create: [
          { title: "주간 불량률 데이터 준비", sortOrder: 0 },
          { title: "장비별 이슈 정리", sortOrder: 1 },
          { title: "다음 주 작업 계획 확인", sortOrder: 2 },
          { title: "회의록 작성 및 공유", sortOrder: 3 },
        ],
      },
    },
  });

  await db.recurringTemplate.create({
    data: {
      workspaceId: ws.id, projectId: proj1.id, memberId: jung.id,
      title: "월간 CMP 품질 보고서 작성",
      priority: "high", frequency: "monthly", interval: 1,
      dayOfMonth: 1, timeOfDay: "09:00",
      isActive: true, nextRunAt: addDays(now, 20),
      labelIds: JSON.stringify([lblData.id]),
      subtaskTemplates: {
        create: [
          { title: "월간 불량률 집계", sortOrder: 0 },
          { title: "장비별 Downtime 분석", sortOrder: 1 },
          { title: "SPC 관리도 트렌드 분석", sortOrder: 2 },
          { title: "개선 활동 성과 요약", sortOrder: 3 },
          { title: "보고서 작성 및 팀장 검토", sortOrder: 4 },
        ],
      },
    },
  });

  console.log("  ✅ 3개 루틴 (일일 점검, 주간 리뷰, 월간 보고)\n");

  // ═══════════════════════════════════════
  // STEP 12: 목표(Goal) 설정
  // UI: Goals > Create Goal
  // ═══════════════════════════════════════
  console.log("📋 STEP 12: 팀 목표 설정");

  const goal1 = await db.goal.create({
    data: {
      workspaceId: ws.id, title: "Q2 CMP 공정 자동화율 80% 달성",
      description: "수동 모니터링 → 자동 감지/알림 체계 전환. 야간 무인 운영 기반 마련.",
      status: "in_progress",
      startDate: format(subDays(now, 21), "yyyy-MM-dd"),
      targetDate: format(addDays(now, 70), "yyyy-MM-dd"),
    },
  });
  await db.goalProject.create({ data: { goalId: goal1.id, projectId: proj1.id } });
  await db.goalProject.create({ data: { goalId: goal1.id, projectId: proj2.id } });
  await db.kPI.create({ data: { goalId: goal1.id, name: "공정 자동화율", unit: "%", targetValue: 80, currentValue: 25, direction: "increase" } });
  await db.kPI.create({ data: { goalId: goal1.id, name: "월간 Unplanned Downtime", unit: "시간", targetValue: 4, currentValue: 12, direction: "decrease" } });

  console.log("  ✅ 팀 목표 1개, KPI 2개\n");

  // ═══════════════════════════════════════
  // STEP 13: 데일리 스크럼 노트
  // UI: Standup > Today
  // ═══════════════════════════════════════
  console.log("📋 STEP 13: 데일리 스크럼");

  await db.standupNote.create({
    data: {
      date: today,
      yesterday: "- 김민수: CMP-02 OPC-UA 연동 완료, CMP-03 연동 시작\n- 이지연: 대시보드 와이어프레임 검토\n- 정대리: MES 데이터 추출 완료\n- 최사원: 센서 테스트 환경 구축 중",
      today: "- 김민수: CMP-03/04 연동 계속, Kafka Consumer 튜닝\n- 이지연: SOP 에디터 프로토타입 시작\n- 정대리: 공정-불량 데이터 Join 작업\n- 최사원: 센서 수집 통합 테스트 준비",
      blockers: "- CMP-03 장비 OPC-UA 서버 버전 호환 이슈 (장비팀 확인 대기 중)\n- TimescaleDB 라이선스 구매 승인 지연",
    },
  });

  console.log("  ✅ 오늘 스크럼 노트 작성\n");

  // ═══════════════════════════════════════
  // STEP 14: KR 스냅샷 기록 (주간 업데이트)
  // UI: Project > OKR > Key Result > Record
  // ═══════════════════════════════════════
  console.log("📋 STEP 14: KR 진행 상황 기록");

  // 프로젝트가 시작된 지 3주, 주간 업데이트 시뮬레이션
  await db.kRSnapshot.create({ data: { keyResultId: kr1_detect.id, value: 45, note: "시작 (수동 모니터링 기준)", recordedAt: subDays(now, 21) } });
  await db.kRSnapshot.create({ data: { keyResultId: kr1_detect.id, value: 40, note: "센서 수집 시작, 부분 자동화", recordedAt: subDays(now, 14) } });
  await db.kRSnapshot.create({ data: { keyResultId: kr1_detect.id, value: 35, note: "2대 장비 자동 수집 중", recordedAt: subDays(now, 7) } });

  await db.kRSnapshot.create({ data: { keyResultId: kr1_scrap.id, value: 200, note: "기존 수준", recordedAt: subDays(now, 21) } });
  await db.kRSnapshot.create({ data: { keyResultId: kr1_scrap.id, value: 185, note: "수동 체크 강화 효과", recordedAt: subDays(now, 7) } });

  // KR 현재값 업데이트
  await db.keyResult.update({ where: { id: kr1_detect.id }, data: { currentValue: 35 } });
  await db.keyResult.update({ where: { id: kr1_scrap.id }, data: { currentValue: 185 } });

  console.log("  ✅ KR 스냅샷 5개 기록\n");

  // ═══════════════════════════════════════
  // STEP 15: 활동 로그 생성 (대시보드 히트맵용)
  // ═══════════════════════════════════════
  console.log("📋 STEP 15: 활동 로그 생성");

  for (let i = 0; i < 60; i++) {
    const count = Math.floor(Math.random() * 6) + 1;
    for (let j = 0; j < count; j++) {
      await db.activityLog.create({
        data: {
          entityType: ["task", "story", "project"][Math.floor(Math.random() * 3)],
          entityId: "workflow-sim",
          action: ["created", "updated", "status_changed", "completed"][Math.floor(Math.random() * 4)],
          occurredAt: subDays(now, i),
        },
      });
    }
  }

  console.log("  ✅ 60일 활동 히트맵 데이터\n");

  // ═══════════════════════════════════════
  // STEP 16: 브레인스토밍 (마인드맵)
  // UI: Mind Maps > Create > Add Nodes
  // ═══════════════════════════════════════
  console.log("📋 STEP 16: 브레인스토밍 (Mind Maps)");

  const mm = await db.mindMap.create({ data: { projectId: proj1.id, title: "CMP 모니터링 v3 아이디어", description: "차기 버전 브레인스토밍" } });
  const root = await db.mindMapNode.create({ data: { mindMapId: mm.id, content: "CMP 모니터링 v3", positionX: 400, positionY: 250 } });
  const n1 = await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: root.id, content: "AI/ML 고도화", positionX: 200, positionY: 100 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n1.id, content: "딥러닝 이상감지", positionX: 50, positionY: 50 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n1.id, content: "예지보전 모델", positionX: 50, positionY: 130 } });
  const n2 = await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: root.id, content: "장비 확장", positionX: 600, positionY: 100 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n2.id, content: "Etch 장비 포함", positionX: 750, positionY: 50 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n2.id, content: "CVD 장비 포함", positionX: 750, positionY: 130 } });
  const n3 = await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: root.id, content: "운영 개선", positionX: 400, positionY: 420 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n3.id, content: "자동 보고서", positionX: 250, positionY: 480 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n3.id, content: "모바일 앱", positionX: 550, positionY: 480 } });

  console.log("  ✅ 마인드맵: 11개 노드\n");

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  const summary = {
    members: await db.member.count(),
    workspaces: await db.workspace.count(),
    projects: await db.project.count(),
    epics: await db.epic.count(),
    stories: await db.story.count(),
    tasks: await db.task.count({ where: { parentTaskId: null } }),
    subtasks: await db.task.count({ where: { parentTaskId: { not: null } } }),
    sprints: await db.sprint.count(),
    objectives: await db.objective.count(),
    keyResults: await db.keyResult.count(),
    recurringTemplates: await db.recurringTemplate.count(),
    comments: await db.comment.count(),
    milestones: await db.milestone.count(),
    labels: await db.label.count(),
  };

  console.log("═══════════════════════════════════════════");
  console.log("  시뮬레이션 완료 — 데이터 요약");
  console.log("═══════════════════════════════════════════");
  console.log(`  팀원: ${summary.members}명`);
  console.log(`  프로젝트: ${summary.projects}개 (에픽 ${summary.epics}개)`);
  console.log(`  스토리: ${summary.stories}개`);
  console.log(`  태스크: ${summary.tasks}개 (서브태스크 ${summary.subtasks}개)`);
  console.log(`  스프린트: ${summary.sprints}개`);
  console.log(`  OKR: ${summary.objectives} Objectives, ${summary.keyResults} KRs`);
  console.log(`  반복 루틴: ${summary.recurringTemplates}개`);
  console.log(`  마일스톤: ${summary.milestones}개`);
  console.log(`  코멘트: ${summary.comments}개`);

  await db.$disconnect();
}

simulate().catch((e) => { console.error("ERROR:", e); process.exit(1); });
