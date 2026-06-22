"use client";

import { AppSidebar, type AppSidebarProps } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type DashboardShellProps = AppSidebarProps & {
  children: React.ReactNode;
};

export function DashboardShell({ children, ...sidebarProps }: DashboardShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" {...sidebarProps} />
      <SidebarInset>
        <SiteHeader
          businessUnitName={sidebarProps.businessUnitName}
          businessUnitSlug={sidebarProps.businessUnitSlug}
        />
        <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
          <div className="flex w-full flex-col gap-6 px-4 sm:px-6 lg:px-8 md:gap-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
