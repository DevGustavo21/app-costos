import { ReactNode } from "react";
import {
  requireBusinessUnitAccess,
  getUserBusinessUnits,
  businessUnitSlug,
} from "@/lib/business-unit";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";

export default async function BusinessUnitLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const { businessUnit, user } = await requireBusinessUnitAccess(slug);
  const memberships = await getUserBusinessUnits(user.id);

  const businessUnits = memberships.map((m) => ({
    id: m.businessUnitId,
    slug: m.businessUnit ? businessUnitSlug(m.businessUnit) : m.businessUnitId,
    name: m.businessUnit?.name ?? m.businessUnitId,
  }));

  const sidebarProps = {
    businessUnitSlug: businessUnitSlug(businessUnit),
    businessUnitName: businessUnit.name,
    userName: user.name,
    userEmail: user.email,
    businessUnits,
  };

  return (
    <div className="min-h-screen bg-zinc-50/80">
      <Sidebar {...sidebarProps} />
      <div className="relative z-0 flex min-h-screen flex-col lg:pl-64">
        <MobileNav {...sidebarProps} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
