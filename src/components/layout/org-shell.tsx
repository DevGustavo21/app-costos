"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { BusinessUnitNav } from "@/components/layout/business-units-nav";

type OrgShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string;
  businessUnits?: BusinessUnitNav[];
};

export function OrgShell({
  children,
  userName,
  userEmail,
  businessUnits = [],
}: OrgShellProps) {
  return (
    <DashboardShell
      mode="org"
      userName={userName}
      userEmail={userEmail}
      businessUnits={businessUnits}
    >
      {children}
    </DashboardShell>
  );
}
