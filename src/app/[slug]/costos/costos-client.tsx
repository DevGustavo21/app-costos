"use client";

import { useRef, useState, Suspense } from "react";
import { Category, CostEntryWithCategory } from "@/types/database";
import { CostForm } from "@/components/costs/cost-form";
import { CostMonthlyTable } from "@/components/costs/cost-monthly-table";
import { DateFilters } from "@/components/shared/date-filters";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

type CostosClientProps = {
  businessUnitId: string;
  categories: Category[];
  months: import("@/lib/queries/costs").MonthlyGroup<CostEntryWithCategory>[];
  defaultMonthKey: string;
  defaultExchangeRate: number;
  canWrite: boolean;
};

export function CostosClient({
  businessUnitId,
  categories,
  months,
  defaultMonthKey,
  defaultExchangeRate,
  canWrite,
}: CostosClientProps) {
  const [editEntry, setEditEntry] = useState<CostEntryWithCategory | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

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

      <div className="grid gap-5 lg:grid-cols-1 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        {canWrite && (
          <div ref={formSectionRef} className="min-w-0 xl:max-w-md">
            <CostForm
            key={editEntry?.id ?? "new"}
            businessUnitId={businessUnitId}
            categories={categories.filter((c) => c.isActive)}
            defaultExchangeRate={defaultExchangeRate}
            editEntry={editEntry}
            onEditComplete={() => setEditEntry(null)}
          />
          </div>
        )}

        <div className={cn("min-w-0", !canWrite && "xl:col-span-full")}>
          <CostMonthlyTable
            months={months}
            defaultMonthKey={defaultMonthKey}
            businessUnitId={businessUnitId}
            canWrite={canWrite}
            onEdit={handleEdit}
            filters={
              <Suspense>
                <DateFilters categories={categories} compact embedded />
              </Suspense>
            }
          />
        </div>
      </div>
    </div>
  );
}
