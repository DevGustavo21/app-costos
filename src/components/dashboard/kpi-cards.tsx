"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

type KpiCardsProps = {
  totalIncome: number;
  totalCosts: number;
  netResult: number;
  variationPct: number;
  variationAbs: number;
  prevNet: number;
};

const kpiValueClass = "text-zinc-700 dark:text-zinc-300";
const kpiMutedClass = "text-zinc-500 dark:text-zinc-400";

export function KpiCards({
  totalIncome,
  totalCosts,
  netResult,
  variationPct,
  variationAbs,
}: KpiCardsProps) {
  const margin =
    totalIncome > 0 ? (netResult / totalIncome) * 100 : null;

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
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:border-zinc-200/80 *:data-[slot=card]:bg-zinc-50/90 *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:border-zinc-800 dark:*:data-[slot=card]:bg-zinc-900/40 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="@container/card">
          <CardHeader>
            <CardDescription className={kpiMutedClass}>
              {card.label}
            </CardDescription>
            <CardTitle
              className={cn(
                "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl",
                kpiValueClass
              )}
            >
              {card.value}
            </CardTitle>
            {card.tags}
          </CardHeader>
          <CardFooter className={cn("text-sm", kpiMutedClass)}>
            {card.footer}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
