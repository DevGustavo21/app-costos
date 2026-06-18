"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Leaf,
  CircleDollarSign,
  Receipt,
  Building2,
  LogOut,
  Menu,
  TrendingUpIcon,
  LayoutGrid,
  Settings,
  ChevronDown,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

type SidebarProps = {
  businessUnitSlug: string;
  businessUnitName: string;
  userName?: string | null;
  userEmail?: string;
  businessUnits?: BusinessUnitNav[];
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

function getPrincipalNavItems(buSlug: string): NavItem[] {
  return [
    {
      href: `/${buSlug}`,
      label: "Estadísticas",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/${buSlug}/ingresos`,
      label: "Ingresos",
      icon: TrendingUp,
    },
    {
      href: `/${buSlug}/costos`,
      label: "Costos",
      icon: TrendingDown,
    },
  ];
}

function getConfigNavItems(buSlug: string): NavItem[] {
  return [
    {
      href: `/${buSlug}/configuracion/unidad`,
      label: "Unidad de negocio",
      icon: Building2,
    },
    {
      href: `/${buSlug}/configuracion/categorias-ingresos`,
      label: "Categorías de ingresos",
      icon: CircleDollarSign,
    },
    {
      href: `/${buSlug}/configuracion/categorias-costos`,
      label: "Categorías de costos",
      icon: Receipt,
    },
    {
      href: `/${buSlug}/configuracion/plantas`,
      label: "Catálogo de plantas",
      icon: Leaf,
    },
  ];
}

function ConfigNavSection({
  businessUnitSlug,
  onNavigate,
}: {
  businessUnitSlug: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const configBase = `/${businessUnitSlug}/configuracion`;
  const isConfigActive = pathname.startsWith(configBase);
  const [open, setOpen] = useState(isConfigActive);
  const items = getConfigNavItems(businessUnitSlug);

  useEffect(() => {
    if (isConfigActive) setOpen(true);
  }, [isConfigActive]);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isConfigActive
            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Settings
          className={cn(
            "h-4 w-4 shrink-0",
            isConfigActive ? "text-emerald-700" : "text-muted-foreground"
          )}
        />
        <span className="truncate">Configuración</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
            isConfigActive ? "text-emerald-700" : "text-muted-foreground"
          )}
        />
      </button>

      {open && (
        <div className="ml-3 space-y-0.5 border-l border-border pl-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                href={item.href}
                onNavigate={onNavigate}
                icon={Icon}
                className="py-2 text-[13px]"
              >
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavContent({
  businessUnitSlug,
  businessUnitName,
  userName,
  userEmail,
  businessUnits = [],
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const router = useRouter();
  const principalItems = getPrincipalNavItems(businessUnitSlug);

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
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              Multinegocios
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {businessUnitName}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Organización
          </p>
          <NavLink
            href="/"
            exact
            onNavigate={onNavigate}
            icon={LayoutGrid}
          >
            <span className="truncate">Panel principal</span>
          </NavLink>
        </div>

        <BusinessUnitsNav
          units={businessUnits}
          onNavigate={onNavigate}
        />

        <div className="space-y-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Principal
          </p>
          {principalItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                href={item.href}
                exact={item.exact}
                onNavigate={onNavigate}
                icon={Icon}
              >
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <ConfigNavSection
          businessUnitSlug={businessUnitSlug}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="mt-auto border-t p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="bg-emerald-50 text-xs font-medium text-emerald-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {userName ?? "Usuario"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r bg-white shadow-sm lg:flex">
      <NavContent {...props} />
    </aside>
  );
}

export function MobileNav(props: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
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
          <NavContent {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <TrendingUpIcon className="h-4 w-4 text-emerald-700" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Multinegocios</p>
          <p className="truncate text-xs text-muted-foreground">
            {props.businessUnitName}
          </p>
        </div>
      </div>
    </div>
  );
}
