import { requireAuth, getUserBusinessUnits, businessUnitSlug } from "@/lib/business-unit";
import { getOrganizationDashboard } from "@/lib/queries/organization-dashboard";
import { OrgShell } from "@/components/layout/org-shell";
import type { BusinessUnitNav } from "@/components/layout/business-units-nav";
import { PageHeader } from "@/components/layout/page-header";
import { CreateBusinessUnitForm } from "@/components/dashboard/create-business-unit-form";
import { OrganizationOverview } from "@/components/dashboard/organization-overview";
import { Card, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const { user } = await requireAuth();
  const [dashboard, memberships] = await Promise.all([
    getOrganizationDashboard(user.id),
    getUserBusinessUnits(user.id),
  ]);

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
      <PageHeader
        title="Panel principal"
        description={`Vista consolidada de sus unidades de negocio · ${dashboard.periodLabel}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-bold tracking-tight", valueClassName)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
