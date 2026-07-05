import Link from "next/link";
import {
  FolderKanban,
  ArrowRight,
  Workflow,
  GitBranch,
  Kanban,
  Target,
  Users,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Workflow, title: "흐름 뷰", desc: "열자마자 파이프라인·병목·진행률이 한눈에. 지금 어디서 막혔는지 바로 보입니다." },
  { icon: GitBranch, title: "연결 그래프", desc: "태스크·에픽·스토리가 의존성으로 이어진 지도. 무엇이 무엇과 엮여 있는지 탐색하세요." },
  { icon: Kanban, title: "칸반 · 스프린트 · 백로그", desc: "드래그로 실행하고, 스프린트로 리듬을 만들고, 백로그로 우선순위를 관리합니다." },
  { icon: Target, title: "목표 · OKR · KPI", desc: "목표와 핵심 결과, 지표를 한 흐름에서 추적하며 방향을 잃지 않습니다." },
  { icon: Users, title: "데일리 스크럼 · 멤버 현황", desc: "매일의 진행과 블로커, 멤버별 업무량을 팀 단위로 정리합니다." },
  { icon: CalendarDays, title: "타임라인 · 캘린더 · 반복 업무", desc: "일정을 간트로 보고, 마감을 달력으로 챙기고, 반복 업무를 자동화합니다." },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FolderKanban className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">PM</span>
          </div>
          <Link href="/today">
            <Button size="sm">시작하기</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pt-20 pb-16 text-center sm:pt-28">
        <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          팀의 업무가 흐르듯 이어지는 프로젝트 매니저
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
          현황을 보자마자,
          <br className="hidden sm:block" /> 업무가 자연스럽게 이어집니다
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          칸반·스프린트·OKR·타임라인·연결 그래프까지, 프로젝트의 상태와 진행을 한 흐름에서.
          워크스페이스부터 태스크까지 한눈에 파악하고 바로 실행하세요.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/today">
            <Button size="lg" className="gap-1.5">
              무료로 시작하기 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">데모 둘러보기</Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">설치 없이 바로 시작 · 다크모드 지원</p>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">지금, 프로젝트의 흐름을 만들어보세요</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">몇 초면 됩니다. 로그인도, 설치도 필요 없습니다.</p>
          <Link href="/today" className="mt-6 inline-block">
            <Button size="lg" className="gap-1.5">시작하기 <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 text-xs text-muted-foreground">
          <span>PM — 프로젝트 매니저</span>
          <span>흐름이 이어지는 업무 관리</span>
        </div>
      </footer>
    </div>
  );
}
