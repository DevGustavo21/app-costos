"use client";

import { useState } from "react";
import { PieChartCard } from "@/components/dashboard/pie-chart-card";
import { CategoryDetailPanel } from "./category-detail-panel";
import type { DashboardPeriod } from "@/lib/queries/dashboard";

type DistributionItem = {
  categoryId: string;
  name: string;
  value: number;
  percentage: number;
  isPlantCategory?: boolean;
};

type DistributionChartProps = {
  title: string;
  data: DistributionItem[];
  businessUnitId: string;
  period: DashboardPeriod;
  entryType: "cost" | "income";
};

export function DistributionChart({
  title,
  data,
  businessUnitId,
  period,
  entryType,
}: DistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const pieData = data.map((item) => ({
    id: item.categoryId,
    name: item.name,
    value: item.value,
    percentage: item.percentage,
  }));

  const selected = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PieChartCard
        title={title}
        data={pieData}
        activeIndex={activeIndex}
        onSliceClick={(index) =>
          setActiveIndex((prev) => (prev === index ? null : index))
        }
      />

      <CategoryDetailPanel
        businessUnitId={businessUnitId}
        categoryId={selected?.categoryId ?? null}
        categoryName={selected?.name ?? ""}
        isPlantCategory={selected?.isPlantCategory ?? false}
        entryType={entryType}
        period={period}
      />
    </div>
  );
}
