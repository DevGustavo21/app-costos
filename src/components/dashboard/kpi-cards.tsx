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

export function KpiCards({
  totalIncome,
  totalCosts,
  netResult,
  variationPct,
  variationAbs,
}: KpiCardsProps) {
  const cards = [
    {
      label: "Ingresos del período",
      value: formatUsd(totalIncome),
      valueClassName: "text-emerald-700",
      badge: null,
      footer: "Total registrado en el mes seleccionado",
    },
    {
      label: "Costos del período",
      value: formatUsd(totalCosts),
      valueClassName: "text-red-600",
      badge: null,
      footer: "Total de egresos en el mes seleccionado",
    },
    {
      label: "Resultado neto",
      value: formatUsd(netResult),
      valueClassName: netResult >= 0 ? "text-emerald-700" : "text-red-600",
      badge:
        variationPct !== 0 ? (
          <Badge variant="outline">
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
      value:
        totalIncome > 0
          ? `${((netResult / totalIncome) * 100).toFixed(1)}%`
          : "—",
      valueClassName: "text-foreground",
      badge: null,
      footer: "Utilidad sobre ingresos del período",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="@container/card">
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl",
                card.valueClassName
              )}
            >
              {card.value}
            </CardTitle>
            {card.badge}
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">{card.footer}</CardFooter>
        </Card>
      ))}
    </div>
  );
}
