"use client";

import { useMemo, useRef, useState, Suspense } from "react";
import { Category, IncomeEntryWithRelations, Plant } from "@/types/database";
import { IncomeForm } from "@/components/income/income-form";
import { IncomeMonthlyTable } from "@/components/income/income-monthly-table";
import { DateFilters } from "@/components/shared/date-filters";
import { PageHeader } from "@/components/layout/page-header";

type IngresosClientProps = {
  businessUnitId: string;
  categories: Category[];
  plants: Plant[];
  months: import("@/lib/queries/costs").MonthlyGroup<IncomeEntryWithRelations>[];
  defaultMonthKey: string;
  defaultExchangeRate: number;
  canWrite: boolean;
};

export function IngresosClient({
  businessUnitId,
  categories,
  plants,
  months,
  defaultMonthKey,
  defaultExchangeRate,
  canWrite,
}: IngresosClientProps) {
  const [editEntry, setEditEntry] = useState<IncomeEntryWithRelations | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const formCategories = useMemo(() => {
    const active = categories.filter((c) => c.isActive);
    if (!editEntry?.categoryId) return active;

    const hasCurrent = active.some((c) => c.id === editEntry.categoryId);
    if (hasCurrent) return active;

    const current = categories.find((c) => c.id === editEntry.categoryId);
    return current ? [...active, current] : active;
  }, [categories, editEntry?.categoryId]);

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

      <Suspense>
        <DateFilters categories={categories} plants={plants} showPlantFilter />
      </Suspense>

      <div className="grid gap-5 lg:grid-cols-1 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        {canWrite && (
          <div ref={formSectionRef} className="min-w-0 xl:max-w-md">
            <IncomeForm
            key={editEntry?.id ?? "new"}
            businessUnitId={businessUnitId}
            categories={formCategories}
            plants={plants.filter((p) => p.isActive)}
            defaultExchangeRate={defaultExchangeRate}
            editEntry={editEntry}
            onEditComplete={() => setEditEntry(null)}
          />
          </div>
        )}

        <div className={canWrite ? "min-w-0" : "xl:col-span-full"}>
          <IncomeMonthlyTable
            months={months}
            defaultMonthKey={defaultMonthKey}
            businessUnitId={businessUnitId}
            canWrite={canWrite}
            defaultExchangeRate={defaultExchangeRate}
            volumePricing={true}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
}
