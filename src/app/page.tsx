import { requireAuth, getUserBusinessUnits, businessUnitSlug } from "@/lib/business-unit";
import { getOrganizationDashboard } from "@/lib/queries/organization-dashboard";
import { OrgShell } from "@/components/layout/org-shell";
import type { BusinessUnitNav } from "@/components/layout/business-units-nav";
import { PageHeader } from "@/components/layout/page-header";
import { CreateBusinessUnitForm } from "@/components/dashboard/create-business-unit-form";
import { OrganizationOverview } from "@/components/dashboard/organization-overview";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const { user } = await requireAuth();
  const memberships = await getUserBusinessUnits(user.id);
  const dashboard = await getOrganizationDashboard(user.id, memberships);

  const businessUnits: BusinessUnitNav[] = memberships.map((m) => ({
    id: m.businessUnitId,
    slug: m.businessUnit ? businessUnitSlug(m.businessUnit) : m.businessUnitId,
    name: m.businessUnit?.name ?? m.businessUnitId,
  }));

  return (
    <OrgShell
      userName={user.name}
      userEmail={user.email}
      businessUnits={businessUnits}
    >
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

        <CreateBusinessUnitForm />
      </div>
    </OrgShell>
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
