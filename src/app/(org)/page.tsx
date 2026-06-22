import { requireAuth, getUserBusinessUnits } from "@/lib/business-unit";
import { canCreateBusinessUnit } from "@/lib/permissions";
import { getOrganizationDashboard } from "@/lib/queries/organization-dashboard";
import { OrganizationHome } from "@/components/dashboard/organization-home";

export default async function HomePage() {
  const { user } = await requireAuth();
  const memberships = await getUserBusinessUnits(user.id);
  const dashboard = await getOrganizationDashboard(user.id, memberships);

  return (
    <OrganizationHome
      dashboard={dashboard}
      canCreateBusinessUnit={canCreateBusinessUnit(memberships)}
    />
  );
}
