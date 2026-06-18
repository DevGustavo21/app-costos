"use client";

import { PieChartCard } from "@/components/dashboard/pie-chart-card";
import { formatUsd } from "@/lib/currency";

type KpiCardsProps = {
  totalIncome: number;
  totalCosts: number;
  netResult: number;
  variationPct: number;
  variationAbs: number;
  prevNet: number;
};

export function KpiCards({
  totalIncome,
  totalCosts,
  netResult,
  variationPct,
  variationAbs,
  prevNet,
}: KpiCardsProps) {
  const compositionData = [
    { id: "income", name: "Ingresos", value: totalIncome },
    { id: "costs", name: "Costos", value: totalCosts },
  ].filter((item) => item.value > 0);

  const resultData =
    netResult >= 0
      ? [{ id: "profit", name: "Utilidad", value: netResult }]
      : [{ id: "loss", name: "Pérdida", value: Math.abs(netResult) }];

  const variationData = [
    { id: "current", name: "Mes actual", value: Math.abs(netResult) },
    { id: "previous", name: "Mes anterior", value: Math.abs(prevNet) },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <PieChartCard
        title="Composición del período"
        description="Proporción entre ingresos y costos"
        data={compositionData}
        emptyMessage="Sin movimientos en el período"
        height={240}
        innerRadius={48}
        outerRadius={82}
      />
      <PieChartCard
        title="Resultado neto"
        description={formatUsd(netResult)}
        data={resultData}
        emptyMessage="Sin resultado en el período"
        height={240}
        innerRadius={48}
        outerRadius={82}
        showLegend={false}
      />
      <PieChartCard
        title="Variación mensual"
        description={`${variationPct > 0 ? "+" : ""}${variationPct.toFixed(1)}% · ${variationAbs >= 0 ? "+" : ""}${formatUsd(variationAbs)}`}
        data={variationData}
        emptyMessage="Sin variación registrada"
        height={240}
        innerRadius={48}
        outerRadius={82}
        showLegend={false}
      />
    </div>
  );
}
