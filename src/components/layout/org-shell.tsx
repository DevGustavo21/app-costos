"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, LogOut, Menu, TrendingUpIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/layout/nav-link";
import {
  BusinessUnitsNav,
  type BusinessUnitNav,
} from "@/components/layout/business-units-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type OrgShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string;
  businessUnits?: BusinessUnitNav[];
};

function OrgNav({
  userName,
  userEmail,
  businessUnits = [],
  onNavigate,
}: {
  userName?: string | null;
  userEmail?: string;
  businessUnits?: BusinessUnitNav[];
  onNavigate?: () => void;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = (userName ?? userEmail ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
            <TrendingUpIcon className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold">Multinegocios</p>
            <p className="text-xs text-muted-foreground">Panel principal</p>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <NavLink href="/" exact onNavigate={onNavigate} icon={LayoutGrid}>
          <span>Panel principal</span>
        </NavLink>

        <BusinessUnitsNav units={businessUnits} onNavigate={onNavigate} />
      </nav>

      <div className="mt-auto border-t p-3">
        <div className="mb-2 flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="bg-emerald-50 text-xs font-medium text-emerald-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName ?? "Usuario"}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

export function OrgShell({
  children,
  userName,
  userEmail,
  businessUnits = [],
}: OrgShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50/80">
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 shrink-0 border-r bg-white shadow-sm lg:flex">
        <OrgNav
          userName={userName}
          userEmail={userEmail}
          businessUnits={businessUnits}
        />
      </aside>

      <div className="relative z-0 flex min-h-screen flex-col lg:pl-64">
        <div className="relative z-20 flex items-center gap-3 border-b bg-white px-4 py-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Abrir menú">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0" hideClose>
              <SheetHeader className="sr-only">
                <SheetTitle>Navegación</SheetTitle>
              </SheetHeader>
              <OrgNav
                userName={userName}
                userEmail={userEmail}
                businessUnits={businessUnits}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <p className="text-sm font-semibold">Panel principal</p>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
