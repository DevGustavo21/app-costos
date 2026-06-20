"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  exact?: boolean;
  variant?: "page" | "context";
  onNavigate?: () => void;
  className?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
};

const activeStyles = {
  page: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  context: "bg-muted text-foreground ring-1 ring-border",
} as const;

const activeIconStyles = {
  page: "text-emerald-700",
  context: "text-foreground",
} as const;

export function NavLink({
  href,
  exact,
  variant = "page",
  onNavigate,
  className,
  children,
  icon: Icon,
}: NavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate?.();

    if (active) return;

    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? activeStyles[variant]
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isPending && "opacity-60",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-700" />
      ) : (
        Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              active
                ? activeIconStyles[variant]
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        )
      )}
      {children}
    </a>
  );
}
