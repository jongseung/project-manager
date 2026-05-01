/**
 * 다양한 산업/직군 쇼케이스 데이터
 *
 * 회사: NexaFlow — B2B SaaS 스타트업 (시리즈 A, 45명)
 * 핵심 제품: 기업용 워크플로우 자동화 플랫폼
 *
 * 워크스페이스 4개:
 * 1. 제품개발 — 엔지니어링팀 (v2.0 리뉴얼, 디자인시스템)
 * 2. 그로스 — 마케팅/세일즈팀 (Q2 캠페인, 콘텐츠)
 * 3. 전략기획 — 경영/사업팀 (일본 진출, 시리즈B 준비)
 * 4. 운영 — CS/HR/총무 (CS자동화, 채용)
 */

import { PrismaClient } from "@prisma/client";
import { format, addDays, subDays, addWeeks } from "date-fns";

const db = new PrismaClient();

async function seed() {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  console.log("NexaFlow 쇼케이스 데이터 생성 시작...\n");

  // ─── Members (12명) ───
  const ceo = await db.member.create({ data: { name: "김대표", role: "CEO", email: "ceo@nexaflow.io", color: "#6366f1" } });
  const cto = await db.member.create({ data: { name: "박CTO", role: "CTO / 개발 리드", email: "cto@nexaflow.io", color: "#3b82f6" } });
  const pm = await db.member.create({ data: { name: "이PM", role: "Product Manager", email: "pm@nexaflow.io", color: "#8b5cf6" } });
  const fe1 = await db.member.create({ data: { name: "최프론트", role: "Frontend Engineer", email: "fe1@nexaflow.io", color: "#ec4899" } });
  const fe2 = await db.member.create({ data: { name: "한디자이너", role: "UI/UX Designer", email: "design@nexaflow.io", color: "#f59e0b" } });
  const be1 = await db.member.create({ data: { name: "정백엔드", role: "Backend Engineer", email: "be1@nexaflow.io", color: "#10b981" } });
  const be2 = await db.member.create({ data: { name: "송데이터", role: "Data Engineer", email: "data@nexaflow.io", color: "#14b8a6" } });
  const mkt1 = await db.member.create({ data: { name: "오마케터", role: "Growth Marketer", email: "mkt@nexaflow.io", color: "#f97316" } });
  const mkt2 = await db.member.create({ data: { name: "유콘텐츠", role: "Content Marketer", email: "content@nexaflow.io", color: "#eab308" } });
  const biz = await db.member.create({ data: { name: "강사업", role: "Business Development", email: "biz@nexaflow.io", color: "#ef4444" } });
  const cs = await db.member.create({ data: { name: "임CS", role: "Customer Success", email: "cs@nexaflow.io", color: "#06b6d4" } });
  const hr = await db.member.create({ data: { name: "윤HR", role: "HR Manager", email: "hr@nexaflow.io", color: "#a855f7" } });
  console.log("  팀원 12명 등록");

  // ─── Workspaces ───
  const wsProduct = await db.workspace.create({ data: { name: "제품개발", description: "엔지니어링, 디자인, QA", color: "#3b82f6" } });
  const wsGrowth = await db.workspace.create({ data: { name: "그로스", description: "마케팅, 세일즈, 콘텐츠", color: "#f97316" } });
  const wsStrategy = await db.workspace.create({ data: { name: "전략기획", description: "사업전략, 투자, 해외진출", color: "#6366f1" } });
  const wsOps = await db.workspace.create({ data: { name: "운영", description: "CS, HR, 총무, 법무", color: "#10b981" } });
  console.log("  워크스페이스 4개 생성");

  // ─── Labels ───
  const mkLabel = async (wsId: string, name: string, color: string) => db.label.create({ data: { workspaceId: wsId, name, color } });
  const lblFE = await mkLabel(wsProduct.id, "Frontend", "#ec4899");
  const lblBE = await mkLabel(wsProduct.id, "Backend", "#3b82f6");
  const lblDesign = await mkLabel(wsProduct.id, "Design", "#f59e0b");
  const lblQA = await mkLabel(wsProduct.id, "QA", "#10b981");
  const lblPerf = await mkLabel(wsProduct.id, "Performance", "#ef4444");
  const lblSEO = await mkLabel(wsGrowth.id, "SEO", "#22c55e");
  const lblPaid = await mkLabel(wsGrowth.id, "Paid", "#f97316");
  const lblContent = await mkLabel(wsGrowth.id, "Content", "#8b5cf6");
  const lblEvent = await mkLabel(wsGrowth.id, "Event", "#06b6d4");
  const lblLegal = await mkLabel(wsStrategy.id, "Legal", "#6b7280");
  const lblFinance = await mkLabel(wsStrategy.id, "Finance", "#eab308");
  const lblPartner = await mkLabel(wsStrategy.id, "Partnership", "#14b8a6");

  // ════════════════════════════════════════
  // 1. 제품개발: v2.0 플랫폼 리뉴얼
  // ════════════════════════════════════════
  const projV2 = await db.project.create({
    data: {
      workspaceId: wsProduct.id, name: "v2.0 플랫폼 리뉴얼", color: "#3b82f6", status: "active",
      startDate: format(subDays(now, 35), "yyyy-MM-dd"), targetDate: format(addDays(now, 55), "yyyy-MM-dd"),
      summary: "워크플로우 빌더 전면 재설계 + 성능 2배 개선",
      problemStatement: "현재 v1 워크플로우 빌더가 10개 이상의 노드에서 심각한 성능 저하. UI가 직관적이지 않아 온보딩 시 평균 3일 소요. 경쟁사(Zapier, Make) 대비 기능은 우위이나 UX에서 열세.",
      definitionOfDone: "1) 50개 노드 워크플로우도 3초 내 로딩\n2) 신규 사용자 온보딩 1일 이내\n3) NPS 점수 40 이상 (현재 22)\n4) 기존 고객 마이그레이션 완료",
    },
  });

  const epicV2_builder = await db.epic.create({ data: { projectId: projV2.id, name: "워크플로우 빌더 v2", status: "in_progress", priority: "urgent" } });
  const epicV2_perf = await db.epic.create({ data: { projectId: projV2.id, name: "성능 최적화", status: "in_progress", priority: "high", sortOrder: 1 } });
  const epicV2_migrate = await db.epic.create({ data: { projectId: projV2.id, name: "v1→v2 마이그레이션", status: "todo", priority: "high", sortOrder: 2 } });
  const epicV2_api = await db.epic.create({ data: { projectId: projV2.id, name: "API v2", status: "todo", priority: "medium", sortOrder: 3 } });

  await db.milestone.create({ data: { projectId: projV2.id, name: "빌더 v2 알파", targetDate: format(addDays(now, 7), "yyyy-MM-dd") } });
  await db.milestone.create({ data: { projectId: projV2.id, name: "내부 베타 테스트", targetDate: format(addDays(now, 21), "yyyy-MM-dd"), sortOrder: 1 } });
  await db.milestone.create({ data: { projectId: projV2.id, name: "고객 베타 오픈", targetDate: format(addDays(now, 35), "yyyy-MM-dd"), sortOrder: 2 } });
  await db.milestone.create({ data: { projectId: projV2.id, name: "v2 정식 릴리스", targetDate: format(addDays(now, 55), "yyyy-MM-dd"), sortOrder: 3 } });

  // OKR
  const objV2 = await db.objective.create({ data: { projectId: projV2.id, title: "v2 제품 품질 목표" } });
  const krNps = await db.keyResult.create({ data: { objectiveId: objV2.id, title: "NPS 40점 이상", unit: "점", startValue: 22, currentValue: 28, targetValue: 40, direction: "increase" } });
  const krPerf = await db.keyResult.create({ data: { objectiveId: objV2.id, title: "50노드 로딩 3초 이내", unit: "초", startValue: 12, currentValue: 7, targetValue: 3, direction: "decrease", sortOrder: 1 } });
  const krOnboard = await db.keyResult.create({ data: { objectiveId: objV2.id, title: "온보딩 완료율 80%", unit: "%", startValue: 35, currentValue: 45, targetValue: 80, direction: "increase", sortOrder: 2 } });

  for (const [kr, vals] of [[krNps, [22,24,26,28]], [krPerf, [12,10,8.5,7]], [krOnboard, [35,38,42,45]]] as const) {
    for (let i = 0; i < vals.length; i++) await db.kRSnapshot.create({ data: { keyResultId: kr.id, value: vals[i], recordedAt: subDays(now, (4-i)*7) } });
  }

  // Stories
  const stV2_1 = await db.story.create({ data: { projectId: projV2.id, title: "드래그앤드롭 빌더 재설계", userStory: "사용자로서, 노드를 드래그로 연결하며 직관적으로 워크플로우를 만들고 싶다", storyPoints: 21, status: "in_progress", priority: "urgent" } });
  const stV2_2 = await db.story.create({ data: { projectId: projV2.id, title: "실시간 미리보기", userStory: "사용자로서, 워크플로우를 저장하기 전에 실시간으로 결과를 미리보고 싶다", storyPoints: 13, status: "todo", priority: "high", sortOrder: 1 } });
  const stV2_3 = await db.story.create({ data: { projectId: projV2.id, title: "렌더링 성능 최적화", userStory: "사용자로서, 50개 이상의 노드가 있어도 끊김 없이 편집하고 싶다", storyPoints: 13, status: "in_progress", priority: "urgent", sortOrder: 2 } });
  const stV2_4 = await db.story.create({ data: { projectId: projV2.id, title: "v1 데이터 자동 마이그레이션", userStory: "기존 고객으로서, v1에서 만든 워크플로우가 v2에서 자동으로 변환되길 원한다", storyPoints: 8, status: "backlog", priority: "high", sortOrder: 3 } });
  const stV2_5 = await db.story.create({ data: { projectId: projV2.id, title: "템플릿 마켓플레이스", userStory: "신규 사용자로서, 미리 만들어진 템플릿으로 빠르게 시작하고 싶다", storyPoints: 8, status: "backlog", priority: "medium", sortOrder: 4 } });

  await db.storyKRLink.create({ data: { storyId: stV2_1.id, keyResultId: krNps.id, estimatedImpact: 0.4 } });
  await db.storyKRLink.create({ data: { storyId: stV2_1.id, keyResultId: krOnboard.id, estimatedImpact: 0.3 } });
  await db.storyKRLink.create({ data: { storyId: stV2_3.id, keyResultId: krPerf.id, estimatedImpact: 0.7 } });
  await db.storyKRLink.create({ data: { storyId: stV2_5.id, keyResultId: krOnboard.id, estimatedImpact: 0.4 } });

  // Tasks
  const v2Tasks: { t: string; e: string; s: string; m: string; st: string; p: string; d?: string; sub?: string[] }[] = [
    { t: "React Flow 라이브러리 교체 (Xyflow v12)", e: epicV2_builder.id, s: stV2_1.id, m: fe1.id, st: "done", p: "high", d: format(subDays(now, 14), "yyyy-MM-dd") },
    { t: "커스텀 노드 컴포넌트 설계", e: epicV2_builder.id, s: stV2_1.id, m: fe1.id, st: "done", p: "high", d: format(subDays(now, 7), "yyyy-MM-dd") },
    { t: "노드 연결 UX 인터랙션 구현", e: epicV2_builder.id, s: stV2_1.id, m: fe1.id, st: "in_progress", p: "urgent", d: format(addDays(now, 3), "yyyy-MM-dd"), sub: ["연결선 드래그 애니메이션", "호환성 검증 (타입 체크)", "에러 상태 시각화"] },
    { t: "빌더 디자인 시안 (Figma)", e: epicV2_builder.id, s: stV2_1.id, m: fe2.id, st: "done", p: "high" },
    { t: "노드 팔레트 UI", e: epicV2_builder.id, s: stV2_1.id, m: fe1.id, st: "todo", p: "high", d: format(addDays(now, 7), "yyyy-MM-dd") },
    { t: "실시간 미리보기 아키텍처 설계", e: epicV2_builder.id, s: stV2_2.id, m: cto.id, st: "todo", p: "high", d: format(addDays(now, 10), "yyyy-MM-dd") },
    { t: "WebSocket 기반 실행 엔진", e: epicV2_builder.id, s: stV2_2.id, m: be1.id, st: "backlog", p: "high" },
    { t: "Canvas 가상화 (Viewport Culling)", e: epicV2_perf.id, s: stV2_3.id, m: fe1.id, st: "in_progress", p: "urgent", d: format(addDays(now, 5), "yyyy-MM-dd") },
    { t: "대용량 워크플로우 벤치마크 세팅", e: epicV2_perf.id, s: stV2_3.id, m: be1.id, st: "done", p: "high" },
    { t: "메모리 누수 프로파일링 & 수정", e: epicV2_perf.id, s: stV2_3.id, m: fe1.id, st: "todo", p: "high", d: format(addDays(now, 10), "yyyy-MM-dd") },
    { t: "API 응답 캐싱 레이어", e: epicV2_perf.id, s: stV2_3.id, m: be1.id, st: "todo", p: "medium" },
    { t: "v1→v2 스키마 변환 로직", e: epicV2_migrate.id, s: stV2_4.id, m: be1.id, st: "backlog", p: "high" },
    { t: "마이그레이션 테스트 (상위 100개 워크플로우)", e: epicV2_migrate.id, s: stV2_4.id, m: be1.id, st: "backlog", p: "medium" },
    { t: "템플릿 스키마 설계", e: epicV2_builder.id, s: stV2_5.id, m: be1.id, st: "backlog", p: "medium" },
    { t: "템플릿 갤러리 UI", e: epicV2_builder.id, s: stV2_5.id, m: fe1.id, st: "backlog", p: "low" },
    { t: "REST API v2 스펙 작성 (OpenAPI)", e: epicV2_api.id, s: null!, m: cto.id, st: "in_progress", p: "medium", d: format(addDays(now, 7), "yyyy-MM-dd") },
    { t: "인증 리팩토링 (JWT → OAuth2)", e: epicV2_api.id, s: null!, m: be1.id, st: "backlog", p: "medium" },
  ];

  for (let i = 0; i < v2Tasks.length; i++) {
    const { t, e, s, m, st, p, d, sub } = v2Tasks[i];
    const task = await db.task.create({
      data: { projectId: projV2.id, epicId: e, storyId: s || undefined, memberId: m, title: t, status: st, priority: p, dueDate: d, sortOrder: i, completedAt: st === "done" ? subDays(now, Math.floor(Math.random()*10)+1) : null },
    });
    if (sub) for (const [j, title] of sub.entries()) await db.task.create({ data: { projectId: projV2.id, parentTaskId: task.id, title, status: j === 0 ? "done" : "todo", sortOrder: j, completedAt: j === 0 ? subDays(now, 1) : null } });
    if (i < 4) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblFE.id } }).catch(() => {});
    if ([6,8,10,11,12].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblBE.id } }).catch(() => {});
    if ([3].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblDesign.id } }).catch(() => {});
    if ([7,8,9].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblPerf.id } }).catch(() => {});
  }

  await db.comment.create({ data: { taskId: (await db.task.findFirst({ where: { title: { contains: "노드 연결 UX" } } }))!.id, content: "Xyflow v12의 커넥션 밸리데이션 API가 변경되었습니다. 마이그레이션 가이드 확인 필요.", authorName: "최프론트" } });
  await db.comment.create({ data: { taskId: (await db.task.findFirst({ where: { title: { contains: "Canvas 가상화" } } }))!.id, content: "react-virtuoso 대신 자체 구현으로 진행합니다. 50노드 기준 FPS 30→55로 개선 확인.", authorName: "최프론트" } });

  // Sprint
  const spV2_1 = await db.sprint.create({ data: { projectId: projV2.id, name: "Sprint 3 - 빌더 알파", startDate: format(subDays(now, 3), "yyyy-MM-dd"), endDate: format(addDays(now, 11), "yyyy-MM-dd"), status: "active", goalDescription: "빌더 v2 알파 버전 완성: 노드 연결 + Canvas 가상화 + 팔레트 UI" } });
  const sprintTasks = await db.task.findMany({ where: { projectId: projV2.id, status: { in: ["in_progress", "todo"] }, parentTaskId: null }, take: 6 });
  for (const t of sprintTasks) await db.sprintTask.create({ data: { sprintId: spV2_1.id, taskId: t.id } });

  console.log("  [제품개발] v2.0 플랫폼 리뉴얼: 17 태스크, 5 스토리, 1 스프린트");

  // ─── 제품개발: 디자인시스템 ───
  const projDS = await db.project.create({
    data: {
      workspaceId: wsProduct.id, name: "디자인 시스템 구축", color: "#f59e0b", status: "active",
      startDate: format(subDays(now, 14), "yyyy-MM-dd"), targetDate: format(addDays(now, 42), "yyyy-MM-dd"),
      summary: "일관된 UI 컴포넌트 라이브러리 + Storybook 문서화",
      problemStatement: "제품 내 UI 일관성 부족. 같은 버튼이 3가지 스타일로 존재. 디자이너-개발자 간 커뮤니케이션 비용이 높음.",
      definitionOfDone: "1) 핵심 컴포넌트 20개 Storybook 등록\n2) Figma ↔ 코드 토큰 동기화\n3) 기존 페이지 80% 디자인시스템 적용",
    },
  });

  const dsTasks = [
    { t: "디자인 토큰 정의 (색상, 타이포, 간격)", m: fe2.id, st: "done", p: "high" },
    { t: "Figma 토큰 플러그인 설정", m: fe2.id, st: "done", p: "high" },
    { t: "Button 컴포넌트 (6 variants)", m: fe1.id, st: "done", p: "high" },
    { t: "Input / Select / Checkbox 컴포넌트", m: fe1.id, st: "in_progress", p: "high", d: format(addDays(now, 5), "yyyy-MM-dd") },
    { t: "Modal / Dialog / Sheet 컴포넌트", m: fe1.id, st: "todo", p: "medium", d: format(addDays(now, 10), "yyyy-MM-dd") },
    { t: "Table / DataGrid 컴포넌트", m: fe1.id, st: "backlog", p: "medium" },
    { t: "Storybook 배포 (Chromatic)", m: fe1.id, st: "todo", p: "medium", d: format(addDays(now, 14), "yyyy-MM-dd") },
    { t: "기존 대시보드 페이지 마이그레이션", m: fe1.id, st: "backlog", p: "low" },
  ];
  for (let i = 0; i < dsTasks.length; i++) {
    const { t, m, st, p, d } = dsTasks[i];
    await db.task.create({ data: { projectId: projDS.id, memberId: m, title: t, status: st, priority: p, dueDate: d, sortOrder: i, completedAt: st === "done" ? subDays(now, 5) : null } });
  }
  console.log("  [제품개발] 디자인 시스템: 8 태스크");

  // ════════════════════════════════════════
  // 2. 그로스: Q2 성장 캠페인
  // ════════════════════════════════════════
  const projGrowth = await db.project.create({
    data: {
      workspaceId: wsGrowth.id, name: "Q2 그로스 캠페인", color: "#f97316", status: "active",
      startDate: format(subDays(now, 21), "yyyy-MM-dd"), targetDate: format(addDays(now, 70), "yyyy-MM-dd"),
      summary: "MQL 200% 증가 + 유료 전환율 5% 달성",
      problemStatement: "현재 월 MQL 150건, 유료 전환율 2.3%. 시리즈B 전 성장 지표 개선이 시급. 콘텐츠 마케팅 체계가 없고 Paid 채널 ROAS가 낮음.",
      definitionOfDone: "1) 월 MQL 450건 이상\n2) 유료 전환율 5% 이상\n3) 블로그 월 방문 10만 이상\n4) 웨비나 월 1회 정례화",
    },
  });

  const epicG_content = await db.epic.create({ data: { projectId: projGrowth.id, name: "콘텐츠 마케팅", status: "in_progress", priority: "high" } });
  const epicG_paid = await db.epic.create({ data: { projectId: projGrowth.id, name: "Paid 캠페인", status: "in_progress", priority: "high", sortOrder: 1 } });
  const epicG_event = await db.epic.create({ data: { projectId: projGrowth.id, name: "이벤트/웨비나", status: "todo", priority: "medium", sortOrder: 2 } });
  const epicG_seo = await db.epic.create({ data: { projectId: projGrowth.id, name: "SEO 최적화", status: "in_progress", priority: "medium", sortOrder: 3 } });

  const objG = await db.objective.create({ data: { projectId: projGrowth.id, title: "Q2 파이프라인 확대" } });
  await db.keyResult.create({ data: { objectiveId: objG.id, title: "월 MQL 450건", unit: "건", startValue: 150, currentValue: 210, targetValue: 450, direction: "increase" } });
  await db.keyResult.create({ data: { objectiveId: objG.id, title: "유료 전환율 5%", unit: "%", startValue: 2.3, currentValue: 3.1, targetValue: 5, direction: "increase", sortOrder: 1 } });
  await db.keyResult.create({ data: { objectiveId: objG.id, title: "블로그 월 10만 방문", unit: "만", startValue: 3.2, currentValue: 4.8, targetValue: 10, direction: "increase", sortOrder: 2 } });
  await db.keyResult.create({ data: { objectiveId: objG.id, title: "Paid ROAS 300%", unit: "%", startValue: 120, currentValue: 180, targetValue: 300, direction: "increase", sortOrder: 3 } });

  const stG_1 = await db.story.create({ data: { projectId: projGrowth.id, title: "SEO 핵심 키워드 10개 1페이지 진입", storyPoints: 13, status: "in_progress", priority: "high" } });
  const stG_2 = await db.story.create({ data: { projectId: projGrowth.id, title: "리드 마그넷 전자책 제작", userStory: "잠재 고객으로서, 워크플로우 자동화 가이드를 다운받고 싶다", storyPoints: 8, status: "in_progress", priority: "high", sortOrder: 1 } });
  const stG_3 = await db.story.create({ data: { projectId: projGrowth.id, title: "Google/LinkedIn Ads 캠페인", storyPoints: 8, status: "in_progress", priority: "high", sortOrder: 2 } });
  const stG_4 = await db.story.create({ data: { projectId: projGrowth.id, title: "월간 웨비나 시리즈", userStory: "잠재 고객으로서, 실제 사용 사례를 보고 도입을 결정하고 싶다", storyPoints: 5, status: "backlog", priority: "medium", sortOrder: 3 } });

  const gTasks = [
    { t: "핵심 키워드 리서치 (Ahrefs)", e: epicG_seo.id, s: stG_1.id, m: mkt1.id, st: "done", p: "high" },
    { t: "SEO 블로그 포스트 10편 기획", e: epicG_content.id, s: stG_1.id, m: mkt2.id, st: "done", p: "high" },
    { t: "블로그 포스트 작성 (1~5편)", e: epicG_content.id, s: stG_1.id, m: mkt2.id, st: "in_progress", p: "high", d: format(addDays(now, 7), "yyyy-MM-dd") },
    { t: "블로그 포스트 작성 (6~10편)", e: epicG_content.id, s: stG_1.id, m: mkt2.id, st: "todo", p: "medium", d: format(addDays(now, 21), "yyyy-MM-dd") },
    { t: "전자책 목차 및 초안", e: epicG_content.id, s: stG_2.id, m: mkt2.id, st: "in_progress", p: "high", d: format(addDays(now, 5), "yyyy-MM-dd") },
    { t: "전자책 디자인 (Canva)", e: epicG_content.id, s: stG_2.id, m: fe2.id, st: "todo", p: "medium", d: format(addDays(now, 12), "yyyy-MM-dd") },
    { t: "랜딩페이지 제작 (전자책 다운로드)", e: epicG_content.id, s: stG_2.id, m: fe1.id, st: "backlog", p: "medium" },
    { t: "Google Ads 캠페인 셋업", e: epicG_paid.id, s: stG_3.id, m: mkt1.id, st: "done", p: "high" },
    { t: "LinkedIn Ads 캠페인 셋업", e: epicG_paid.id, s: stG_3.id, m: mkt1.id, st: "in_progress", p: "high", d: format(addDays(now, 3), "yyyy-MM-dd") },
    { t: "A/B 테스트 크리에이티브 3종", e: epicG_paid.id, s: stG_3.id, m: mkt1.id, st: "todo", p: "medium", d: format(addDays(now, 10), "yyyy-MM-dd") },
    { t: "주간 캠페인 성과 리포트 자동화", e: epicG_paid.id, s: stG_3.id, m: mkt1.id, st: "backlog", p: "low" },
    { t: "웨비나 1회차 기획 (주제: 자동화 ROI)", e: epicG_event.id, s: stG_4.id, m: mkt1.id, st: "backlog", p: "medium" },
    { t: "웨비나 랜딩페이지 + 등록 폼", e: epicG_event.id, s: stG_4.id, m: fe1.id, st: "backlog", p: "low" },
    { t: "고객 케이스 스터디 3건 인터뷰", e: epicG_content.id, s: null!, m: mkt2.id, st: "todo", p: "high", d: format(addDays(now, 14), "yyyy-MM-dd") },
    { t: "웹사이트 메타태그/구조화 데이터 최적화", e: epicG_seo.id, s: stG_1.id, m: fe1.id, st: "todo", p: "medium" },
  ];

  for (let i = 0; i < gTasks.length; i++) {
    const { t, e, s, m, st, p, d } = gTasks[i];
    const task = await db.task.create({ data: { projectId: projGrowth.id, epicId: e, storyId: s || undefined, memberId: m, title: t, status: st, priority: p, dueDate: d, sortOrder: i, completedAt: st === "done" ? subDays(now, Math.floor(Math.random()*14)+1) : null } });
    if ([0,14].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblSEO.id } }).catch(() => {});
    if ([7,8,9,10].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblPaid.id } }).catch(() => {});
    if ([1,2,3,4,5].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblContent.id } }).catch(() => {});
    if ([11,12].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblEvent.id } }).catch(() => {});
  }
  console.log("  [그로스] Q2 캠페인: 15 태스크, 4 스토리");

  // ════════════════════════════════════════
  // 3. 전략기획: 일본 시장 진출
  // ════════════════════════════════════════
  const projJP = await db.project.create({
    data: {
      workspaceId: wsStrategy.id, name: "일본 시장 진출", color: "#6366f1", status: "active",
      startDate: format(subDays(now, 7), "yyyy-MM-dd"), targetDate: format(addDays(now, 120), "yyyy-MM-dd"),
      summary: "일본 B2B SaaS 시장 진출, 6개월 내 파일럿 고객 5사 확보",
      problemStatement: "국내 시장만으로는 시리즈B 밸류에이션 달성이 어려움. 일본 워크플로우 자동화 시장은 연 20% 성장 중이나 현지 경쟁사가 약함.",
      definitionOfDone: "1) 일본어 제품 로컬라이징 완료\n2) 현지 파트너사 1곳 계약\n3) 파일럿 고객 5사 확보\n4) 일본 법인 설립 준비 완료",
    },
  });

  const jpTasks = [
    { t: "일본 SaaS 시장 조사 보고서", m: biz.id, st: "done", p: "high" },
    { t: "경쟁사 분석 (Tines JP, Workato JP)", m: biz.id, st: "done", p: "high" },
    { t: "일본어 UI 번역 (1차: 핵심 화면)", m: pm.id, st: "in_progress", p: "high", d: format(addDays(now, 14), "yyyy-MM-dd") },
    { t: "일본 파트너사 후보 리스트 (10사)", m: biz.id, st: "in_progress", p: "high", d: format(addDays(now, 7), "yyyy-MM-dd") },
    { t: "파트너사 미팅 (3사 이상)", m: biz.id, st: "todo", p: "high", d: format(addDays(now, 21), "yyyy-MM-dd") },
    { t: "일본 법인 설립 법률 검토", m: ceo.id, st: "todo", p: "medium", d: format(addDays(now, 30), "yyyy-MM-dd") },
    { t: "일본어 마케팅 자료 제작", m: mkt2.id, st: "backlog", p: "medium" },
    { t: "일본 전용 가격 정책 수립", m: ceo.id, st: "backlog", p: "medium" },
    { t: "파일럿 고객 온보딩 프로세스 설계", m: cs.id, st: "backlog", p: "medium" },
    { t: "일본 결제 시스템 연동 (Stripe JP)", m: be1.id, st: "backlog", p: "low" },
  ];
  for (let i = 0; i < jpTasks.length; i++) {
    const { t, m, st, p, d } = jpTasks[i];
    const task = await db.task.create({ data: { projectId: projJP.id, memberId: m, title: t, status: st, priority: p, dueDate: d, sortOrder: i, completedAt: st === "done" ? subDays(now, 5) : null } });
    if ([5].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblLegal.id } }).catch(() => {});
    if ([3,4].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblPartner.id } }).catch(() => {});
    if ([7].includes(i)) await db.taskLabel.create({ data: { taskId: task.id, labelId: lblFinance.id } }).catch(() => {});
  }
  console.log("  [전략기획] 일본 시장 진출: 10 태스크");

  // ─── 전략기획: 시리즈B 준비 ───
  const projSeriesB = await db.project.create({
    data: {
      workspaceId: wsStrategy.id, name: "시리즈B 투자 유치", color: "#ef4444", status: "active",
      startDate: today, targetDate: format(addDays(now, 90), "yyyy-MM-dd"),
      summary: "시리즈B 100억 유치, 밸류에이션 500억 목표",
      problemStatement: "시리즈A 자금 런웨이 8개월 남음. Q3까지 시리즈B 클로징 필요. ARR 30억 달성이 핵심 조건.",
      definitionOfDone: "1) 투자 덱 완성\n2) VC 10곳 미팅\n3) 텀시트 2곳 이상 확보\n4) 시리즈B 클로징",
    },
  });

  const sbTasks = [
    { t: "투자 덱 초안 작성", m: ceo.id, st: "in_progress", p: "urgent", d: format(addDays(now, 7), "yyyy-MM-dd") },
    { t: "재무 모델링 업데이트 (3개년)", m: ceo.id, st: "todo", p: "high", d: format(addDays(now, 10), "yyyy-MM-dd") },
    { t: "타겟 VC 리스트 (20곳)", m: biz.id, st: "in_progress", p: "high", d: format(addDays(now, 5), "yyyy-MM-dd") },
    { t: "기존 투자자 레퍼런스 요청", m: ceo.id, st: "todo", p: "medium", d: format(addDays(now, 14), "yyyy-MM-dd") },
    { t: "Data Room 구축 (법률/재무/기술 문서)", m: biz.id, st: "backlog", p: "high" },
    { t: "VC 미팅 1라운드 (5곳)", m: ceo.id, st: "backlog", p: "urgent" },
    { t: "VC 미팅 2라운드 (관심 표명 VC)", m: ceo.id, st: "backlog", p: "urgent" },
    { t: "텀시트 검토 및 협상", m: ceo.id, st: "backlog", p: "urgent" },
  ];
  for (let i = 0; i < sbTasks.length; i++) {
    const { t, m, st, p, d } = sbTasks[i];
    await db.task.create({ data: { projectId: projSeriesB.id, memberId: m, title: t, status: st, priority: p, dueDate: d, sortOrder: i } });
  }
  console.log("  [전략기획] 시리즈B 투자: 8 태스크");

  // ════════════════════════════════════════
  // 4. 운영: CS 자동화 + 채용
  // ════════════════════════════════════════
  const projCS = await db.project.create({
    data: {
      workspaceId: wsOps.id, name: "CS 응답 자동화", color: "#06b6d4", status: "active",
      startDate: format(subDays(now, 10), "yyyy-MM-dd"), targetDate: format(addDays(now, 35), "yyyy-MM-dd"),
      summary: "Intercom AI + 헬프센터로 CS 응답 시간 50% 단축",
      problemStatement: "현재 CS 평균 응답 시간 4시간. 반복 질문이 60% 이상. CS 인력 1명으로 한계.",
      definitionOfDone: "1) 반복 질문 자동 응답률 70%\n2) 평균 응답 시간 2시간 이내\n3) 헬프센터 문서 30개 이상",
    },
  });

  const csTasks = [
    { t: "자주 묻는 질문 TOP 30 정리", m: cs.id, st: "done", p: "high" },
    { t: "헬프센터 문서 작성 (1~15편)", m: cs.id, st: "in_progress", p: "high", d: format(addDays(now, 7), "yyyy-MM-dd") },
    { t: "헬프센터 문서 작성 (16~30편)", m: cs.id, st: "todo", p: "medium", d: format(addDays(now, 21), "yyyy-MM-dd") },
    { t: "Intercom AI 봇 셋업", m: cs.id, st: "in_progress", p: "high", d: format(addDays(now, 5), "yyyy-MM-dd") },
    { t: "자동 응답 시나리오 10개 설정", m: cs.id, st: "todo", p: "high", d: format(addDays(now, 12), "yyyy-MM-dd") },
    { t: "에스컬레이션 워크플로우 설계", m: cs.id, st: "backlog", p: "medium" },
    { t: "CS 대시보드 (응답시간/만족도 추적)", m: be2.id, st: "backlog", p: "low" },
  ];
  for (let i = 0; i < csTasks.length; i++) {
    const { t, m, st, p, d } = csTasks[i];
    await db.task.create({ data: { projectId: projCS.id, memberId: m, title: t, status: st, priority: p, dueDate: d, sortOrder: i, completedAt: st === "done" ? subDays(now, 3) : null } });
  }
  console.log("  [운영] CS 자동화: 7 태스크");

  const projHire = await db.project.create({
    data: {
      workspaceId: wsOps.id, name: "Q2 채용 (5명)", color: "#a855f7", status: "active",
      startDate: format(subDays(now, 14), "yyyy-MM-dd"), targetDate: format(addDays(now, 60), "yyyy-MM-dd"),
      summary: "시리즈B 대비 핵심 인력 5명 채용",
      problemStatement: "현재 45명 → 시리즈B 후 70명 목표. 핵심 포지션(시니어 FE, ML 엔지니어, 일본 BD)이 공석.",
      definitionOfDone: "1) 5개 포지션 JD 발행\n2) 각 포지션 후보 3명 이상 파이프라인\n3) 5명 오퍼 수락",
    },
  });

  const hireTasks = [
    { t: "시니어 Frontend 엔지니어 JD 작성", m: hr.id, st: "done", p: "urgent" },
    { t: "ML 엔지니어 JD 작성", m: hr.id, st: "done", p: "high" },
    { t: "일본 BD 매니저 JD 작성", m: hr.id, st: "in_progress", p: "high", d: format(addDays(now, 3), "yyyy-MM-dd") },
    { t: "원티드/로켓펀치 공고 등록", m: hr.id, st: "todo", p: "high", d: format(addDays(now, 5), "yyyy-MM-dd") },
    { t: "리크루팅 에이전시 미팅 (2곳)", m: hr.id, st: "todo", p: "medium", d: format(addDays(now, 7), "yyyy-MM-dd") },
    { t: "시니어 FE 서류 스크리닝", m: hr.id, st: "backlog", p: "high" },
    { t: "기술 면접 프로세스 정비", m: cto.id, st: "todo", p: "medium", d: format(addDays(now, 10), "yyyy-MM-dd") },
    { t: "컬처 핏 면접 가이드 작성", m: hr.id, st: "backlog", p: "medium" },
    { t: "온보딩 프로그램 업데이트 (2주→3일)", m: hr.id, st: "backlog", p: "low" },
  ];
  for (let i = 0; i < hireTasks.length; i++) {
    const { t, m, st, p, d } = hireTasks[i];
    await db.task.create({ data: { projectId: projHire.id, memberId: m, title: t, status: st, priority: p, dueDate: d, sortOrder: i, completedAt: st === "done" ? subDays(now, 7) : null } });
  }
  console.log("  [운영] Q2 채용: 9 태스크");

  // ─── Goals ───
  const goalGrowth = await db.goal.create({ data: { workspaceId: wsGrowth.id, title: "Q2 ARR 30억 달성", description: "시리즈B 투자 유치를 위한 핵심 매출 지표 달성", status: "in_progress", targetDate: format(addDays(now, 70), "yyyy-MM-dd") } });
  await db.goalProject.create({ data: { goalId: goalGrowth.id, projectId: projGrowth.id } });
  await db.goalProject.create({ data: { goalId: goalGrowth.id, projectId: projSeriesB.id } });
  await db.kPI.create({ data: { goalId: goalGrowth.id, name: "ARR", unit: "억", targetValue: 30, currentValue: 18, direction: "increase" } });
  await db.kPI.create({ data: { goalId: goalGrowth.id, name: "유료 고객 수", unit: "사", targetValue: 120, currentValue: 72, direction: "increase" } });

  const goalProduct = await db.goal.create({ data: { workspaceId: wsProduct.id, title: "제품 경쟁력 확보", description: "v2.0 릴리스 + 성능/UX 업계 최고 수준", status: "in_progress", targetDate: format(addDays(now, 55), "yyyy-MM-dd") } });
  await db.goalProject.create({ data: { goalId: goalProduct.id, projectId: projV2.id } });
  await db.goalProject.create({ data: { goalId: goalProduct.id, projectId: projDS.id } });
  console.log("  목표 2개, KPI 2개");

  // ─── Recurring Templates ───
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsProduct.id, projectId: projV2.id, memberId: cto.id,
      title: "주간 개발 스프린트 리뷰", priority: "high", frequency: "weekly", interval: 1,
      daysOfWeek: JSON.stringify([5]), timeOfDay: "16:00", isActive: true, nextRunAt: addWeeks(now, 1), labelIds: JSON.stringify([]),
      subtaskTemplates: { create: [{ title: "스프린트 진행률 확인", sortOrder: 0 }, { title: "블로커 공유", sortOrder: 1 }, { title: "다음 주 계획 정리", sortOrder: 2 }] },
    },
  });
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsGrowth.id, projectId: projGrowth.id, memberId: mkt1.id,
      title: "주간 마케팅 성과 리뷰", priority: "high", frequency: "weekly", interval: 1,
      daysOfWeek: JSON.stringify([1]), timeOfDay: "10:00", isActive: true, nextRunAt: addWeeks(now, 1), labelIds: JSON.stringify([]),
      subtaskTemplates: { create: [{ title: "Paid 캠페인 ROAS 확인", sortOrder: 0 }, { title: "블로그 트래픽 분석", sortOrder: 1 }, { title: "MQL/SQL 파이프라인 점검", sortOrder: 2 }, { title: "다음 주 콘텐츠 일정 확인", sortOrder: 3 }] },
    },
  });
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsOps.id, projectId: projCS.id, memberId: cs.id,
      title: "일일 CS 티켓 처리 및 리뷰", priority: "medium", frequency: "daily", interval: 1,
      daysOfWeek: JSON.stringify([1,2,3,4,5]), timeOfDay: "09:00", isActive: true, nextRunAt: addDays(now, 1), labelIds: JSON.stringify([]),
      subtaskTemplates: { create: [{ title: "미처리 티켓 확인", sortOrder: 0 }, { title: "긴급 이슈 대응", sortOrder: 1 }, { title: "FAQ 업데이트 검토", sortOrder: 2 }] },
    },
  });
  await db.recurringTemplate.create({
    data: {
      workspaceId: wsStrategy.id, projectId: projSeriesB.id, memberId: ceo.id,
      title: "월간 이사회 보고 준비", priority: "high", frequency: "monthly", interval: 1,
      dayOfMonth: 25, timeOfDay: "14:00", isActive: true, nextRunAt: addDays(now, 14), labelIds: JSON.stringify([]),
      subtaskTemplates: { create: [{ title: "KPI 대시보드 업데이트", sortOrder: 0 }, { title: "주요 이슈 정리", sortOrder: 1 }, { title: "보고서 초안 작성", sortOrder: 2 }, { title: "대표 검토", sortOrder: 3 }] },
    },
  });
  console.log("  반복 업무 4개");

  // ─── Standup ───
  await db.standupNote.create({
    data: {
      date: today,
      yesterday: "- v2 빌더 노드 연결 UX 구현 진행 중 (70%)\n- Google Ads 캠페인 1차 결과: CTR 2.3% (목표 대비 양호)\n- 일본 파트너 후보 리스트 7곳 확보",
      today: "- 빌더 알파 완성을 위한 집중 개발일\n- 전자책 초안 마감\n- VC 타겟 리스트 최종 확정",
      blockers: "- CTO: Xyflow v12 커넥션 API 호환성 이슈로 1일 지연 예상\n- HR: 시니어 FE 후보 부족, 헤드헌터 추가 투입 필요",
    },
  });

  // ─── MindMap ───
  const mm = await db.mindMap.create({ data: { projectId: projV2.id, title: "v3.0 로드맵 브레인스토밍" } });
  const root = await db.mindMapNode.create({ data: { mindMapId: mm.id, content: "NexaFlow v3.0", positionX: 400, positionY: 250 } });
  const n1 = await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: root.id, content: "AI 자동화", positionX: 150, positionY: 100 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n1.id, content: "자연어 → 워크플로우", positionX: 30, positionY: 40 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n1.id, content: "이상 감지 자동 복구", positionX: 30, positionY: 120 } });
  const n2 = await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: root.id, content: "엔터프라이즈", positionX: 650, positionY: 100 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n2.id, content: "SSO/SAML", positionX: 780, positionY: 40 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n2.id, content: "감사 로그", positionX: 780, positionY: 120 } });
  const n3 = await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: root.id, content: "글로벌", positionX: 400, positionY: 420 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n3.id, content: "다국어 지원", positionX: 250, positionY: 480 } });
  await db.mindMapNode.create({ data: { mindMapId: mm.id, parentNodeId: n3.id, content: "글로벌 리전", positionX: 550, positionY: 480 } });

  // ─── Activity Logs ───
  for (let i = 0; i < 90; i++) {
    const count = Math.floor(Math.random() * 8) + 2;
    for (let j = 0; j < count; j++) {
      await db.activityLog.create({ data: { entityType: ["task","story","project"][Math.floor(Math.random()*3)], entityId: "showcase", action: ["created","updated","status_changed","completed"][Math.floor(Math.random()*4)], occurredAt: subDays(now, i) } });
    }
  }

  // ─── Summary ───
  const counts = {
    members: await db.member.count(),
    workspaces: await db.workspace.count(),
    projects: await db.project.count(),
    tasks: await db.task.count({ where: { parentTaskId: null } }),
    subtasks: await db.task.count({ where: { parentTaskId: { not: null } } }),
    stories: await db.story.count(),
    objectives: await db.objective.count(),
    keyResults: await db.keyResult.count(),
    sprints: await db.sprint.count(),
    recurring: await db.recurringTemplate.count(),
    goals: await db.goal.count(),
    labels: await db.label.count(),
  };

  console.log("\n====================================");
  console.log("  NexaFlow 쇼케이스 데이터 완료");
  console.log("====================================");
  console.log(`  팀원: ${counts.members}명`);
  console.log(`  워크스페이스: ${counts.workspaces}개`);
  console.log(`  프로젝트: ${counts.projects}개`);
  console.log(`  태스크: ${counts.tasks}개 (서브태스크 ${counts.subtasks}개)`);
  console.log(`  스토리: ${counts.stories}개`);
  console.log(`  OKR: ${counts.objectives} Objectives, ${counts.keyResults} KRs`);
  console.log(`  스프린트: ${counts.sprints}개`);
  console.log(`  반복 업무: ${counts.recurring}개`);
  console.log(`  목표: ${counts.goals}개`);
  console.log(`  라벨: ${counts.labels}개`);

  await db.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
