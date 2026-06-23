"use client";

import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/currency";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { KpiCard, KpiCardGrid } from "@/components/dashboard/kpi-card";

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
}: KpiCardsProps) {
  const margin = totalIncome > 0 ? (netResult / totalIncome) * 100 : null;

  const cards = [
    {
      label: "Ingresos del período",
      value: formatUsd(totalIncome),
      tags: null,
      footer: "Total registrado en el mes seleccionado",
    },
    {
      label: "Costos del período",
      value: formatUsd(totalCosts),
      tags: null,
      footer: "Total de egresos en el mes seleccionado",
    },
    {
      label: "Resultado neto",
      value: formatUsd(netResult),
      tags:
        variationPct !== 0 ? (
          <Badge variant={variationPct < 0 ? "destructive" : "secondary"}>
            {variationPct > 0 ? (
              <TrendingUpIcon className="size-3" />
            ) : (
              <TrendingDownIcon className="size-3" />
            )}
            {variationPct > 0 ? "+" : ""}
            {variationPct.toFixed(1)}%
          </Badge>
        ) : null,
      footer: `${variationAbs >= 0 ? "+" : ""}${formatUsd(variationAbs)} vs mes anterior`,
    },
    {
      label: "Margen",
      value: margin !== null ? `${margin.toFixed(1)}%` : "—",
      tags: null,
      footer: "Utilidad sobre ingresos del período",
    },
  ];

  return (
    <KpiCardGrid>
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </KpiCardGrid>
  );
}
