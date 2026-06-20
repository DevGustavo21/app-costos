import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { Suspense } from "react";
import {
  getDashboardKpis,
  getMonthlyTrend,
  getCostDistribution,
  getIncomeDistribution,
  getBudgetExecution,
  parsePeriod,
} from "@/lib/queries/dashboard";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { DistributionChart } from "@/components/dashboard/distribution-chart";
import { BudgetExecutionChart } from "@/components/dashboard/budget-execution-chart";
import { PeriodSelector } from "@/components/dashboard/period-selector";

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

  const [kpis, trend, costDist, incomeDist, budget] = await Promise.all([
    getDashboardKpis(businessUnitId, period),
    getMonthlyTrend(businessUnitId, 6),
    getCostDistribution(businessUnitId, period),
    getIncomeDistribution(businessUnitId, period),
    getBudgetExecution(businessUnitId, period),
  ]);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{period.label}</p>
        </div>
        <Suspense fallback={<div className="h-10 w-48 animate-pulse rounded-md bg-muted" />}>
          <PeriodSelector />
        </Suspense>
      </div>

      <KpiCards {...kpis} />

      <MonthlyTrendChart data={trend} />

      <DistributionChart
        title="Distribución de costos"
        data={costDist}
        businessUnitId={businessUnitId}
        period={period}
        entryType="cost"
      />
      <DistributionChart
        title="Distribución de ingresos"
        data={incomeDist}
        businessUnitId={businessUnitId}
        period={period}
        entryType="income"
      />

      <BudgetExecutionChart data={budget} />
    </div>
  );
}
