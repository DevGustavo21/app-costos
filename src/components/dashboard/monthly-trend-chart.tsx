"use client";

import { PieChartCard } from "@/components/dashboard/pie-chart-card";

type TrendData = {
  month: string;
  monthKey: string;
  ingresos: number;
  costos: number;
};

export function MonthlyTrendChart({ data }: { data: TrendData[] }) {
  const incomeData = data
    .filter((d) => d.ingresos > 0)
    .map((d) => ({
      id: `income-${d.monthKey}`,
      name: d.month,
      value: d.ingresos,
    }));

  const costData = data
    .filter((d) => d.costos > 0)
    .map((d) => ({
      id: `cost-${d.monthKey}`,
      name: d.month,
      value: d.costos,
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PieChartCard
        title="Ingresos por mes"
        description="Distribución de ingresos en los últimos 6 meses"
        data={incomeData}
        emptyMessage="Sin ingresos en los últimos meses"
      />
      <PieChartCard
        title="Costos por mes"
        description="Distribución de costos en los últimos 6 meses"
        data={costData}
        emptyMessage="Sin costos en los últimos meses"
      />
    </div>
  );
}
