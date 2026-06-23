import { requireBusinessUnitAccess } from "@/lib/business-unit";
import {
  getDashboardKpis,
  getCostDistribution,
  getBudgetExecution,
  parsePeriod,
} from "@/lib/queries/dashboard";
import { getDailyIncomeTrend } from "@/lib/queries/income-trend";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { IncomeAreaChart } from "@/components/dashboard/income-area-chart";
import { CostDistributionSection } from "@/components/dashboard/cost-distribution-section";
import { BudgetExecutionChart } from "@/components/dashboard/budget-execution-chart";
import { PeriodKpiSection } from "@/components/dashboard/period-kpi-section";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { year?: string; month?: string };
}) {
  const { slug } = params;
  const { businessUnit } = await requireBusinessUnitAccess(slug);
  const businessUnitId = businessUnit.id;
  const sp = searchParams;

  const now = new Date();
  const year = parseInt(sp.year ?? now.getFullYear().toString());
  const month = parseInt(sp.month ?? (now.getMonth() + 1).toString());
  const period = parsePeriod(year, month);

  const [kpis, incomeTrend, costDist, budget] = await Promise.all([
    getDashboardKpis(businessUnitId, period),
    getDailyIncomeTrend(businessUnitId, 12),
    getCostDistribution(businessUnitId, period),
    getBudgetExecution(businessUnitId, period),
  ]);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PeriodKpiSection periodLabel={period.label}>
        <KpiCards {...kpis} />
      </PeriodKpiSection>

      <IncomeAreaChart data={incomeTrend} />

      <CostDistributionSection data={costDist} period={period} />

      <BudgetExecutionChart data={budget} />
    </div>
  );
}
