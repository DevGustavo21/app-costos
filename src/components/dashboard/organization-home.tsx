"use client";

import { PageHeader } from "@/components/layout/page-header";
import { OrganizationOverview } from "@/components/dashboard/organization-overview";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { OrganizationDashboardData } from "@/lib/queries/organization-dashboard";

type OrganizationHomeProps = {
  dashboard: OrganizationDashboardData;
};

export function OrganizationHome({ dashboard }: OrganizationHomeProps) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Panel principal"
        description={`Vista consolidada de sus unidades de negocio · ${dashboard.periodLabel}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Unidades" value={String(dashboard.totals.unitCount)} />
        <SummaryCard
          label="Ingresos totales"
          value={formatUsd(dashboard.totals.income)}
          valueClassName="text-emerald-700"
        />
        <SummaryCard
          label="Costos totales"
          value={formatUsd(dashboard.totals.costs)}
          valueClassName="text-red-600"
        />
        <SummaryCard
          label="Resultado neto"
          value={formatUsd(dashboard.totals.net)}
          valueClassName={
            dashboard.totals.net >= 0 ? "text-emerald-700" : "text-red-600"
          }
        />
      </div>

      <OrganizationOverview data={dashboard} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl",
            valueClassName
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
