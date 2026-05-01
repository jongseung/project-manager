import { Target } from "lucide-react";
import { Header } from "@/components/layout/header";
import { GoalCard } from "@/components/goal/goal-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getGoalsWithProgress } from "@/actions/goal";
import { GoalActions } from "./goal-actions";
import { getCurrentOrganization } from "@/lib/session";

export default async function GoalsPage() {
  const ctx = await getCurrentOrganization();
  const goals = await getGoalsWithProgress();

  return (
    <div>
      <Header title="목표 관리">
        <GoalActions />
      </Header>
      <div className="p-6 max-w-full">
        {goals.length === 0 ? (
          <EmptyState
            icon={<Target className="h-12 w-12" />}
            title="첫 번째 목표를 설정하세요"
            description="측정 가능한 KPI로 목표를 설정하고 진행 상황을 추적하세요."
            action={<GoalActions />}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
          </div>
        )}
      </div>
    </div>
  );
}
