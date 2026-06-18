"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Category, CostEntryWithCategory } from "@/types/database";
import { CostForm } from "@/components/costs/cost-form";
import { CostMonthlyTable } from "@/components/costs/cost-monthly-table";
import { DateFilters } from "@/components/shared/date-filters";
import { PageHeader } from "@/components/layout/page-header";

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
    <div className="space-y-6">
      <PageHeader
        title="Costos"
        description="Registro y consulta de egresos por categoría y período"
      />

      <Suspense>
        <DateFilters categories={categories} />
      </Suspense>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {canWrite && (
          <div ref={formSectionRef} className="min-w-0">
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

        <div className={canWrite ? "min-w-0" : "xl:col-span-full"}>
          <CostMonthlyTable
            months={months}
            defaultMonthKey={defaultMonthKey}
            businessUnitId={businessUnitId}
            canWrite={canWrite}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
}
