"use client";

import { useMemo, useRef, useState, Suspense } from "react";
import { Category, IncomeEntryWithRelations, Plant } from "@/types/database";
import { IncomeForm } from "@/components/income/income-form";
import { IncomeMonthlyTable } from "@/components/income/income-monthly-table";
import { DateFilters } from "@/components/shared/date-filters";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

type IngresosClientProps = {
  businessUnitId: string;
  categories: Category[];
  plants: Plant[];
  months: import("@/lib/queries/costs").MonthlyGroup<IncomeEntryWithRelations>[];
  defaultMonthKey: string;
  defaultDate: string;
  defaultExchangeRate: number;
  canWrite: boolean;
};

export function IngresosClient({
  businessUnitId,
  categories,
  plants,
  months,
  defaultMonthKey,
  defaultDate,
  defaultExchangeRate,
  canWrite,
}: IngresosClientProps) {
  const [editEntry, setEditEntry] = useState<IncomeEntryWithRelations | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const formPlants = useMemo(() => {
    const byId = new Map(plants.filter((p) => p.isActive).map((p) => [p.id, p]));
    if (editEntry?.lines) {
      for (const line of editEntry.lines) {
        if (line.plantId && line.plant) {
          byId.set(line.plantId, line.plant);
        }
      }
    }
    return Array.from(byId.values());
  }, [plants, editEntry]);

  const formCategories = useMemo(() => {
    const active = categories.filter((c) => c.isActive);
    if (!editEntry?.categoryId) return active;

    const hasCurrent = active.some((c) => c.id === editEntry.categoryId);
    if (hasCurrent) return active;

    const current =
      categories.find((c) => c.id === editEntry.categoryId) ?? editEntry.category;
    return current ? [...active, current] : active;
  }, [categories, editEntry?.categoryId, editEntry?.category]);

  const handleEdit = (entry: IncomeEntryWithRelations) => {
    setEditEntry(entry);
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ingresos"
        description="Registro y consulta de ingresos, incluyendo ventas de plantas"
      />

      <div className="grid gap-5 lg:grid-cols-1 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        {canWrite && (
          <div ref={formSectionRef} className="min-w-0 xl:max-w-md">
            <IncomeForm
            key={editEntry?.id ?? "new"}
            businessUnitId={businessUnitId}
            categories={formCategories}
            plants={formPlants}
            defaultExchangeRate={defaultExchangeRate}
            defaultDate={defaultDate}
            editEntry={editEntry}
            onEditComplete={() => setEditEntry(null)}
          />
          </div>
        )}

        <div className={cn("min-w-0", !canWrite && "xl:col-span-full")}>
          <IncomeMonthlyTable
            months={months}
            defaultMonthKey={defaultMonthKey}
            businessUnitId={businessUnitId}
            canWrite={canWrite}
            defaultExchangeRate={defaultExchangeRate}
            volumePricing={true}
            onEdit={handleEdit}
            filters={
              <Suspense
                fallback={
                  <div className="border-b border-border/50 px-5 py-3">
                    <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
                  </div>
                }
              >
                <DateFilters
                  categories={categories}
                  plants={plants}
                  showPlantFilter
                  compact
                  embedded
                />
              </Suspense>
            }
          />
        </div>
      </div>
    </div>
  );
}
