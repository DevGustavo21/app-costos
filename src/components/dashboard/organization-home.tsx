"use client";

import { PageHeader } from "@/components/layout/page-header";
import { OrganizationOverview } from "@/components/dashboard/organization-overview";
import { KpiCard, KpiCardGrid } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/currency";
import type { OrganizationDashboardData } from "@/lib/queries/organization-dashboard";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

type OrganizationHomeProps = {
  dashboard: OrganizationDashboardData;
  canCreateBusinessUnit?: boolean;
};

export function OrganizationHome({
  dashboard,
  canCreateBusinessUnit = false,
}: OrganizationHomeProps) {
  const { totals } = dashboard;

  const cards = [
    {
      label: "Unidades",
      value: String(totals.unitCount),
      tags: null,
      footer: "Unidades de negocio con acceso",
    },
    {
      label: "Ingresos totales",
      value: formatUsd(totals.income),
      tags: null,
      footer: "Total registrado en el mes seleccionado",
    },
    {
      label: "Costos totales",
      value: formatUsd(totals.costs),
      tags: null,
      footer: "Total de egresos en el mes seleccionado",
    },
    {
      label: "Resultado neto",
      value: formatUsd(totals.net),
      tags:
        totals.variationPct !== 0 ? (
          <Badge variant={totals.variationPct < 0 ? "destructive" : "secondary"}>
            {totals.variationPct > 0 ? (
              <TrendingUpIcon className="size-3" />
            ) : (
              <TrendingDownIcon className="size-3" />
            )}
            {totals.variationPct > 0 ? "+" : ""}
            {totals.variationPct.toFixed(1)}%
          </Badge>
        ) : null,
      footer: `${totals.variationAbs >= 0 ? "+" : ""}${formatUsd(totals.variationAbs)} vs mes anterior`,
    },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Panel principal"
        description={`Vista consolidada de sus unidades de negocio · ${dashboard.periodLabel}`}
      />

      <KpiCardGrid>
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </KpiCardGrid>

      <OrganizationOverview
        data={dashboard}
        canCreateBusinessUnit={canCreateBusinessUnit}
      />
    </div>
  );
}
