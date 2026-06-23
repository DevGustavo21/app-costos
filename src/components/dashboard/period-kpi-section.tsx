import { Suspense, type ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { PeriodSelector } from "@/components/dashboard/period-selector";

type PeriodKpiSectionProps = {
  periodLabel: string;
  children: ReactNode;
};

export function PeriodKpiSection({ periodLabel, children }: PeriodKpiSectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/50 bg-background/50 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Resumen del período</h2>
          </div>
          <p className="text-sm capitalize text-muted-foreground">{periodLabel}</p>
        </div>
        <Suspense fallback={<div className="h-8 w-64 animate-pulse rounded-md bg-muted" />}>
          <PeriodSelector embedded />
        </Suspense>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
