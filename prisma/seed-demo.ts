import { PrismaClient } from "@prisma/client";
import { addDays, addWeeks, subDays, format } from "date-fns";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo data...\n");

  // ─── Clean existing demo data ───
  await db.comment.deleteMany();
  await db.storyKRLink.deleteMany();
  await db.kRSnapshot.deleteMany();
  await db.keyResult.deleteMany();
  await db.objective.deleteMany();
  await db.story.deleteMany();
  await db.recurringSubtask.deleteMany();
  await db.recurringTemplate.deleteMany();
  await db.boardView.deleteMany();
  await db.taskLabel.deleteMany();
  await db.dailyPlanTask.deleteMany();
  await db.dailyPlan.deleteMany();
  await db.sprintTask.deleteMany();
  await db.sprint.deleteMany();
  await db.dependency.deleteMany();
  await db.mindMapNode.deleteMany();
  await db.mindMap.deleteMany();
  await db.kPIEntry.deleteMany();
  await db.kPI.deleteMany();
  await db.goalProject.deleteMany();
  await db.goal.deleteMany();
  await db.milestone.deleteMany();
  await db.activityLog.deleteMany();
  await db.task.deleteMany();
  await db.epic.deleteMany();
  await db.label.deleteMany();
  await db.project.deleteMany();
  await db.member.deleteMany();
  await db.workspace.deleteMany();

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  // ─── Members ───
  const parker = await db.member.create({ data: { name: "Parker", role: "Lead Engineer", email: "parker@company.com", color: "#6366f1" } });
  const jiyeon = await db.member.create({ data: { name: "지연", role: "Frontend Dev", email: "jiyeon@company.com", color: "#ec4899" } });
  const minsoo = await db.member.create({ data: { name: "민수", role: "Backend Dev", email: "minsoo@company.com", color: "#10b981" } });
  const daeri = await db.member.create({ data: { name: "김대리", role: "QA Engineer", email: "daeri@company.com", color: "#f59e0b" } });
  console.log("✅ Members: 4");

  // ─── Workspaces ───
  const wsWork = await db.workspace.create({ data: { name: "업무", description: "회사 업무 프로젝트", color: "#6366f1", icon: "💼" } });
  const wsSide = await db.workspace.create({ data: { name: "사이드", description: "사이드 프로젝트", color: "#10b981", icon: "🚀" } });
  console.log("✅ Workspaces: 2");

  // ─── Labels ───
  const lblBackend = await db.label.create({ data: { workspaceId: wsWork.id, name: "백엔드", color: "#3b82f6" } });
  const lblFrontend = await db.label.create({ data: { workspaceId: wsWork.id, name: "프론트", color: "#8b5cf6" } });
  const lblUrgent = await db.label.create({ data: { workspaceId: wsWork.id, name: "긴급", color: "#ef4444" } });
  const lblInfra = await db.label.create({ data: { workspaceId: wsWork.id, name: "인프라", color: "#14b8a6" } });
  const lblBug = await db.label.create({ data: { workspaceId: wsSide.id, name: "버그", color: "#ef4444" } });
  const lblFeature = await db.label.create({ data: { workspaceId: wsSide.id, name: "기능", color: "#22c55e" } });
  const lblDesign = await db.label.create({ data: { workspaceId: wsSide.id, name: "디자인", color: "#f59e0b" } });
  console.log("✅ Labels: 7");

  // ══════════════════════════════════════════
  // PROJECT 1: CMP 장비 모니터링 v2
  // ══════════════════════════════════════════
  const proj1 = await db.project.create({
    data: {
      workspaceId: wsWork.id, name: "CMP 실시간 모니터링 v2", color: "#6366f1",
      description: "장비 이상 감지 자동화 시스템",
      status: "active",
      startDate: format(subDays(now, 14), "yyyy-MM-dd"),
      targetDate: format(addDays(now, 90), "yyyy-MM-dd"),
      summary: "장비 이상 감지→알림 자동화로 다운타임 50% 감소",
      problemStatement: "현재 CMP 장비 이상 감지가 수동 모니터링에 의존, 평균 30분 이상 지연. 분기당 불량률 약 2%.",
      definitionOfDone: "장비 이상 발생 5분 이내 알림, 대시보드 실시간 모니터링, 월간 불량률 리포트 자동 생성",
    },
  });

  // Epics
  const epic1_1 = await db.epic.create({ data: { projectId: proj1.id, name: "데이터 수집 파이프라인", status: "in_progress", priority: "high", startDate: format(subDays(now, 14), "yyyy-MM-dd"), targetDate: format(addDays(now, 14), "yyyy-MM-dd") } });
  const epic1_2 = await db.epic.create({ data: { projectId: proj1.id, name: "이상감지 알고리즘 v2", status: "todo", priority: "high", sortOrder: 1 } });
  const epic1_3 = await db.epic.create({ data: { projectId: proj1.id, name: "Slack 알림 연동", status: "todo", priority: "medium", sortOrder: 2 } });
  const epic1_4 = await db.epic.create({ data: { projectId: proj1.id, name: "대시보드 UI", status: "todo", priority: "medium", sortOrder: 3 } });

  // Milestones
  await db.milestone.create({ data: { projectId: proj1.id, name: "데이터 수집 완료", targetDate: format(addDays(now, 14), "yyyy-MM-dd"), status: "pending" } });
  await db.milestone.create({ data: { projectId: proj1.id, name: "알림 시스템 가동", targetDate: format(addDays(now, 45), "yyyy-MM-dd"), status: "pending", sortOrder: 1 } });
  await db.milestone.create({ data: { projectId: proj1.id, name: "프로젝트 마감", targetDate: format(addDays(now, 90), "yyyy-MM-dd"), status: "pending", sortOrder: 2 } });

  // OKR
  const obj1_1 = await db.objective.create({ data: { projectId: proj1.id, title: "장비 이상 감지 시간 단축", description: "실시간 센서 데이터 분석으로 감지 속도 개선" } });
  const kr1_1 = await db.keyResult.create({ data: { objectiveId: obj1_1.id, title: "감지→알림 5분 이내", unit: "분", startValue: 30, currentValue: 18, targetValue: 5, direction: "decrease", deadline: format(addDays(now, 60), "yyyy-MM-dd") } });
  const kr1_2 = await db.keyResult.create({ data: { objectiveId: obj1_1.id, title: "오탐률 3% 미만", unit: "%", startValue: 15, currentValue: 10, targetValue: 3, direction: "decrease", sortOrder: 1 } });

  const obj1_2 = await db.objective.create({ data: { projectId: proj1.id, title: "팀 운영 효율화", sortOrder: 1 } });
  const kr1_3 = await db.keyResult.create({ data: { objectiveId: obj1_2.id, title: "주간 수동 모니터링 5h 이하", unit: "h", startValue: 20, currentValue: 12, targetValue: 5, direction: "decrease" } });

  // KR Snapshots
  for (const [kr, values] of [[kr1_1, [30, 25, 22, 18]], [kr1_2, [15, 13, 11, 10]], [kr1_3, [20, 17, 14, 12]]] as const) {
    for (let i = 0; i < values.length; i++) {
      await db.kRSnapshot.create({ data: { keyResultId: kr.id, value: values[i], note: `Week ${i + 1} measurement`, recordedAt: subDays(now, (values.length - i) * 7) } });
    }
  }

  // Stories
  const story1_1 = await db.story.create({ data: { projectId: proj1.id, title: "센서 데이터 수집 모듈", userStory: "장비 엔지니어로서, 3대 CMP 장비의 센서 데이터를 실시간으로 수집하고 싶다", storyPoints: 8, status: "done", priority: "high" } });
  const story1_2 = await db.story.create({ data: { projectId: proj1.id, title: "DB 파이프라인 구축", userStory: "데이터 엔지니어로서, 수집된 센서 데이터를 효율적으로 저장하고 싶다", storyPoints: 13, status: "in_progress", priority: "high", sortOrder: 1 } });
  const story1_3 = await db.story.create({ data: { projectId: proj1.id, title: "이상 감지 알고리즘", userStory: "운영팀으로서, 장비 이상을 자동으로 감지하고 알림받고 싶다", storyPoints: 21, status: "backlog", priority: "urgent", sortOrder: 2 } });
  const story1_4 = await db.story.create({ data: { projectId: proj1.id, title: "Slack 알림 연동", userStory: "관리자로서, 이상 발견 시 즉시 Slack으로 알림받고 싶다", storyPoints: 5, status: "backlog", priority: "medium", sortOrder: 3 } });
  const story1_5 = await db.story.create({ data: { projectId: proj1.id, title: "모니터링 대시보드", userStory: "운영팀으로서, 한눈에 장비 상태를 파악하고 싶다", storyPoints: 13, status: "backlog", priority: "medium", sortOrder: 4 } });

  // Story ↔ KR Links
  await db.storyKRLink.create({ data: { storyId: story1_1.id, keyResultId: kr1_1.id, estimatedImpact: 0.3 } });
  await db.storyKRLink.create({ data: { storyId: story1_2.id, keyResultId: kr1_1.id, estimatedImpact: 0.2 } });
  await db.storyKRLink.create({ data: { storyId: story1_3.id, keyResultId: kr1_1.id, estimatedImpact: 0.4 } });
  await db.storyKRLink.create({ data: { storyId: story1_3.id, keyResultId: kr1_2.id, estimatedImpact: 0.8 } });
  await db.storyKRLink.create({ data: { storyId: story1_4.id, keyResultId: kr1_1.id, estimatedImpact: 0.1 } });
  await db.storyKRLink.create({ data: { storyId: story1_5.id, keyResultId: kr1_3.id, estimatedImpact: 0.6 } });

  // Tasks (30+ tasks across statuses)
  const p1Tasks = [
    { title: "센서 수집 모듈 구축", epicId: epic1_1.id, storyId: story1_1.id, memberId: parker.id, status: "done", priority: "high", dueDate: format(subDays(now, 7), "yyyy-MM-dd") },
    { title: "1호기 센서 연동 테스트", epicId: epic1_1.id, storyId: story1_1.id, memberId: minsoo.id, status: "done", priority: "high", dueDate: format(subDays(now, 5), "yyyy-MM-dd") },
    { title: "2호기 센서 연동", epicId: epic1_1.id, storyId: story1_1.id, memberId: minsoo.id, status: "done", priority: "high" },
    { title: "3호기 센서 연동", epicId: epic1_1.id, storyId: story1_1.id, memberId: minsoo.id, status: "done", priority: "medium" },
    { title: "DB 스키마 설계", epicId: epic1_1.id, storyId: story1_2.id, memberId: parker.id, status: "done", priority: "high" },
    { title: "수집 파이프라인 구현", epicId: epic1_1.id, storyId: story1_2.id, memberId: minsoo.id, status: "in_progress", priority: "high", dueDate: format(addDays(now, 3), "yyyy-MM-dd") },
    { title: "수집 모니터링 구현", epicId: epic1_1.id, storyId: story1_2.id, memberId: null, status: "todo", priority: "medium", dueDate: format(addDays(now, 10), "yyyy-MM-dd") },
    { title: "기존 알고리즘 분석", epicId: epic1_2.id, storyId: story1_3.id, memberId: parker.id, status: "done", priority: "high" },
    { title: "새 알고리즘 설계", epicId: epic1_2.id, storyId: story1_3.id, memberId: parker.id, status: "in_progress", priority: "urgent", dueDate: format(addDays(now, 5), "yyyy-MM-dd") },
    { title: "알고리즘 구현", epicId: epic1_2.id, storyId: story1_3.id, memberId: parker.id, status: "todo", priority: "high", dueDate: format(addDays(now, 20), "yyyy-MM-dd") },
    { title: "A/B 테스트 환경 구축", epicId: epic1_2.id, storyId: story1_3.id, memberId: daeri.id, status: "backlog", priority: "medium" },
    { title: "A/B 테스트 실행", epicId: epic1_2.id, storyId: story1_3.id, memberId: daeri.id, status: "backlog", priority: "medium" },
    { title: "Slack Webhook 설정", epicId: epic1_3.id, storyId: story1_4.id, memberId: jiyeon.id, status: "backlog", priority: "medium" },
    { title: "알림 템플릿 디자인", epicId: epic1_3.id, storyId: story1_4.id, memberId: jiyeon.id, status: "backlog", priority: "low" },
    { title: "알림 조건 설정 UI", epicId: epic1_3.id, storyId: story1_4.id, memberId: jiyeon.id, status: "backlog", priority: "medium" },
    { title: "대시보드 레이아웃", epicId: epic1_4.id, storyId: story1_5.id, memberId: jiyeon.id, status: "backlog", priority: "medium" },
    { title: "실시간 차트 구현", epicId: epic1_4.id, storyId: story1_5.id, memberId: jiyeon.id, status: "backlog", priority: "high" },
    { title: "장비 상태 카드", epicId: epic1_4.id, storyId: story1_5.id, memberId: jiyeon.id, status: "backlog", priority: "medium" },
    { title: "긴급: 서버 타임아웃 수정", epicId: null, storyId: null, memberId: parker.id, status: "in_progress", priority: "urgent", dueDate: today },
    { title: "코드리뷰: 파이프라인 PR", epicId: null, storyId: null, memberId: daeri.id, status: "in_review", priority: "high", dueDate: format(addDays(now, 1), "yyyy-MM-dd") },
  ];

  for (let i = 0; i < p1Tasks.length; i++) {
    const t = p1Tasks[i];
    const task = await db.task.create({
      data: { projectId: proj1.id, ...t, sortOrder: i, completedAt: t.status === "done" ? subDays(now, Math.floor(Math.random() * 10) + 1) : null },
    });
    // Add labels to some tasks
    if (i < 7) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblBackend.id } }).catch(() => {});
    if (i >= 13 && i <= 17) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblFrontend.id } }).catch(() => {});
    if (t.priority === "urgent") await db.taskLabel.create({ data: { taskId: task.id, labelId: lblUrgent.id } }).catch(() => {});

    // Add subtasks to some
    if (i === 5) {
      await db.task.create({ data: { projectId: proj1.id, parentTaskId: task.id, title: "TimescaleDB 설정", status: "done", sortOrder: 0 } });
      await db.task.create({ data: { projectId: proj1.id, parentTaskId: task.id, title: "Kafka Consumer 구현", status: "in_progress", sortOrder: 1 } });
      await db.task.create({ data: { projectId: proj1.id, parentTaskId: task.id, title: "데이터 검증 로직", status: "todo", sortOrder: 2 } });
    }

    // Add comments to some tasks
    if (i === 8) {
      await db.comment.create({ data: { taskId: task.id, content: "기존 rule-based → ML 기반으로 전환 검토 중. scikit-learn 사용 예정.", authorName: "Parker" } });
      await db.comment.create({ data: { taskId: task.id, content: "학습 데이터는 지난 6개월치 센서 로그 사용하면 될 것 같습니다", authorName: "민수" } });
    }
    if (i === 18) {
      await db.comment.create({ data: { taskId: task.id, content: "커넥션 풀 설정 문제로 확인됨. maxPoolSize 조정 중", authorName: "Parker" } });
    }
  }
  console.log(`✅ Project 1: CMP 모니터링 (${p1Tasks.length} tasks, 5 stories, 2 objectives, 3 KRs)`);

  // Recurring templates for Project 1
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsWork.id, projectId: proj1.id, memberId: parker.id,
      title: "매일 장비 가동률 체크", description: "CMP 장비 3대 가동률 확인, 이상 시 리포트",
      priority: "medium", frequency: "daily", interval: 1,
      daysOfWeek: JSON.stringify([1,2,3,4,5]), timeOfDay: "09:00",
      isActive: true, nextRunAt: addDays(now, 1),
      labelIds: JSON.stringify([lblBackend.id]),
      subtaskTemplates: {
        create: [
          { title: "1호기 가동률 확인", sortOrder: 0 },
          { title: "2호기 가동률 확인", sortOrder: 1 },
          { title: "3호기 가동률 확인", sortOrder: 2 },
          { title: "이상 발견 시 Slack 리포트", sortOrder: 3 },
        ],
      },
    },
  });
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsWork.id, projectId: proj1.id, memberId: parker.id,
      title: "주간 업무 보고 작성", priority: "high", frequency: "weekly", interval: 1,
      daysOfWeek: JSON.stringify([1]), timeOfDay: "09:00",
      isActive: true, nextRunAt: addWeeks(now, 1),
      labelIds: JSON.stringify([]),
    },
  });
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsWork.id, projectId: proj1.id, memberId: daeri.id,
      title: "월간 KPI 정리 및 보고", priority: "high", frequency: "monthly", interval: 1,
      dayOfMonth: 1, timeOfDay: "09:00",
      isActive: true, nextRunAt: addDays(now, 20),
      labelIds: JSON.stringify([]),
    },
  });
  console.log("✅ Recurring templates: 3 (daily, weekly, monthly)");

  // ══════════════════════════════════════════
  // PROJECT 2: 트레이딩봇 v3
  // ══════════════════════════════════════════
  const proj2 = await db.project.create({
    data: {
      workspaceId: wsSide.id, name: "트레이딩봇 v3", color: "#10b981",
      description: "멀티페어 자동 트레이딩 시스템",
      status: "active",
      startDate: format(subDays(now, 30), "yyyy-MM-dd"),
      targetDate: format(addDays(now, 60), "yyyy-MM-dd"),
      summary: "단일 페어 → 멀티페어 확장, 리스크 관리 자동화",
      problemStatement: "현재 BTC/USDT 단일 페어만 지원. 수동 모니터링 필요. 리스크 관리 부재.",
      definitionOfDone: "3개 이상 페어 동시 운영, 자동 손절/익절, 일일 리포트 자동화",
    },
  });

  const epic2_1 = await db.epic.create({ data: { projectId: proj2.id, name: "멀티페어 엔진", status: "in_progress", priority: "high" } });
  const epic2_2 = await db.epic.create({ data: { projectId: proj2.id, name: "리스크 관리", status: "todo", priority: "urgent", sortOrder: 1 } });
  const epic2_3 = await db.epic.create({ data: { projectId: proj2.id, name: "백테스트 프레임워크", status: "done", priority: "high", sortOrder: 2 } });

  // OKR
  const obj2_1 = await db.objective.create({ data: { projectId: proj2.id, title: "수익률 안정화" } });
  const kr2_1 = await db.keyResult.create({ data: { objectiveId: obj2_1.id, title: "월간 수익률 5% 이상", unit: "%", startValue: 2, currentValue: 3.5, targetValue: 5, direction: "increase" } });
  const kr2_2 = await db.keyResult.create({ data: { objectiveId: obj2_1.id, title: "최대 드로다운 10% 미만", unit: "%", startValue: 25, currentValue: 15, targetValue: 10, direction: "decrease", sortOrder: 1 } });

  for (const [kr, vals] of [[kr2_1, [2, 2.5, 3, 3.5]], [kr2_2, [25, 20, 17, 15]]] as const) {
    for (let i = 0; i < vals.length; i++) {
      await db.kRSnapshot.create({ data: { keyResultId: kr.id, value: vals[i], recordedAt: subDays(now, (vals.length - i) * 7) } });
    }
  }

  // Stories
  const story2_1 = await db.story.create({ data: { projectId: proj2.id, title: "멀티페어 주문 엔진", storyPoints: 13, status: "in_progress", priority: "high" } });
  const story2_2 = await db.story.create({ data: { projectId: proj2.id, title: "자동 손절/익절", storyPoints: 8, status: "todo", priority: "urgent", sortOrder: 1 } });
  const story2_3 = await db.story.create({ data: { projectId: proj2.id, title: "백테스트 결과 시각화", storyPoints: 5, status: "done", priority: "medium", sortOrder: 2 } });
  const story2_4 = await db.story.create({ data: { projectId: proj2.id, title: "일일 수익 리포트", storyPoints: 3, status: "backlog", priority: "low", sortOrder: 3 } });

  await db.storyKRLink.create({ data: { storyId: story2_1.id, keyResultId: kr2_1.id, estimatedImpact: 0.5 } });
  await db.storyKRLink.create({ data: { storyId: story2_2.id, keyResultId: kr2_2.id, estimatedImpact: 0.8 } });

  // Tasks
  const p2Tasks = [
    { title: "주문 라우터 설계", epicId: epic2_1.id, storyId: story2_1.id, memberId: parker.id, status: "done", priority: "high" },
    { title: "바이낸스 API 멀티페어 지원", epicId: epic2_1.id, storyId: story2_1.id, memberId: parker.id, status: "in_progress", priority: "high", dueDate: format(addDays(now, 3), "yyyy-MM-dd") },
    { title: "ETH/USDT 페어 추가", epicId: epic2_1.id, storyId: story2_1.id, memberId: parker.id, status: "todo", priority: "medium" },
    { title: "SOL/USDT 페어 추가", epicId: epic2_1.id, storyId: story2_1.id, memberId: parker.id, status: "todo", priority: "medium" },
    { title: "포지션 사이징 로직", epicId: epic2_2.id, storyId: story2_2.id, memberId: parker.id, status: "todo", priority: "urgent", dueDate: format(addDays(now, 7), "yyyy-MM-dd") },
    { title: "트레일링 스탑 구현", epicId: epic2_2.id, storyId: story2_2.id, memberId: parker.id, status: "backlog", priority: "high" },
    { title: "최대 드로다운 제한", epicId: epic2_2.id, storyId: story2_2.id, memberId: parker.id, status: "backlog", priority: "urgent" },
    { title: "백테스트 엔진 구현", epicId: epic2_3.id, storyId: story2_3.id, memberId: parker.id, status: "done", priority: "high" },
    { title: "결과 차트 구현", epicId: epic2_3.id, storyId: story2_3.id, memberId: parker.id, status: "done", priority: "medium" },
    { title: "리포트 템플릿 설계", epicId: null, storyId: story2_4.id, memberId: null, status: "backlog", priority: "low" },
  ];

  for (let i = 0; i < p2Tasks.length; i++) {
    const t = p2Tasks[i];
    await db.task.create({
      data: { projectId: proj2.id, ...t, sortOrder: i, completedAt: t.status === "done" ? subDays(now, Math.floor(Math.random() * 14) + 1) : null },
    });
  }

  // Recurring for trading
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsSide.id, projectId: proj2.id, memberId: parker.id,
      title: "트레이딩봇 수익률 확인 & 로그 리뷰",
      priority: "high", frequency: "daily", interval: 1,
      daysOfWeek: JSON.stringify([]), timeOfDay: "18:00",
      isActive: true, nextRunAt: addDays(now, 1),
      labelIds: JSON.stringify([]),
      subtaskTemplates: {
        create: [
          { title: "일일 수익률 확인", sortOrder: 0 },
          { title: "포지션 상태 검토", sortOrder: 1 },
          { title: "에러 로그 확인", sortOrder: 2 },
        ],
      },
    },
  });
  console.log(`✅ Project 2: 트레이딩봇 (${p2Tasks.length} tasks, 4 stories, 1 objective, 2 KRs)`);

  // ══════════════════════════════════════════
  // PROJECT 3: 발자취 앱 MVP
  // ══════════════════════════════════════════
  const proj3 = await db.project.create({
    data: {
      workspaceId: wsSide.id, name: "발자취 앱 MVP", color: "#f59e0b",
      description: "여행/일상 기록 위치 기반 앱",
      status: "active",
      startDate: format(subDays(now, 7), "yyyy-MM-dd"),
      targetDate: format(addDays(now, 120), "yyyy-MM-dd"),
      summary: "위치 기반 일상/여행 기록 앱",
      problemStatement: "사진만으로는 여행의 동선과 맥락을 기록하기 어려움. 시간순 자동 정리 + 지도 시각화가 필요.",
      definitionOfDone: "GPS 기록, 사진 연동, 타임라인 뷰, 지도 뷰 제공. 앱스토어 출시 가능 상태.",
    },
  });

  // OKR
  const obj3_1 = await db.objective.create({ data: { projectId: proj3.id, title: "MVP 기능 완성" } });
  await db.keyResult.create({ data: { objectiveId: obj3_1.id, title: "핵심 기능 4개 완성", unit: "개", startValue: 0, currentValue: 1, targetValue: 4, direction: "increase" } });
  await db.keyResult.create({ data: { objectiveId: obj3_1.id, title: "테스트 커버리지 60% 이상", unit: "%", startValue: 0, currentValue: 15, targetValue: 60, direction: "increase", sortOrder: 1 } });

  // Stories
  await db.story.create({ data: { projectId: proj3.id, title: "GPS 트래킹", userStory: "사용자로서, 앱이 백그라운드에서 내 위치를 기록했으면 좋겠다", storyPoints: 13, status: "in_progress", priority: "high" } });
  await db.story.create({ data: { projectId: proj3.id, title: "사진 연동", userStory: "사용자로서, 위치에 사진을 연결해서 보고 싶다", storyPoints: 8, status: "backlog", priority: "high", sortOrder: 1 } });
  await db.story.create({ data: { projectId: proj3.id, title: "타임라인 뷰", userStory: "사용자로서, 하루의 동선을 시간순으로 보고 싶다", storyPoints: 8, status: "backlog", priority: "medium", sortOrder: 2 } });
  await db.story.create({ data: { projectId: proj3.id, title: "지도 뷰", userStory: "사용자로서, 내 발자취를 지도 위에서 보고 싶다", storyPoints: 13, status: "backlog", priority: "medium", sortOrder: 3 } });

  // Tasks
  const p3Tasks = [
    { title: "React Native 프로젝트 셋업", memberId: parker.id, status: "done", priority: "high" },
    { title: "GPS 퍼미션 처리", memberId: parker.id, status: "done", priority: "high" },
    { title: "백그라운드 GPS 트래킹", memberId: parker.id, status: "in_progress", priority: "high", dueDate: format(addDays(now, 5), "yyyy-MM-dd") },
    { title: "위치 데이터 로컬 저장", memberId: parker.id, status: "todo", priority: "high" },
    { title: "사진 갤러리 연동", memberId: null, status: "backlog", priority: "medium" },
    { title: "EXIF GPS 데이터 매칭", memberId: null, status: "backlog", priority: "medium" },
    { title: "타임라인 UI 컴포넌트", memberId: null, status: "backlog", priority: "medium" },
    { title: "Mapbox 지도 통합", memberId: null, status: "backlog", priority: "medium" },
    { title: "경로 시각화 (Polyline)", memberId: null, status: "backlog", priority: "medium" },
    { title: "앱 아이콘 & 스플래시", memberId: null, status: "backlog", priority: "low" },
  ];

  for (let i = 0; i < p3Tasks.length; i++) {
    const t = p3Tasks[i];
    const task = await db.task.create({
      data: { projectId: proj3.id, ...t, sortOrder: i, completedAt: t.status === "done" ? subDays(now, 3) : null },
    });
    if (i >= 4 && i <= 5) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblFeature.id } }).catch(() => {});
    if (i >= 6) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblDesign.id } }).catch(() => {});
  }

  // MindMap for brainstorming
  const mindmap = await db.mindMap.create({ data: { projectId: proj3.id, title: "발자취 앱 아이디어", description: "MVP 기능 브레인스토밍" } });
  const rootNode = await db.mindMapNode.create({ data: { mindMapId: mindmap.id, content: "발자취 앱", positionX: 400, positionY: 300 } });
  const n1 = await db.mindMapNode.create({ data: { mindMapId: mindmap.id, parentNodeId: rootNode.id, content: "기록", positionX: 200, positionY: 150 } });
  await db.mindMapNode.create({ data: { mindMapId: mindmap.id, parentNodeId: n1.id, content: "GPS 트래킹", positionX: 50, positionY: 80 } });
  await db.mindMapNode.create({ data: { mindMapId: mindmap.id, parentNodeId: n1.id, content: "사진 연동", positionX: 50, positionY: 150 } });
  const n2 = await db.mindMapNode.create({ data: { mindMapId: mindmap.id, parentNodeId: rootNode.id, content: "시각화", positionX: 600, positionY: 150 } });
  await db.mindMapNode.create({ data: { mindMapId: mindmap.id, parentNodeId: n2.id, content: "타임라인", positionX: 700, positionY: 80 } });
  await db.mindMapNode.create({ data: { mindMapId: mindmap.id, parentNodeId: n2.id, content: "지도 뷰", positionX: 700, positionY: 150 } });

  // Recurring for side project
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsSide.id, projectId: proj2.id, memberId: parker.id,
      title: "사이드 프로젝트 주간 회고",
      priority: "medium", frequency: "weekly", interval: 1,
      daysOfWeek: JSON.stringify([0]), timeOfDay: "20:00",
      isActive: true, nextRunAt: addWeeks(now, 1),
      labelIds: JSON.stringify([]),
      subtaskTemplates: {
        create: [
          { title: "이번 주 완료한 것 정리", sortOrder: 0 },
          { title: "다음 주 계획 세우기", sortOrder: 1 },
          { title: "블로커 & 배운 점 메모", sortOrder: 2 },
        ],
      },
    },
  });
  console.log(`✅ Project 3: 발자취 앱 (${p3Tasks.length} tasks, 4 stories, 1 objective, 2 KRs, 1 mindmap)`);

  // ─── Goals ───
  const goal1 = await db.goal.create({ data: { workspaceId: wsWork.id, title: "Q2 생산성 30% 향상", description: "자동화 시스템 도입으로 수동 작업 감소", status: "in_progress", startDate: format(subDays(now, 30), "yyyy-MM-dd"), targetDate: format(addDays(now, 60), "yyyy-MM-dd") } });
  await db.goalProject.create({ data: { goalId: goal1.id, projectId: proj1.id } });
  await db.kPI.create({ data: { goalId: goal1.id, name: "자동화율", unit: "%", targetValue: 80, currentValue: 45, direction: "increase" } });

  const goal2 = await db.goal.create({ data: { workspaceId: wsSide.id, title: "사이드 프로젝트 3개 런칭", status: "in_progress", targetDate: format(addDays(now, 180), "yyyy-MM-dd") } });
  await db.goalProject.create({ data: { goalId: goal2.id, projectId: proj2.id } });
  await db.goalProject.create({ data: { goalId: goal2.id, projectId: proj3.id } });
  console.log("✅ Goals: 2 (with KPI)");

  // ─── Activity Logs (for heatmap) ───
  for (let i = 0; i < 90; i++) {
    const count = Math.floor(Math.random() * 5);
    for (let j = 0; j < count; j++) {
      await db.activityLog.create({
        data: { entityType: "task", entityId: "seed", action: "updated", occurredAt: subDays(now, i) },
      });
    }
  }
  console.log("✅ Activity logs: ~90 days of history");

  // ─── Standup Note ───
  await db.standupNote.create({
    data: {
      date: today,
      yesterday: "센서 수집 모듈 2호기/3호기 연동 완료. DB 파이프라인 TimescaleDB 설정 완료.",
      today: "파이프라인 Kafka Consumer 구현 진행. 서버 타임아웃 이슈 디버깅.",
      blockers: "서버 커넥션 풀 이슈로 파이프라인 테스트 지연 가능성 있음.",
    },
  });
  console.log("✅ Standup note: today");

  console.log("\n🎉 Demo data seeded successfully!");
  console.log("\nSummary:");
  console.log("  - 4 Members");
  console.log("  - 2 Workspaces (업무, 사이드)");
  console.log("  - 3 Projects (CMP모니터링, 트레이딩봇, 발자취앱)");
  console.log("  - 40+ Tasks with subtasks, labels, comments");
  console.log("  - 13 Stories with KR links");
  console.log("  - 4 Objectives, 7 Key Results with snapshots");
  console.log("  - 5 Recurring templates (daily, weekly, monthly)");
  console.log("  - 1 Mind Map with nodes");
  console.log("  - 2 Goals with KPIs");
  console.log("  - Activity heatmap data");

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
