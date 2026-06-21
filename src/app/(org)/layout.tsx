import { requireAuth, getUserBusinessUnits, businessUnitSlug } from "@/lib/business-unit";
import { OrgShell } from "@/components/layout/org-shell";
import type { BusinessUnitNav } from "@/components/layout/business-units-nav";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();
  const memberships = await getUserBusinessUnits(user.id);

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
      {children}
    </OrgShell>
  );
}
