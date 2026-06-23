import { ReactNode } from "react";
import {
  requireBusinessUnitAccess,
  businessUnitSlug,
} from "@/lib/business-unit";
import { canCreateBusinessUnit, canManageOrgUsers } from "@/lib/permissions";
import { getCurrentUserProfile } from "@/lib/actions/profile";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function BusinessUnitLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const { businessUnit, memberships } = await requireBusinessUnitAccess(slug);
  const profile = await getCurrentUserProfile();

  const businessUnits = memberships.map((m) => ({
    id: m.businessUnitId,
    slug: m.businessUnit ? businessUnitSlug(m.businessUnit) : m.businessUnitId,
    name: m.businessUnit?.name ?? m.businessUnitId,
    icon: m.businessUnit?.icon ?? null,
    role: m.role,
  }));

  return (
    <DashboardShell
      mode="business"
      businessUnitSlug={businessUnitSlug(businessUnit)}
      businessUnitName={businessUnit.name}
      userName={profile.name}
      userEmail={profile.email}
      userAvatarUrl={profile.avatarUrl}
      userAvatarPreset={profile.avatarPreset}
      businessUnits={businessUnits}
      canManageUsers={memberships.some((m) => canManageOrgUsers(m.role))}
      canCreateBusinessUnit={canCreateBusinessUnit(memberships)}
    >
      {children}
    </DashboardShell>
  );
}
