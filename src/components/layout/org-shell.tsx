"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { BusinessUnitNav } from "@/components/layout/business-units-nav";

type OrgShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string;
  businessUnits?: BusinessUnitNav[];
  canManageUsers?: boolean;
  canCreateBusinessUnit?: boolean;
};

export function OrgShell({
  children,
  userName,
  userEmail,
  businessUnits = [],
  canManageUsers = false,
  canCreateBusinessUnit = false,
}: OrgShellProps) {
  return (
    <DashboardShell
      mode="org"
      userName={userName}
      userEmail={userEmail}
      businessUnits={businessUnits}
      canManageUsers={canManageUsers}
      canCreateBusinessUnit={canCreateBusinessUnit}
    >
      {children}
    </DashboardShell>
  );
}
