"use client";

import { useRef, useState, Suspense } from "react";
import { Category, IncomeEntryWithRelations, Plant, MeasurementUnit } from "@/types/database";
import { IncomeForm } from "@/components/income/income-form";
import { IncomeMonthlyTable } from "@/components/income/income-monthly-table";
import { DateFilters } from "@/components/shared/date-filters";
import { PageHeader } from "@/components/layout/page-header";
import { usesVolumePricing } from "@/lib/measurement-unit";

type IngresosClientProps = {
  businessUnitId: string;
  measurementUnit: MeasurementUnit;
  basePricePerUnit: number | null;
  categories: Category[];
  plants: Plant[];
  months: import("@/lib/queries/costs").MonthlyGroup<IncomeEntryWithRelations>[];
  defaultMonthKey: string;
  defaultExchangeRate: number;
  canWrite: boolean;
};

export function IngresosClient({
  businessUnitId,
  measurementUnit,
  basePricePerUnit,
  categories,
  plants,
  months,
  defaultMonthKey,
  defaultExchangeRate,
  canWrite,
}: IngresosClientProps) {
  const [editEntry, setEditEntry] = useState<IncomeEntryWithRelations | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const handleEdit = (entry: IncomeEntryWithRelations) => {
    setEditEntry(entry);
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingresos"
        description="Registro y consulta de ingresos, incluyendo ventas de plantas"
      />

      <Suspense>
        <DateFilters categories={categories} plants={plants} showPlantFilter />
      </Suspense>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {canWrite && (
          <div ref={formSectionRef} className="min-w-0">
            <IncomeForm
            key={editEntry?.id ?? "new"}
            businessUnitId={businessUnitId}
            measurementUnit={measurementUnit}
            basePricePerUnit={basePricePerUnit}
            categories={categories.filter((c) => c.isActive)}
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
            volumePricing={usesVolumePricing(measurementUnit)}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </div>
  );
}
