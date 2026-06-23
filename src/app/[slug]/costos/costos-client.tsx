"use client";

import { useMemo, useRef, useState, Suspense } from "react";
import { Category, CostEntryWithCategory } from "@/types/database";
import { CostForm } from "@/components/costs/cost-form";
import { CostMonthlyTable } from "@/components/costs/cost-monthly-table";
import { DateFilters } from "@/components/shared/date-filters";
import { PageHeader } from "@/components/layout/page-header";
import {
  FORM_TABLE_FORM_SLOT,
  FORM_TABLE_GRID,
  FORM_TABLE_TABLE_SLOT,
} from "@/lib/form-table-layout";
import { cn } from "@/lib/utils";

type CostosClientProps = {
  businessUnitId: string;
  categories: Category[];
  months: import("@/lib/queries/costs").MonthlyGroup<CostEntryWithCategory>[];
  defaultMonthKey: string;
  defaultDate: string;
  defaultExchangeRate: number;
  canWrite: boolean;
};

export function CostosClient({
  businessUnitId,
  categories,
  months,
  defaultMonthKey,
  defaultDate,
  defaultExchangeRate,
  canWrite,
}: CostosClientProps) {
  const [editEntry, setEditEntry] = useState<CostEntryWithCategory | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const formCategories = useMemo(() => {
    const active = categories.filter((c) => c.isActive);
    if (!editEntry?.categoryId) return active;

    if (active.some((c) => c.id === editEntry.categoryId)) return active;

    const current =
      categories.find((c) => c.id === editEntry.categoryId) ?? editEntry.category;
    return current ? [...active, current] : active;
  }, [categories, editEntry?.categoryId, editEntry?.category]);

  const handleEdit = (entry: CostEntryWithCategory) => {
    setEditEntry(entry);
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Costos"
        description="Registro y consulta de egresos por categoría y período"
      />

      <div className={FORM_TABLE_GRID}>
        {canWrite && (
          <div ref={formSectionRef} className={cn(FORM_TABLE_FORM_SLOT)}>
            <CostForm
            key={editEntry?.id ?? "new"}
            businessUnitId={businessUnitId}
            categories={formCategories}
            defaultExchangeRate={defaultExchangeRate}
            defaultDate={defaultDate}
            editEntry={editEntry}
            onEditComplete={() => setEditEntry(null)}
          />
          </div>
        )}

        <div className={cn(FORM_TABLE_TABLE_SLOT, !canWrite && "xl:col-span-full")}>
          <CostMonthlyTable
            months={months}
            defaultMonthKey={defaultMonthKey}
            businessUnitId={businessUnitId}
            defaultExchangeRate={defaultExchangeRate}
            canWrite={canWrite}
            onEdit={handleEdit}
            filters={
              <Suspense
                fallback={
                  <div className="border-b border-border/50 px-5 py-3">
                    <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
                  </div>
                }
              >
                <DateFilters categories={categories} entryType="cost" embedded />
              </Suspense>
            }
          />
        </div>
      </div>
    </div>
  );
}
