import { requireAuth, getUserBusinessUnits, businessUnitSlug } from "@/lib/business-unit";
import { canCreateBusinessUnit, canManageOrgUsers } from "@/lib/permissions";
import { OrgShell } from "@/components/layout/org-shell";
import type { BusinessUnitNav } from "@/components/layout/business-units-nav";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();
  const memberships = await getUserBusinessUnits(user.id);
  const canManageUsers = memberships.some((m) => canManageOrgUsers(m.role));
  const canCreateUnit = canCreateBusinessUnit(memberships);

  const businessUnits: BusinessUnitNav[] = memberships.map((m) => ({
    id: m.businessUnitId,
    slug: m.businessUnit ? businessUnitSlug(m.businessUnit) : m.businessUnitId,
    name: m.businessUnit?.name ?? m.businessUnitId,
    role: m.role,
  }));

  return (
    <OrgShell
      userName={user.name}
      userEmail={user.email}
      businessUnits={businessUnits}
      canManageUsers={canManageUsers}
      canCreateBusinessUnit={canCreateUnit}
    >
      {children}
    </OrgShell>
  );
}
