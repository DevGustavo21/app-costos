import { ReactNode } from "react";
import {
  requireBusinessUnitAccess,
  businessUnitSlug,
} from "@/lib/business-unit";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function BusinessUnitLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const { businessUnit, user, memberships } = await requireBusinessUnitAccess(slug);

  const businessUnits = memberships.map((m) => ({
    id: m.businessUnitId,
    slug: m.businessUnit ? businessUnitSlug(m.businessUnit) : m.businessUnitId,
    name: m.businessUnit?.name ?? m.businessUnitId,
  }));

  return (
    <DashboardShell
      mode="business"
      businessUnitSlug={businessUnitSlug(businessUnit)}
      businessUnitName={businessUnit.name}
      userName={user.name}
      userEmail={user.email}
      businessUnits={businessUnits}
    >
      {children}
    </DashboardShell>
  );
}
