"use client";

import { PieChartCard } from "@/components/dashboard/pie-chart-card";

type BudgetItem = {
  categoryId: string;
  categoryName: string;
  type: string;
  planned: number;
  actual: number;
  executionPct: number;
};

export function BudgetExecutionChart({ data }: { data: BudgetItem[] }) {
  const actualData = data
    .filter((d) => d.actual > 0)
    .map((d) => ({
      id: d.categoryId,
      name: d.categoryName,
      value: d.actual,
      meta: {
        planned: d.planned,
        executionPct: d.executionPct,
      },
    }));

  const plannedData = data
    .filter((d) => d.planned > 0)
    .map((d) => ({
      id: `${d.categoryId}-planned`,
      name: d.categoryName,
      value: d.planned,
    }));

  if (data.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PieChartCard
        title="Presupuesto planificado"
        description="Distribución del monto presupuestado por categoría"
        data={plannedData}
        emptyMessage="Sin líneas presupuestarias con monto planificado"
      />
      <PieChartCard
        title="Ejecución real"
        description="Distribución del gasto/ingreso real por categoría"
        data={actualData}
        emptyMessage="Sin ejecución registrada en el período"
      />
    </div>
  );
}
