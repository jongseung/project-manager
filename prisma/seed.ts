import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up existing data...");

  // Cleanup auth/org tables
  await prisma.projectMember.deleteMany();
  await prisma.orgMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Cleanup in dependency order
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.standupNote.deleteMany();
  await prisma.taskTemplate.deleteMany();
  await prisma.kRSnapshot.deleteMany();
  await prisma.storyKRLink.deleteMany();
  await prisma.keyResult.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.story.deleteMany();
  await prisma.sprintTask.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.dailyPlanTask.deleteMany();
  await prisma.dailyPlan.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.dependency.deleteMany();
  await prisma.mindMapNode.deleteMany();
  await prisma.mindMap.deleteMany();
  await prisma.kPIEntry.deleteMany();
  await prisma.kPI.deleteMany();
  await prisma.recurringSubtask.deleteMany();
  await prisma.recurringTemplate.deleteMany();
  await prisma.boardView.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.task.deleteMany();
  await prisma.epic.deleteMany();
  await prisma.label.deleteMany();
  await prisma.goalProject.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.member.deleteMany();

  console.log("✅ Cleanup done. Seeding semiconductor data...");

  // ─── MEMBERS ───────────────────────────────────────────────
  const members = await Promise.all([
    // 설비엔지니어링
    prisma.member.create({ data: { name: "김민준", role: "설비 수석엔지니어", email: "minjun.kim@semi.co.kr", color: "#6366f1" } }),
    prisma.member.create({ data: { name: "이서연", role: "설비 엔지니어", email: "seoyeon.lee@semi.co.kr", color: "#8b5cf6" } }),
    prisma.member.create({ data: { name: "박도현", role: "설비 엔지니어", email: "dohyun.park@semi.co.kr", color: "#a78bfa" } }),
    // 공정엔지니어링
    prisma.member.create({ data: { name: "최지아", role: "공정 수석엔지니어", email: "jia.choi@semi.co.kr", color: "#ec4899" } }),
    prisma.member.create({ data: { name: "정현우", role: "공정 엔지니어", email: "hyunwoo.jung@semi.co.kr", color: "#f43f5e" } }),
    prisma.member.create({ data: { name: "윤서준", role: "공정 엔지니어", email: "seojun.yoon@semi.co.kr", color: "#fb7185" } }),
    // 혁신부서
    prisma.member.create({ data: { name: "강나은", role: "혁신 팀장", email: "naeun.kang@semi.co.kr", color: "#10b981" } }),
    prisma.member.create({ data: { name: "임준혁", role: "AI 엔지니어", email: "junhyuk.lim@semi.co.kr", color: "#34d399" } }),
    prisma.member.create({ data: { name: "한소영", role: "데이터 분석가", email: "soyoung.han@semi.co.kr", color: "#6ee7b7" } }),
  ]);
  const [mMinJun, mSeoYeon, mDoHyun, mJiA, mHyunWoo, mSeoJun, mNaEun, mJunHyuk, mSoYoung] = members;

  // ─── TASK TEMPLATES ────────────────────────────────────────
  await prisma.taskTemplate.createMany({
    data: [
      { name: "설비 긴급 이상 대응", title: "설비 긴급 이상 대응 - [설비명]", description: "1. 이상 증상 기록\n2. 원인 분석\n3. 임시 조치\n4. 근본 원인 파악\n5. 영구 대책 수립", priority: "urgent", estimatedHours: 4 },
      { name: "DOE 실험 보고서", title: "DOE 실험 결과 보고서 - [실험명]", description: "1. 실험 목적\n2. 인자 및 수준\n3. 결과 데이터\n4. 분석 및 결론\n5. 후속 조치", priority: "high", estimatedHours: 8 },
      { name: "주간 수율 리뷰", title: "주간 수율 리뷰 보고 - W[주차]", description: "1. 이번 주 수율 현황\n2. 불량 분석\n3. 개선 활동\n4. 다음 주 목표", priority: "medium", estimatedHours: 2 },
    ],
  });

  // ─── 기본 사용자 + 조직 (쿠키 기반 자동 세션) ─────────────────
  const testUser = await prisma.user.create({
    data: { email: "user@local", name: "사용자" },
  });
  const org = await prisma.organization.create({
    data: {
      name: "반도체 엔지니어링",
      slug: "semiconductor-eng",
      members: { create: { userId: testUser.id, role: "owner" } },
    },
  });
  console.log("  자동 세션: user@local (쿠키 기반)");

  // ─── WORKSPACE 1: 설비엔지니어링팀 ─────────────────────────
  const ws1 = await prisma.workspace.create({
    data: {
      name: "설비엔지니어링팀",
      description: "EUV/CVD/Etch 설비 유지보수 및 성능 최적화",
      color: "#6366f1",
      icon: "⚙️",
      organizationId: org.id,
    },
  });

  // Labels for ws1
  const [lUrgent1, lPM, lEUV, lALD, lDry] = await Promise.all([
    prisma.label.create({ data: { workspaceId: ws1.id, name: "긴급", color: "#ef4444" } }),
    prisma.label.create({ data: { workspaceId: ws1.id, name: "PM", color: "#6366f1" } }),
    prisma.label.create({ data: { workspaceId: ws1.id, name: "EUV", color: "#8b5cf6" } }),
    prisma.label.create({ data: { workspaceId: ws1.id, name: "ALD", color: "#f59e0b" } }),
    prisma.label.create({ data: { workspaceId: ws1.id, name: "건식식각", color: "#10b981" } }),
  ]);

  // BoardView for ws1
  await prisma.boardView.create({
    data: {
      workspaceId: ws1.id,
      name: "설비 작업 보드",
      isDefault: true,
      columns: JSON.stringify([
        { id: "backlog", title: "대기", color: "#94a3b8", statuses: ["backlog"] },
        { id: "todo", title: "예정", color: "#6366f1", statuses: ["todo"] },
        { id: "inprog", title: "진행중", color: "#f59e0b", statuses: ["in_progress"] },
        { id: "review", title: "검토", color: "#8b5cf6", statuses: ["in_review"] },
        { id: "done", title: "완료", color: "#10b981", statuses: ["done"] },
      ]),
    },
  });

  // RecurringTemplate for ws1
  const rt1 = await prisma.recurringTemplate.create({
    data: {
      workspaceId: ws1.id,
      title: "주간 EUV PM 보고",
      description: "EUV 스캐너 PM 결과 및 가동률 보고",
      priority: "high",
      frequency: "weekly",
      daysOfWeek: JSON.stringify([1]),
      timeOfDay: "09:00",
      isActive: true,
      nextRunAt: new Date("2026-04-20T09:00:00"),
      projectId: null,
      memberId: mMinJun.id,
    },
  });
  await prisma.recurringSubtask.createMany({
    data: [
      { recurringId: rt1.id, title: "EUV 가동률 집계", sortOrder: 0 },
      { recurringId: rt1.id, title: "PM 항목 체크리스트 작성", sortOrder: 1 },
      { recurringId: rt1.id, title: "이상 항목 보고서 첨부", sortOrder: 2 },
    ],
  });

  // Goals for ws1
  const goal1 = await prisma.goal.create({
    data: {
      workspaceId: ws1.id,
      title: "EUV 설비 가동률 99% 달성",
      description: "2026년 상반기 EUV 스캐너 가동률 목표",
      status: "in_progress",
      startDate: "2026-01-01",
      targetDate: "2026-06-30",
    },
  });

  // Project 1-1: EUV PM 최적화
  const p1 = await prisma.project.create({
    data: {
      workspaceId: ws1.id,
      name: "EUV 스캐너 PM 최적화",
      description: "EUV 노광기 예방정비 주기 및 절차 최적화를 통한 가동률 향상",
      status: "active",
      color: "#6366f1",
      startDate: "2026-01-10",
      targetDate: "2026-06-30",
      summary: "EUV 스캐너 3대의 PM 주기를 데이터 기반으로 재정의하여 비계획 다운타임 50% 감소 목표",
      problemStatement: "현재 EUV 스캐너 비계획 다운타임이 월평균 18시간으로 생산 목표 미달 발생",
      definitionOfDone: "비계획 다운타임 월 9시간 이하 + PM 소요시간 20% 단축 + 가동률 99% 달성",
    },
  });
  await prisma.goalProject.create({ data: { goalId: goal1.id, projectId: p1.id } });

  // OKR for p1
  const obj1 = await prisma.objective.create({
    data: { projectId: p1.id, title: "EUV 설비 안정성 극대화", status: "in_progress", sortOrder: 0 },
  });
  const kr1a = await prisma.keyResult.create({
    data: { objectiveId: obj1.id, title: "비계획 다운타임 감소", metricName: "월 다운타임(시간)", unit: "h", startValue: 18, currentValue: 12, targetValue: 9, direction: "decrease", deadline: "2026-06-30", sortOrder: 0 },
  });
  const kr1b = await prisma.keyResult.create({
    data: { objectiveId: obj1.id, title: "PM 소요시간 단축", metricName: "PM 소요시간(시간)", unit: "h", startValue: 10, currentValue: 8.5, targetValue: 8, direction: "decrease", deadline: "2026-06-30", sortOrder: 1 },
  });
  await prisma.kRSnapshot.createMany({
    data: [
      { keyResultId: kr1a.id, value: 18, note: "기준값", recordedAt: new Date("2026-01-10") },
      { keyResultId: kr1a.id, value: 15, note: "1월 말 측정", recordedAt: new Date("2026-01-31") },
      { keyResultId: kr1a.id, value: 12, note: "2월 말 측정", recordedAt: new Date("2026-02-28") },
      { keyResultId: kr1b.id, value: 10, note: "기준값", recordedAt: new Date("2026-01-10") },
      { keyResultId: kr1b.id, value: 8.5, note: "절차 개선 후", recordedAt: new Date("2026-02-28") },
    ],
  });

  // Milestones for p1
  await prisma.milestone.createMany({
    data: [
      { projectId: p1.id, name: "PM 데이터 분석 완료", targetDate: "2026-02-15", status: "reached", sortOrder: 0 },
      { projectId: p1.id, name: "신규 PM 절차서 승인", targetDate: "2026-03-31", status: "reached", sortOrder: 1 },
      { projectId: p1.id, name: "파일럿 적용 완료", targetDate: "2026-05-15", status: "pending", sortOrder: 2 },
      { projectId: p1.id, name: "전체 적용 및 검증", targetDate: "2026-06-30", status: "pending", sortOrder: 3 },
    ],
  });

  // KPIs for p1
  const kpi1 = await prisma.kPI.create({
    data: { projectId: p1.id, name: "EUV 가동률", unit: "%", targetValue: 99, currentValue: 97.2, direction: "increase" },
  });
  await prisma.kPIEntry.createMany({
    data: [
      { kpiId: kpi1.id, value: 94.5, recordedAt: new Date("2026-01-31"), note: "1월" },
      { kpiId: kpi1.id, value: 95.8, recordedAt: new Date("2026-02-28"), note: "2월" },
      { kpiId: kpi1.id, value: 97.2, recordedAt: new Date("2026-03-31"), note: "3월" },
    ],
  });

  // Epics & Tasks for p1
  const e1a = await prisma.epic.create({ data: { projectId: p1.id, name: "PM 현황 분석", status: "done", priority: "high", startDate: "2026-01-10", targetDate: "2026-02-15", sortOrder: 0 } });
  const e1b = await prisma.epic.create({ data: { projectId: p1.id, name: "PM 절차 개선", status: "in_progress", priority: "high", startDate: "2026-02-16", targetDate: "2026-05-15", sortOrder: 1 } });
  const e1c = await prisma.epic.create({ data: { projectId: p1.id, name: "검증 및 표준화", status: "todo", priority: "medium", startDate: "2026-05-16", targetDate: "2026-06-30", sortOrder: 2 } });

  // Stories for p1
  const story1a = await prisma.story.create({
    data: {
      projectId: p1.id, epicId: e1b.id,
      title: "PM 절차 디지털화",
      userStory: "As a 설비엔지니어, I want PM 체크리스트를 앱에서 관리, so that 누락 없이 PM을 수행할 수 있다",
      storyPoints: 8, status: "in_progress", priority: "high", sortOrder: 0,
    },
  });
  await prisma.storyKRLink.create({ data: { storyId: story1a.id, keyResultId: kr1b.id, estimatedImpact: 0.6 } });

  const t1_1 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1a.id, memberId: mMinJun.id, title: "EUV 3대 과거 2년 다운타임 데이터 수집", status: "done", priority: "high", estimatedHours: 8, actualHours: 9, sortOrder: 0, completedAt: new Date("2026-01-20") } });
  const t1_2 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1a.id, memberId: mSeoYeon.id, title: "PM 항목별 소요시간 분석", status: "done", priority: "medium", estimatedHours: 6, actualHours: 6, sortOrder: 1, completedAt: new Date("2026-02-01") } });
  const t1_3 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1a.id, memberId: mMinJun.id, title: "병목 PM 항목 도출 보고서 작성", status: "done", priority: "high", estimatedHours: 4, actualHours: 4, sortOrder: 2, completedAt: new Date("2026-02-10") } });
  const t1_4 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1b.id, memberId: mSeoYeon.id, storyId: story1a.id, title: "신규 PM 체크리스트 작성", status: "done", priority: "high", estimatedHours: 8, actualHours: 8, sortOrder: 0, completedAt: new Date("2026-03-15") } });
  const t1_5 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1b.id, memberId: mDoHyun.id, title: "PM 절차서 v2.0 초안 작성", status: "in_progress", priority: "high", estimatedHours: 12, sortOrder: 1 } });
  const t1_6 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1b.id, memberId: mMinJun.id, title: "EUV-01 파일럿 PM 실시", status: "in_progress", priority: "urgent", estimatedHours: 10, sortOrder: 2 } });
  const t1_7 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1c.id, memberId: mSeoYeon.id, title: "EUV-02/03 신규 절차 적용", status: "todo", priority: "high", estimatedHours: 20, sortOrder: 0 } });
  const t1_8 = await prisma.task.create({ data: { projectId: p1.id, epicId: e1c.id, memberId: mMinJun.id, title: "PM 표준서 최종 승인 및 배포", status: "todo", priority: "medium", estimatedHours: 4, sortOrder: 1 } });

  // Labels for tasks
  await prisma.taskLabel.createMany({
    data: [
      { taskId: t1_1.id, labelId: lEUV.id },
      { taskId: t1_2.id, labelId: lPM.id },
      { taskId: t1_4.id, labelId: lPM.id },
      { taskId: t1_5.id, labelId: lPM.id },
      { taskId: t1_6.id, labelId: lEUV.id },
      { taskId: t1_6.id, labelId: lUrgent1.id },
    ],
  });

  // Dependencies
  await prisma.dependency.createMany({
    data: [
      { predecessorTaskId: t1_1.id, successorTaskId: t1_2.id, type: "finish_to_start" },
      { predecessorTaskId: t1_2.id, successorTaskId: t1_3.id, type: "finish_to_start" },
      { predecessorTaskId: t1_4.id, successorTaskId: t1_5.id, type: "finish_to_start" },
      { predecessorTaskId: t1_5.id, successorTaskId: t1_6.id, type: "finish_to_start" },
      { predecessorTaskId: t1_6.id, successorTaskId: t1_7.id, type: "finish_to_start" },
    ],
  });

  // Comments on in-progress tasks
  await prisma.comment.createMany({
    data: [
      { taskId: t1_5.id, workspaceId: ws1.id, content: "광학계 정렬 항목 추가 필요 — 지난 PM에서 2시간 초과 발생", authorName: "김민준" },
      { taskId: t1_6.id, workspaceId: ws1.id, content: "레이저 파워 캘리브레이션 포함하여 진행 중, 예상보다 30분 초과", authorName: "이서연" },
      { taskId: t1_6.id, workspaceId: ws1.id, content: "진공도 회복 시간 체크 완료. 정상 범위 내.", authorName: "박도현" },
    ],
  });

  // Sprint for p1
  const sp1 = await prisma.sprint.create({
    data: { projectId: p1.id, name: "Sprint 3 - PM 파일럿", startDate: "2026-04-07", endDate: "2026-04-18", status: "active", goalDescription: "EUV-01 파일럿 PM 완료 및 절차서 v2.0 초안 완성" },
  });
  await prisma.sprintTask.createMany({
    data: [
      { sprintId: sp1.id, taskId: t1_5.id },
      { sprintId: sp1.id, taskId: t1_6.id },
    ],
  });

  // Project 1-2: ALD 설비 개선
  const p2 = await prisma.project.create({
    data: {
      workspaceId: ws1.id,
      name: "ALD 설비 성능 개선",
      description: "원자층증착 설비 박막 균일도 및 처리량 개선",
      status: "active",
      color: "#f59e0b",
      startDate: "2026-02-01",
      targetDate: "2026-07-31",
      summary: "ALD 설비 3대의 박막 두께 균일도를 ±2% 이하로 개선하고 wafer/hr 처리량 15% 향상",
      problemStatement: "ALD 박막 균일도 편차 ±4.2% 수준으로 양산 스펙 미달, 처리량도 목표 대비 12% 부족",
      definitionOfDone: "균일도 ±2% 이하 달성 + 처리량 wafer/hr 15% 향상 + 3개월 안정성 확인",
    },
  });

  const e2a = await prisma.epic.create({ data: { projectId: p2.id, name: "원인 분석", status: "done", priority: "high", sortOrder: 0 } });
  const e2b = await prisma.epic.create({ data: { projectId: p2.id, name: "하드웨어 최적화", status: "in_progress", priority: "high", sortOrder: 1 } });

  const t2_1 = await prisma.task.create({ data: { projectId: p2.id, epicId: e2a.id, memberId: mDoHyun.id, title: "ALD 챔버 균일도 맵핑 분석", status: "done", priority: "high", estimatedHours: 6, actualHours: 7, sortOrder: 0, completedAt: new Date("2026-02-20") } });
  const t2_2 = await prisma.task.create({ data: { projectId: p2.id, epicId: e2a.id, memberId: mSeoYeon.id, title: "가스 분배 시스템 점검", status: "done", priority: "high", estimatedHours: 4, actualHours: 4, sortOrder: 1, completedAt: new Date("2026-02-25") } });
  const t2_3 = await prisma.task.create({ data: { projectId: p2.id, epicId: e2b.id, memberId: mDoHyun.id, title: "샤워헤드 교체 및 플로우 최적화", status: "in_progress", priority: "urgent", estimatedHours: 16, sortOrder: 0 } });
  const t2_4 = await prisma.task.create({ data: { projectId: p2.id, epicId: e2b.id, memberId: mSeoYeon.id, title: "온도 프로파일 재조정", status: "in_review", priority: "high", estimatedHours: 8, actualHours: 8, sortOrder: 1 } });
  const t2_5 = await prisma.task.create({ data: { projectId: p2.id, epicId: e2b.id, memberId: mMinJun.id, title: "최적화 결과 검증 테스트 (50 wafer)", status: "todo", priority: "high", estimatedHours: 12, sortOrder: 2 } });

  await prisma.taskLabel.createMany({
    data: [
      { taskId: t2_3.id, labelId: lALD.id },
      { taskId: t2_3.id, labelId: lUrgent1.id },
      { taskId: t2_4.id, labelId: lALD.id },
    ],
  });

  // MindMap for p2
  const mm1 = await prisma.mindMap.create({ data: { projectId: p2.id, title: "ALD 균일도 개선 아이디어 맵" } });
  const mmRoot = await prisma.mindMapNode.create({ data: { mindMapId: mm1.id, content: "ALD 균일도 개선", positionX: 0, positionY: 0, color: "#f59e0b" } });
  const mmA = await prisma.mindMapNode.create({ data: { mindMapId: mm1.id, parentNodeId: mmRoot.id, content: "가스 흐름 최적화", positionX: -200, positionY: -100, color: "#6366f1" } });
  const mmB = await prisma.mindMapNode.create({ data: { mindMapId: mm1.id, parentNodeId: mmRoot.id, content: "온도 균일성", positionX: 200, positionY: -100, color: "#ec4899" } });
  const mmC = await prisma.mindMapNode.create({ data: { mindMapId: mm1.id, parentNodeId: mmRoot.id, content: "하드웨어 교체", positionX: 0, positionY: 150, color: "#10b981" } });
  await prisma.mindMapNode.createMany({
    data: [
      { mindMapId: mm1.id, parentNodeId: mmA.id, content: "샤워헤드 홀 패턴 변경", positionX: -300, positionY: -180, convertedToTaskId: t2_3.id },
      { mindMapId: mm1.id, parentNodeId: mmA.id, content: "가스 분배판 개조", positionX: -120, positionY: -200 },
      { mindMapId: mm1.id, parentNodeId: mmB.id, content: "히터 존 분할 제어", positionX: 120, positionY: -200, convertedToTaskId: t2_4.id },
      { mindMapId: mm1.id, parentNodeId: mmC.id, content: "인젝터 링 교체", positionX: -80, positionY: 230 },
    ],
  });

  const kpi2 = await prisma.kPI.create({ data: { projectId: p2.id, name: "ALD 박막 균일도", unit: "%", targetValue: 2, currentValue: 2.8, direction: "decrease" } });
  await prisma.kPIEntry.createMany({
    data: [
      { kpiId: kpi2.id, value: 4.2, recordedAt: new Date("2026-02-01"), note: "기준" },
      { kpiId: kpi2.id, value: 3.5, recordedAt: new Date("2026-03-01"), note: "샤워헤드 교체 후" },
      { kpiId: kpi2.id, value: 2.8, recordedAt: new Date("2026-04-01"), note: "온도 조정 후" },
    ],
  });

  // Project 1-3: Etch 설비 진단
  const p3 = await prisma.project.create({
    data: {
      workspaceId: ws1.id,
      name: "건식식각 설비 이상 감지 시스템",
      description: "Etch 설비 이상 조기 감지를 위한 센서 모니터링 고도화",
      status: "active",
      color: "#10b981",
      startDate: "2026-03-01",
      targetDate: "2026-08-31",
      summary: "Etch 설비 6대에 실시간 이상 감지 알고리즘 적용, 이상 감지 리드타임 80% 단축",
      problemStatement: "현재 수동 모니터링으로 설비 이상 감지까지 평균 45분 소요, 이에 따른 불량 발생",
      definitionOfDone: "이상 감지 시간 9분 이하 + 오탐률 5% 이하 + 6개월 안정 운영",
    },
  });

  const e3a = await prisma.epic.create({ data: { projectId: p3.id, name: "센서 인프라 구축", status: "in_progress", priority: "high", sortOrder: 0 } });
  const t3_1 = await prisma.task.create({ data: { projectId: p3.id, epicId: e3a.id, memberId: mSeoYeon.id, title: "Etch 설비 센서 포인트 정의 (6대)", status: "done", priority: "high", estimatedHours: 6, actualHours: 6, sortOrder: 0, completedAt: new Date("2026-03-15") } });
  const t3_2 = await prisma.task.create({ data: { projectId: p3.id, epicId: e3a.id, memberId: mDoHyun.id, title: "OPC-UA 데이터 수집 에이전트 설치", status: "in_progress", priority: "high", estimatedHours: 12, sortOrder: 1 } });
  const t3_3 = await prisma.task.create({ data: { projectId: p3.id, epicId: e3a.id, memberId: mMinJun.id, title: "이상 임계값 정의 및 알람 설정", status: "todo", priority: "high", estimatedHours: 8, sortOrder: 2 } });

  await prisma.taskLabel.create({ data: { taskId: t3_2.id, labelId: lDry.id } });

  await prisma.dependency.create({ data: { predecessorTaskId: t3_1.id, successorTaskId: t3_2.id } });
  await prisma.dependency.create({ data: { predecessorTaskId: t3_2.id, successorTaskId: t3_3.id } });

  // ─── WORKSPACE 2: 공정엔지니어링팀 ─────────────────────────
  const ws2 = await prisma.workspace.create({
    data: {
      name: "공정엔지니어링팀",
      description: "반도체 제조 수율 향상 및 공정 최적화",
      color: "#ec4899",
      icon: "🔬",
    },
  });

  const [lDOE, lYield, lLitho, lCleaning, lUrgent2] = await Promise.all([
    prisma.label.create({ data: { workspaceId: ws2.id, name: "DOE", color: "#6366f1" } }),
    prisma.label.create({ data: { workspaceId: ws2.id, name: "수율", color: "#10b981" } }),
    prisma.label.create({ data: { workspaceId: ws2.id, name: "리소그래피", color: "#8b5cf6" } }),
    prisma.label.create({ data: { workspaceId: ws2.id, name: "세정", color: "#f59e0b" } }),
    prisma.label.create({ data: { workspaceId: ws2.id, name: "긴급", color: "#ef4444" } }),
  ]);

  await prisma.boardView.create({
    data: {
      workspaceId: ws2.id,
      name: "공정 개선 보드",
      isDefault: true,
      columns: JSON.stringify([
        { id: "backlog", title: "검토대기", color: "#94a3b8", statuses: ["backlog"] },
        { id: "todo", title: "계획", color: "#6366f1", statuses: ["todo"] },
        { id: "inprog", title: "실험중", color: "#f59e0b", statuses: ["in_progress"] },
        { id: "review", title: "분석중", color: "#8b5cf6", statuses: ["in_review"] },
        { id: "done", title: "완료", color: "#10b981", statuses: ["done", "cancelled"] },
      ]),
    },
  });

  const rt2 = await prisma.recurringTemplate.create({
    data: {
      workspaceId: ws2.id,
      title: "일일 수율 체크",
      description: "전일 라인별 수율 집계 및 이슈 확인",
      priority: "high",
      frequency: "daily",
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]),
      timeOfDay: "08:30",
      isActive: true,
      nextRunAt: new Date("2026-04-16T08:30:00"),
      memberId: mJiA.id,
    },
  });
  await prisma.recurringSubtask.createMany({
    data: [
      { recurringId: rt2.id, title: "MES 수율 데이터 추출", sortOrder: 0 },
      { recurringId: rt2.id, title: "전일 대비 변동 분석", sortOrder: 1 },
      { recurringId: rt2.id, title: "이상 로트 확인 및 홀드 조치", sortOrder: 2 },
    ],
  });

  const goal2 = await prisma.goal.create({
    data: {
      workspaceId: ws2.id,
      title: "양산 수율 95% 달성",
      description: "2026년 상반기 전체 공정 라인 수율 목표",
      status: "in_progress",
      startDate: "2026-01-01",
      targetDate: "2026-06-30",
    },
  });

  // Project 2-1: 수율 개선
  const p4 = await prisma.project.create({
    data: {
      workspaceId: ws2.id,
      name: "7nm 공정 수율 개선",
      description: "7nm 핀펫 공정 게이트 패터닝 수율 개선 프로젝트",
      status: "active",
      color: "#ec4899",
      startDate: "2026-01-05",
      targetDate: "2026-06-30",
      summary: "7nm 공정 게이트 패터닝 불량률을 현재 8.3%에서 4% 이하로 개선",
      problemStatement: "게이트 패터닝 단계에서 CD uniformity 불량으로 수율 손실 발생, 월 약 2억원 손실 추산",
      definitionOfDone: "불량률 4% 이하 + 3개월 연속 유지 + 표준 공정 레시피 확정",
    },
  });
  await prisma.goalProject.create({ data: { goalId: goal2.id, projectId: p4.id } });

  const obj2 = await prisma.objective.create({
    data: { projectId: p4.id, title: "게이트 패터닝 불량 제거", status: "in_progress", sortOrder: 0 },
  });
  const kr2a = await prisma.keyResult.create({
    data: { objectiveId: obj2.id, title: "게이트 CD 불량률 감소", metricName: "불량률", unit: "%", startValue: 8.3, currentValue: 5.9, targetValue: 4.0, direction: "decrease", deadline: "2026-06-30", sortOrder: 0 },
  });
  const kr2b = await prisma.keyResult.create({
    data: { objectiveId: obj2.id, title: "CD 균일도 개선", metricName: "CDU (3σ)", unit: "nm", startValue: 3.8, currentValue: 2.6, targetValue: 2.0, direction: "decrease", deadline: "2026-06-30", sortOrder: 1 },
  });
  await prisma.kRSnapshot.createMany({
    data: [
      { keyResultId: kr2a.id, value: 8.3, recordedAt: new Date("2026-01-05"), note: "초기" },
      { keyResultId: kr2a.id, value: 7.1, recordedAt: new Date("2026-02-01") },
      { keyResultId: kr2a.id, value: 5.9, recordedAt: new Date("2026-03-01") },
      { keyResultId: kr2b.id, value: 3.8, recordedAt: new Date("2026-01-05"), note: "초기" },
      { keyResultId: kr2b.id, value: 3.1, recordedAt: new Date("2026-02-15") },
      { keyResultId: kr2b.id, value: 2.6, recordedAt: new Date("2026-03-31") },
    ],
  });

  const kpi3 = await prisma.kPI.create({ data: { projectId: p4.id, name: "7nm 수율", unit: "%", targetValue: 96, currentValue: 91.7, direction: "increase" } });
  await prisma.kPIEntry.createMany({
    data: [
      { kpiId: kpi3.id, value: 88.2, recordedAt: new Date("2026-01-31"), note: "1월" },
      { kpiId: kpi3.id, value: 90.1, recordedAt: new Date("2026-02-28"), note: "2월" },
      { kpiId: kpi3.id, value: 91.7, recordedAt: new Date("2026-03-31"), note: "3월" },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { projectId: p4.id, name: "불량 모드 분류 완료", targetDate: "2026-02-10", status: "reached", sortOrder: 0 },
      { projectId: p4.id, name: "개선 레시피 DOE 완료", targetDate: "2026-03-31", status: "reached", sortOrder: 1 },
      { projectId: p4.id, name: "양산 적용 및 검증", targetDate: "2026-05-31", status: "pending", sortOrder: 2 },
    ],
  });

  const e4a = await prisma.epic.create({ data: { projectId: p4.id, name: "불량 분석", status: "done", priority: "urgent", sortOrder: 0 } });
  const e4b = await prisma.epic.create({ data: { projectId: p4.id, name: "공정 파라미터 최적화", status: "in_progress", priority: "high", sortOrder: 1 } });
  const e4c = await prisma.epic.create({ data: { projectId: p4.id, name: "양산 전환", status: "todo", priority: "high", sortOrder: 2 } });

  // Stories for p4
  const story4a = await prisma.story.create({
    data: {
      projectId: p4.id, epicId: e4b.id,
      title: "OPC 보정 레시피 최적화",
      userStory: "As a 공정엔지니어, I want OPC 보정값을 자동 최적화, so that CD uniformity를 개선할 수 있다",
      storyPoints: 13, status: "in_progress", priority: "high", sortOrder: 0,
    },
  });
  await prisma.storyKRLink.create({ data: { storyId: story4a.id, keyResultId: kr2b.id, estimatedImpact: 0.7 } });

  const t4_1 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4a.id, memberId: mJiA.id, title: "불량 웨이퍼 SEM 분석 (50ea)", status: "done", priority: "urgent", estimatedHours: 16, actualHours: 18, sortOrder: 0, completedAt: new Date("2026-01-25") } });
  const t4_2 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4a.id, memberId: mHyunWoo.id, title: "불량 모드별 Pareto 분석", status: "done", priority: "high", estimatedHours: 6, actualHours: 6, sortOrder: 1, completedAt: new Date("2026-02-05") } });
  const t4_3 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4b.id, memberId: mHyunWoo.id, storyId: story4a.id, title: "OPC 보정 DOE 설계 (L9 다구찌)", status: "done", priority: "high", estimatedHours: 8, actualHours: 8, sortOrder: 0, completedAt: new Date("2026-03-10") } });
  const t4_4 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4b.id, memberId: mJiA.id, storyId: story4a.id, title: "DOE 실험 실시 및 데이터 수집", status: "done", priority: "high", estimatedHours: 24, actualHours: 26, sortOrder: 1, completedAt: new Date("2026-03-28") } });
  const t4_5 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4b.id, memberId: mSeoJun.id, title: "최적 조건 검증 실험 (3회)", status: "in_progress", priority: "high", estimatedHours: 16, sortOrder: 2 } });
  const t4_6 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4b.id, memberId: mHyunWoo.id, title: "노광 에너지 최적화 추가 검증", status: "in_review", priority: "high", estimatedHours: 8, actualHours: 8, sortOrder: 3 } });
  const t4_7 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4c.id, memberId: mJiA.id, title: "표준 레시피 SPEC 작성", status: "todo", priority: "high", estimatedHours: 6, sortOrder: 0 } });
  const t4_8 = await prisma.task.create({ data: { projectId: p4.id, epicId: e4c.id, memberId: mSeoJun.id, title: "양산 100 lot 파일럿 런", status: "todo", priority: "high", estimatedHours: 40, sortOrder: 1 } });

  // Subtask
  const t4_5_sub1 = await prisma.task.create({ data: { projectId: p4.id, parentTaskId: t4_5.id, memberId: mSeoJun.id, title: "1차 검증 실험 (Focus margin)", status: "done", priority: "high", estimatedHours: 5, actualHours: 5, sortOrder: 0, completedAt: new Date("2026-04-10") } });
  const t4_5_sub2 = await prisma.task.create({ data: { projectId: p4.id, parentTaskId: t4_5.id, memberId: mSeoJun.id, title: "2차 검증 실험 (Dose)", status: "in_progress", priority: "high", estimatedHours: 5, sortOrder: 1 } });
  const t4_5_sub3 = await prisma.task.create({ data: { projectId: p4.id, parentTaskId: t4_5.id, memberId: mHyunWoo.id, title: "3차 검증 실험 (Aberration)", status: "todo", priority: "medium", estimatedHours: 6, sortOrder: 2 } });

  await prisma.taskLabel.createMany({
    data: [
      { taskId: t4_3.id, labelId: lDOE.id },
      { taskId: t4_4.id, labelId: lDOE.id },
      { taskId: t4_5.id, labelId: lYield.id },
      { taskId: t4_6.id, labelId: lLitho.id },
      { taskId: t4_1.id, labelId: lUrgent2.id },
    ],
  });

  await prisma.dependency.createMany({
    data: [
      { predecessorTaskId: t4_1.id, successorTaskId: t4_2.id },
      { predecessorTaskId: t4_2.id, successorTaskId: t4_3.id },
      { predecessorTaskId: t4_3.id, successorTaskId: t4_4.id },
      { predecessorTaskId: t4_4.id, successorTaskId: t4_5.id },
      { predecessorTaskId: t4_5.id, successorTaskId: t4_7.id },
    ],
  });

  await prisma.comment.createMany({
    data: [
      { taskId: t4_5.id, workspaceId: ws2.id, content: "1차 결과: CDU 2.4nm. 목표(2.0nm)보다 살짝 높음. 2차 dose 최적화로 해결 기대", authorName: "최지아" },
      { taskId: t4_6.id, workspaceId: ws2.id, content: "노광 에너지 ±5% 범위에서 테스트 완료. 최적값 22.3mJ/cm² 확인됨", authorName: "정현우" },
    ],
  });

  const sp2 = await prisma.sprint.create({
    data: { projectId: p4.id, name: "Sprint 5 - 검증 실험", startDate: "2026-04-07", endDate: "2026-04-18", status: "active", goalDescription: "최적 조건 3차 검증 완료 및 표준 레시피 초안 작성" },
  });
  await prisma.sprintTask.createMany({
    data: [{ sprintId: sp2.id, taskId: t4_5.id }, { sprintId: sp2.id, taskId: t4_6.id }, { sprintId: sp2.id, taskId: t4_7.id }],
  });

  // Project 2-2: 세정 공정
  const p5 = await prisma.project.create({
    data: {
      workspaceId: ws2.id,
      name: "세정 공정 최적화",
      description: "금속 오염 및 파티클 제거 효율 향상을 위한 세정 공정 개선",
      status: "active",
      color: "#f59e0b",
      startDate: "2026-02-15",
      targetDate: "2026-07-15",
      summary: "세정 후 금속 불순물 농도 10x 저감 및 파티클 defect 50% 감소",
      problemStatement: "세정 후 Fe, Cu 오염이 간헐적 스펙 초과, 파티클 관련 수율 손실 3% 발생",
      definitionOfDone: "금속 오염 스펙 이내 6개월 유지 + 파티클 defect 밀도 0.05/cm² 이하",
    },
  });

  const e5a = await prisma.epic.create({ data: { projectId: p5.id, name: "오염 분석", status: "in_progress", priority: "high", sortOrder: 0 } });
  const t5_1 = await prisma.task.create({ data: { projectId: p5.id, epicId: e5a.id, memberId: mSeoJun.id, title: "ICP-MS 금속 오염 분석 (20 lots)", status: "in_progress", priority: "high", estimatedHours: 12, sortOrder: 0 } });
  const t5_2 = await prisma.task.create({ data: { projectId: p5.id, epicId: e5a.id, memberId: mJiA.id, title: "오염 소스 트레이싱", status: "todo", priority: "high", estimatedHours: 8, sortOrder: 1 } });
  await prisma.taskLabel.create({ data: { taskId: t5_1.id, labelId: lCleaning.id } });
  await prisma.dependency.create({ data: { predecessorTaskId: t5_1.id, successorTaskId: t5_2.id } });

  // MindMap for p4
  const mm2 = await prisma.mindMap.create({ data: { projectId: p4.id, title: "7nm 수율 개선 전략" } });
  const mm2Root = await prisma.mindMapNode.create({ data: { mindMapId: mm2.id, content: "7nm 수율 개선", positionX: 0, positionY: 0, color: "#ec4899" } });
  const mm2A = await prisma.mindMapNode.create({ data: { mindMapId: mm2.id, parentNodeId: mm2Root.id, content: "리소그래피 개선", positionX: -250, positionY: -80, color: "#6366f1" } });
  const mm2B = await prisma.mindMapNode.create({ data: { mindMapId: mm2.id, parentNodeId: mm2Root.id, content: "식각 균일성", positionX: 250, positionY: -80, color: "#f59e0b" } });
  await prisma.mindMapNode.createMany({
    data: [
      { mindMapId: mm2.id, parentNodeId: mm2A.id, content: "OPC 최적화", positionX: -350, positionY: -160, convertedToTaskId: t4_3.id },
      { mindMapId: mm2.id, parentNodeId: mm2A.id, content: "Dose/Focus 마진 확대", positionX: -150, positionY: -180 },
      { mindMapId: mm2.id, parentNodeId: mm2B.id, content: "플라즈마 균일도 개선", positionX: 150, positionY: -180 },
    ],
  });

  // ─── WORKSPACE 3: 혁신부서 ──────────────────────────────────
  const ws3 = await prisma.workspace.create({
    data: {
      name: "혁신부서",
      description: "AI/ML 기반 반도체 공정 지능화 및 스마트팩토리 구축",
      color: "#10b981",
      icon: "🚀",
    },
  });

  const [lAI, lML, lData, lAutomation, lUrgent3] = await Promise.all([
    prisma.label.create({ data: { workspaceId: ws3.id, name: "AI", color: "#6366f1" } }),
    prisma.label.create({ data: { workspaceId: ws3.id, name: "ML", color: "#8b5cf6" } }),
    prisma.label.create({ data: { workspaceId: ws3.id, name: "데이터", color: "#f59e0b" } }),
    prisma.label.create({ data: { workspaceId: ws3.id, name: "자동화", color: "#10b981" } }),
    prisma.label.create({ data: { workspaceId: ws3.id, name: "긴급", color: "#ef4444" } }),
  ]);

  await prisma.boardView.create({
    data: {
      workspaceId: ws3.id,
      name: "혁신 프로젝트 보드",
      isDefault: true,
      columns: JSON.stringify([
        { id: "backlog", title: "아이디어", color: "#94a3b8", statuses: ["backlog"] },
        { id: "todo", title: "착수예정", color: "#6366f1", statuses: ["todo"] },
        { id: "inprog", title: "개발중", color: "#f59e0b", statuses: ["in_progress"] },
        { id: "review", title: "검증중", color: "#8b5cf6", statuses: ["in_review"] },
        { id: "done", title: "완료/배포", color: "#10b981", statuses: ["done"] },
      ]),
    },
  });

  const rt3 = await prisma.recurringTemplate.create({
    data: {
      workspaceId: ws3.id,
      title: "AI 모델 주간 리뷰",
      description: "배포된 AI 모델 성능 지표 리뷰 및 드리프트 감지",
      priority: "medium",
      frequency: "weekly",
      daysOfWeek: JSON.stringify([5]),
      timeOfDay: "14:00",
      isActive: true,
      nextRunAt: new Date("2026-04-18T14:00:00"),
      memberId: mNaEun.id,
    },
  });
  await prisma.recurringSubtask.createMany({
    data: [
      { recurringId: rt3.id, title: "모델 정확도 지표 수집", sortOrder: 0 },
      { recurringId: rt3.id, title: "데이터 드리프트 분석", sortOrder: 1 },
      { recurringId: rt3.id, title: "리트레이닝 필요 여부 판단", sortOrder: 2 },
    ],
  });

  const goal3 = await prisma.goal.create({
    data: {
      workspaceId: ws3.id,
      title: "AI 기반 공정 자동화 50% 달성",
      description: "2026년 내 반복 공정 판단의 50%를 AI가 자동 처리",
      status: "in_progress",
      startDate: "2026-01-01",
      targetDate: "2026-12-31",
    },
  });

  // Project 3-1: AI 결함검출
  const p6 = await prisma.project.create({
    data: {
      workspaceId: ws3.id,
      name: "AI 결함 자동 검출 시스템",
      description: "딥러닝 기반 웨이퍼 외관 검사 자동화 - 검사 시간 90% 단축",
      status: "active",
      color: "#10b981",
      startDate: "2026-01-15",
      targetDate: "2026-09-30",
      summary: "CNN 기반 결함 검출 모델로 검사원 육안 검사 대체, 검출률 99.5% 이상 목표",
      problemStatement: "현재 육안 검사 의존으로 검사 처리량 한계(200 wafer/day)와 검사자 피로에 의한 오검출(약 2%) 발생",
      definitionOfDone: "검출 정확도 99.5% + FP율 0.5% 이하 + 처리량 1000 wafer/day + 6개월 양산 안정",
    },
  });
  await prisma.goalProject.create({ data: { goalId: goal3.id, projectId: p6.id } });

  const obj3 = await prisma.objective.create({
    data: { projectId: p6.id, title: "AI 검출 시스템 양산 배포", status: "in_progress", sortOrder: 0 },
  });
  const kr3a = await prisma.keyResult.create({
    data: { objectiveId: obj3.id, title: "결함 검출 정확도", metricName: "Accuracy", unit: "%", startValue: 85, currentValue: 97.8, targetValue: 99.5, direction: "increase", deadline: "2026-09-30", sortOrder: 0 },
  });
  const kr3b = await prisma.keyResult.create({
    data: { objectiveId: obj3.id, title: "검사 처리량", metricName: "wafer/day", unit: "ea", startValue: 200, currentValue: 750, targetValue: 1000, direction: "increase", deadline: "2026-09-30", sortOrder: 1 },
  });
  await prisma.kRSnapshot.createMany({
    data: [
      { keyResultId: kr3a.id, value: 85, recordedAt: new Date("2026-01-15"), note: "초기 모델" },
      { keyResultId: kr3a.id, value: 92, recordedAt: new Date("2026-02-15"), note: "v1.0" },
      { keyResultId: kr3a.id, value: 95.5, recordedAt: new Date("2026-03-15"), note: "v1.1 (데이터 증강)" },
      { keyResultId: kr3a.id, value: 97.8, recordedAt: new Date("2026-04-10"), note: "v1.2 (앙상블)" },
      { keyResultId: kr3b.id, value: 200, recordedAt: new Date("2026-01-15") },
      { keyResultId: kr3b.id, value: 450, recordedAt: new Date("2026-02-28"), note: "GPU 서버 증설" },
      { keyResultId: kr3b.id, value: 750, recordedAt: new Date("2026-04-01"), note: "배치 최적화" },
    ],
  });

  const kpi4 = await prisma.kPI.create({ data: { projectId: p6.id, name: "AI 검출 정확도", unit: "%", targetValue: 99.5, currentValue: 97.8, direction: "increase" } });
  await prisma.kPIEntry.createMany({
    data: [
      { kpiId: kpi4.id, value: 85, recordedAt: new Date("2026-01-31") },
      { kpiId: kpi4.id, value: 92, recordedAt: new Date("2026-02-28") },
      { kpiId: kpi4.id, value: 95.5, recordedAt: new Date("2026-03-15") },
      { kpiId: kpi4.id, value: 97.8, recordedAt: new Date("2026-04-10") },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { projectId: p6.id, name: "학습 데이터셋 구축 완료", targetDate: "2026-03-15", status: "reached", sortOrder: 0 },
      { projectId: p6.id, name: "v1.0 모델 검증 완료", targetDate: "2026-04-30", status: "pending", sortOrder: 1 },
      { projectId: p6.id, name: "파일럿 라인 배포", targetDate: "2026-06-30", status: "pending", sortOrder: 2 },
      { projectId: p6.id, name: "전체 라인 양산 배포", targetDate: "2026-09-30", status: "pending", sortOrder: 3 },
    ],
  });

  const e6a = await prisma.epic.create({ data: { projectId: p6.id, name: "데이터 파이프라인", status: "done", priority: "high", sortOrder: 0 } });
  const e6b = await prisma.epic.create({ data: { projectId: p6.id, name: "모델 개발", status: "in_progress", priority: "high", sortOrder: 1 } });
  const e6c = await prisma.epic.create({ data: { projectId: p6.id, name: "시스템 통합 및 배포", status: "todo", priority: "high", sortOrder: 2 } });

  // Stories for p6
  const story6a = await prisma.story.create({
    data: {
      projectId: p6.id, epicId: e6b.id,
      title: "앙상블 모델로 정확도 개선",
      userStory: "As a 품질 검사원, I want AI가 여러 모델 예측을 앙상블로 결합, so that 단일 모델 대비 정확도가 향상된다",
      storyPoints: 21, status: "in_review", priority: "high", sortOrder: 0,
    },
  });
  await prisma.storyKRLink.create({ data: { storyId: story6a.id, keyResultId: kr3a.id, estimatedImpact: 0.8 } });

  const story6b = await prisma.story.create({
    data: {
      projectId: p6.id, epicId: e6c.id,
      title: "MES 연동 자동 리포팅",
      userStory: "As a 공정 관리자, I want 검출 결과가 MES에 자동 업로드, so that 수동 입력 없이 traceability가 확보된다",
      storyPoints: 8, status: "backlog", priority: "medium", sortOrder: 1,
    },
  });

  const t6_1 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6a.id, memberId: mJunHyuk.id, title: "웨이퍼 이미지 20,000장 수집 및 라벨링", status: "done", priority: "high", estimatedHours: 40, actualHours: 48, sortOrder: 0, completedAt: new Date("2026-02-28") } });
  const t6_2 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6a.id, memberId: mSoYoung.id, title: "데이터 증강 파이프라인 구축", status: "done", priority: "high", estimatedHours: 16, actualHours: 16, sortOrder: 1, completedAt: new Date("2026-03-10") } });
  const t6_3 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6b.id, memberId: mJunHyuk.id, storyId: story6a.id, title: "EfficientNet-B4 기반 분류 모델 학습", status: "done", priority: "high", estimatedHours: 24, actualHours: 22, sortOrder: 0, completedAt: new Date("2026-03-25") } });
  const t6_4 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6b.id, memberId: mJunHyuk.id, storyId: story6a.id, title: "앙상블 모델 구현 및 최적화", status: "in_review", priority: "high", estimatedHours: 16, actualHours: 16, sortOrder: 1 } });
  const t6_5 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6b.id, memberId: mSoYoung.id, title: "모델 성능 평가 보고서 작성", status: "in_progress", priority: "high", estimatedHours: 8, sortOrder: 2 } });
  const t6_6 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6b.id, memberId: mNaEun.id, title: "v1.2 모델 최종 검증 (1000 wafer)", status: "todo", priority: "urgent", estimatedHours: 20, sortOrder: 3 } });
  const t6_7 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6c.id, memberId: mJunHyuk.id, storyId: story6b.id, title: "FastAPI 추론 서버 구축", status: "todo", priority: "high", estimatedHours: 16, sortOrder: 0 } });
  const t6_8 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6c.id, memberId: mSoYoung.id, storyId: story6b.id, title: "MES 연동 API 개발", status: "todo", priority: "high", estimatedHours: 12, sortOrder: 1 } });
  const t6_9 = await prisma.task.create({ data: { projectId: p6.id, epicId: e6c.id, memberId: mNaEun.id, title: "파일럿 라인 PoC 배포", status: "backlog", priority: "medium", estimatedHours: 8, sortOrder: 2 } });

  await prisma.taskLabel.createMany({
    data: [
      { taskId: t6_1.id, labelId: lData.id },
      { taskId: t6_2.id, labelId: lData.id },
      { taskId: t6_3.id, labelId: lML.id },
      { taskId: t6_4.id, labelId: lML.id },
      { taskId: t6_4.id, labelId: lAI.id },
      { taskId: t6_6.id, labelId: lUrgent3.id },
      { taskId: t6_7.id, labelId: lAutomation.id },
      { taskId: t6_8.id, labelId: lAutomation.id },
    ],
  });

  await prisma.dependency.createMany({
    data: [
      { predecessorTaskId: t6_1.id, successorTaskId: t6_2.id },
      { predecessorTaskId: t6_2.id, successorTaskId: t6_3.id },
      { predecessorTaskId: t6_3.id, successorTaskId: t6_4.id },
      { predecessorTaskId: t6_4.id, successorTaskId: t6_5.id },
      { predecessorTaskId: t6_4.id, successorTaskId: t6_6.id },
      { predecessorTaskId: t6_6.id, successorTaskId: t6_7.id },
      { predecessorTaskId: t6_7.id, successorTaskId: t6_8.id },
      { predecessorTaskId: t6_8.id, successorTaskId: t6_9.id },
    ],
  });

  await prisma.comment.createMany({
    data: [
      { taskId: t6_4.id, workspaceId: ws3.id, content: "EfficientNet + ResNet50 앙상블 결과: 97.8% → 기존 단일 모델(95.5%) 대비 2.3%p 개선. FP율도 1.2%→0.7%로 감소", authorName: "임준혁" },
      { taskId: t6_5.id, workspaceId: ws3.id, content: "Confusion matrix 분석 완료. 스크래치 결함 검출률이 96.2%로 가장 낮음. 추가 데이터 수집 필요할 수 있음", authorName: "한소영" },
      { taskId: t6_6.id, workspaceId: ws3.id, content: "검증 wafer 중 edge-die 결함 오탐 3건 발생. Post-processing 로직 보강 필요", authorName: "강나은" },
    ],
  });

  const sp3 = await prisma.sprint.create({
    data: { projectId: p6.id, name: "Sprint 4 - 모델 검증", startDate: "2026-04-07", endDate: "2026-04-25", status: "active", goalDescription: "앙상블 모델 검증 완료 및 v1.2 최종 검증 착수" },
  });
  await prisma.sprintTask.createMany({
    data: [{ sprintId: sp3.id, taskId: t6_4.id }, { sprintId: sp3.id, taskId: t6_5.id }, { sprintId: sp3.id, taskId: t6_6.id }],
  });

  // Project 3-2: 수율 예측 모델
  const p7 = await prisma.project.create({
    data: {
      workspaceId: ws3.id,
      name: "수율 예측 ML 모델",
      description: "공정 파라미터 기반 수율 예측 모델 개발로 선제적 공정 제어 실현",
      status: "active",
      color: "#6366f1",
      startDate: "2026-03-01",
      targetDate: "2026-10-31",
      summary: "LSTM + XGBoost 앙상블 모델로 72시간 전 수율 예측 정확도 90% 달성",
      problemStatement: "수율 저하를 사후 확인 후 대응하여 이미 불량 로트 발생 후 조치, 예방적 대응 불가",
      definitionOfDone: "72시간 전 예측 정확도 90% + 예측 기반 공정 조정으로 수율 2%p 개선",
    },
  });
  await prisma.goalProject.create({ data: { goalId: goal3.id, projectId: p7.id } });

  const e7a = await prisma.epic.create({ data: { projectId: p7.id, name: "데이터 수집 및 전처리", status: "in_progress", priority: "high", sortOrder: 0 } });
  const e7b = await prisma.epic.create({ data: { projectId: p7.id, name: "모델 개발", status: "todo", priority: "high", sortOrder: 1 } });

  const t7_1 = await prisma.task.create({ data: { projectId: p7.id, epicId: e7a.id, memberId: mSoYoung.id, title: "공정 파라미터 Feature 정의 (200개 변수)", status: "in_progress", priority: "high", estimatedHours: 16, sortOrder: 0 } });
  const t7_2 = await prisma.task.create({ data: { projectId: p7.id, epicId: e7a.id, memberId: mJunHyuk.id, title: "MES/SPC 데이터 파이프라인 구축", status: "in_progress", priority: "high", estimatedHours: 24, sortOrder: 1 } });
  const t7_3 = await prisma.task.create({ data: { projectId: p7.id, epicId: e7b.id, memberId: mJunHyuk.id, title: "LSTM 시계열 모델 프로토타입", status: "todo", priority: "high", estimatedHours: 32, sortOrder: 0 } });
  const t7_4 = await prisma.task.create({ data: { projectId: p7.id, epicId: e7b.id, memberId: mSoYoung.id, title: "XGBoost 베이스라인 모델 학습", status: "todo", priority: "medium", estimatedHours: 16, sortOrder: 1 } });

  await prisma.taskLabel.createMany({
    data: [
      { taskId: t7_1.id, labelId: lData.id },
      { taskId: t7_2.id, labelId: lData.id },
      { taskId: t7_3.id, labelId: lML.id },
      { taskId: t7_4.id, labelId: lML.id },
    ],
  });
  await prisma.dependency.createMany({
    data: [
      { predecessorTaskId: t7_1.id, successorTaskId: t7_3.id },
      { predecessorTaskId: t7_2.id, successorTaskId: t7_3.id },
      { predecessorTaskId: t7_2.id, successorTaskId: t7_4.id },
    ],
  });

  // Project 3-3: 디지털 트윈
  const p8 = await prisma.project.create({
    data: {
      workspaceId: ws3.id,
      name: "디지털 트윈 파일럿",
      description: "CVD 공정 디지털 트윈 구축으로 가상 실험 및 최적화 지원",
      status: "active",
      color: "#8b5cf6",
      startDate: "2026-04-01",
      targetDate: "2026-12-31",
      summary: "CVD 챔버 물리 기반 시뮬레이션 모델과 실제 설비 실시간 동기화",
      problemStatement: "신규 공정 레시피 개발 시 실제 설비 실험에 3~4주 소요, DOE 비용 과다 발생",
      definitionOfDone: "시뮬레이션 예측 오차 5% 이하 + 레시피 개발 기간 50% 단축",
    },
  });

  const e8a = await prisma.epic.create({ data: { projectId: p8.id, name: "물리 모델링", status: "in_progress", priority: "high", sortOrder: 0 } });
  const t8_1 = await prisma.task.create({ data: { projectId: p8.id, epicId: e8a.id, memberId: mNaEun.id, title: "CVD 챔버 CFD 시뮬레이션 모델 설계", status: "in_progress", priority: "high", estimatedHours: 40, sortOrder: 0 } });
  const t8_2 = await prisma.task.create({ data: { projectId: p8.id, epicId: e8a.id, memberId: mJunHyuk.id, title: "실시간 데이터 동기화 인터페이스 설계", status: "todo", priority: "high", estimatedHours: 24, sortOrder: 1 } });

  await prisma.taskLabel.createMany({
    data: [{ taskId: t8_1.id, labelId: lAI.id }, { taskId: t8_2.id, labelId: lData.id }],
  });

  const kpi5 = await prisma.kPI.create({ data: { projectId: p7.id, name: "수율 예측 정확도", unit: "%", targetValue: 90, currentValue: 0, direction: "increase" } });
  const kpi6 = await prisma.kPI.create({ data: { goalId: goal3.id, name: "AI 자동화 커버리지", unit: "%", targetValue: 50, currentValue: 18, direction: "increase" } });
  await prisma.kPIEntry.createMany({
    data: [
      { kpiId: kpi6.id, value: 5, recordedAt: new Date("2026-01-31"), note: "1월: AI 검사 초기 도입" },
      { kpiId: kpi6.id, value: 12, recordedAt: new Date("2026-02-28"), note: "2월" },
      { kpiId: kpi6.id, value: 18, recordedAt: new Date("2026-03-31"), note: "3월: 수율예측 착수" },
    ],
  });

  // MindMap for ws3 standalone
  const mm3 = await prisma.mindMap.create({ data: { projectId: p6.id, title: "AI 검사 시스템 아키텍처" } });
  const mm3Root = await prisma.mindMapNode.create({ data: { mindMapId: mm3.id, content: "AI 검사 시스템", positionX: 0, positionY: 0, color: "#10b981" } });
  const mm3A = await prisma.mindMapNode.create({ data: { mindMapId: mm3.id, parentNodeId: mm3Root.id, content: "데이터 수집", positionX: -300, positionY: 0, color: "#6366f1" } });
  const mm3B = await prisma.mindMapNode.create({ data: { mindMapId: mm3.id, parentNodeId: mm3Root.id, content: "추론 엔진", positionX: 0, positionY: -150, color: "#ec4899" } });
  const mm3C = await prisma.mindMapNode.create({ data: { mindMapId: mm3.id, parentNodeId: mm3Root.id, content: "결과 연동", positionX: 300, positionY: 0, color: "#f59e0b" } });
  await prisma.mindMapNode.createMany({
    data: [
      { mindMapId: mm3.id, parentNodeId: mm3A.id, content: "이미지 캡처 카메라", positionX: -420, positionY: -80 },
      { mindMapId: mm3.id, parentNodeId: mm3A.id, content: "전처리 파이프라인", positionX: -420, positionY: 80, convertedToTaskId: t6_2.id },
      { mindMapId: mm3.id, parentNodeId: mm3B.id, content: "앙상블 모델 서빙", positionX: -80, positionY: -260, convertedToTaskId: t6_7.id },
      { mindMapId: mm3.id, parentNodeId: mm3C.id, content: "MES 연동", positionX: 420, positionY: -80, convertedToTaskId: t6_8.id },
      { mindMapId: mm3.id, parentNodeId: mm3C.id, content: "대시보드", positionX: 420, positionY: 80 },
    ],
  });

  // ─── DAILY PLAN ─────────────────────────────────────────────
  const dp = await prisma.dailyPlan.create({
    data: {
      date: "2026-04-15",
      notes: "EUV PM 파일럿 집중 완료 목표. AI 모델 앙상블 검증 리뷰 예정.",
    },
  });
  await prisma.dailyPlanTask.createMany({
    data: [
      { dailyPlanId: dp.id, taskId: t1_6.id, sortOrder: 0 },
      { dailyPlanId: dp.id, taskId: t1_5.id, sortOrder: 1 },
      { dailyPlanId: dp.id, taskId: t6_4.id, sortOrder: 2 },
      { dailyPlanId: dp.id, taskId: t6_5.id, sortOrder: 3 },
      { dailyPlanId: dp.id, taskId: t4_5.id, sortOrder: 4 },
    ],
  });

  // ─── STANDUP NOTE ───────────────────────────────────────────
  await prisma.standupNote.create({
    data: {
      date: "2026-04-15",
      yesterday: "- EUV-01 PM 절차서 v2.0 초안 70% 완성 (이서연)\n- AI 앙상블 모델 구현 완료, 정확도 97.8% 달성 (임준혁)\n- 7nm DOE 1차 검증 실험 완료, CDU 2.4nm 측정 (윤서준)",
      today: "- EUV-01 파일럿 PM 실시 완료 목표 (박도현)\n- PM 절차서 v2.0 초안 완성 (이서연)\n- AI 모델 성능 평가 보고서 작성 (한소영)\n- 7nm DOE 2차 Dose 최적화 실험 (윤서준)",
      blockers: "- ALD 샤워헤드 납기 지연: 예상 2일 후 입고, t2_3 task 일정 영향\n- GPU 서버 메모리 부족으로 배치 크기 제한 중, IT팀 메모리 증설 요청 필요",
    },
  });

  // ─── ACTIVITY LOGS ──────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { entityType: "project", entityId: p1.id, action: "created", details: JSON.stringify({ name: "EUV 스캐너 PM 최적화" }), occurredAt: new Date("2026-01-10") },
      { entityType: "task", entityId: t1_1.id, action: "completed", details: JSON.stringify({ title: "EUV 3대 과거 2년 다운타임 데이터 수집" }), occurredAt: new Date("2026-01-20") },
      { entityType: "task", entityId: t4_4.id, action: "completed", details: JSON.stringify({ title: "DOE 실험 실시 및 데이터 수집" }), occurredAt: new Date("2026-03-28") },
      { entityType: "task", entityId: t6_3.id, action: "completed", details: JSON.stringify({ title: "EfficientNet-B4 기반 분류 모델 학습" }), occurredAt: new Date("2026-03-25") },
      { entityType: "kpi", entityId: kpi4.id, action: "updated", details: JSON.stringify({ name: "AI 검출 정확도", value: 97.8 }), occurredAt: new Date("2026-04-10") },
      { entityType: "task", entityId: t6_4.id, action: "status_changed", details: JSON.stringify({ from: "in_progress", to: "in_review" }), occurredAt: new Date("2026-04-12") },
      { entityType: "sprint", entityId: sp3.id, action: "created", details: JSON.stringify({ name: "Sprint 4 - 모델 검증" }), occurredAt: new Date("2026-04-07") },
      { entityType: "milestone", entityId: p6.id, action: "reached", details: JSON.stringify({ name: "학습 데이터셋 구축 완료" }), occurredAt: new Date("2026-03-15") },
    ],
  });

  console.log("🎉 Semiconductor seed data applied successfully!");
  console.log("  📁 Workspaces: 설비엔지니어링팀 / 공정엔지니어링팀 / 혁신부서");
  console.log("  👥 Members: 9명 (설비3 / 공정3 / 혁신3)");
  console.log("  📋 Projects: 8개");
  console.log("  🎯 Epics: 14개");
  console.log("  ✅ Tasks: 50+개 (서브태스크 포함)");
  console.log("  📊 KPIs: 6개 (트렌드 데이터 포함)");
  console.log("  🗺️ MindMaps: 3개");
  console.log("  🔄 RecurringTemplates: 3개");
  console.log("  📌 BoardViews: 3개");
  console.log("  🎯 OKRs: 3 Objectives / 6 KeyResults");
  console.log("  📖 Stories: 5개");
  console.log("  💬 Comments: 10개");
  console.log("  📅 DailyPlan: 2026-04-15");
  console.log("  🕐 StandupNote: 2026-04-15");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
