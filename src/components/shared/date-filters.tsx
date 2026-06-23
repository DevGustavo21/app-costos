"use client";

import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Category, Plant } from "@/types/database";
import {
  COST_PAYMENT_STATUS_OPTIONS,
  getCostPaymentStatusLabel,
  getIncomeCollectionStatusLabel,
  INCOME_COLLECTION_STATUS_OPTIONS,
} from "@/lib/entry-labels";
import { cn } from "@/lib/utils";

type DateFiltersProps = {
  categories: Category[];
  entryType: "income" | "cost";
  plants?: Plant[];
  embedded?: boolean;
  className?: string;
};

function FilterField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid min-w-0 gap-1", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function DateFilters({
  categories,
  entryType,
  plants = [],
  embedded = false,
  className,
}: DateFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "all");
  const [plantId, setPlantId] = useState(searchParams.get("plantId") ?? "all");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");

  const showPlantFilter = entryType === "income";

  const statusOptions =
    entryType === "income"
      ? INCOME_COLLECTION_STATUS_OPTIONS
      : COST_PAYMENT_STATUS_OPTIONS;

  const getStatusLabel = (value: string) => {
    if (entryType === "income") {
      return getIncomeCollectionStatusLabel(value as never);
    }
    return getCostPaymentStatusLabel(value as never);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    if (showPlantFilter && plantId && plantId !== "all") params.set("plantId", plantId);
    if (status && status !== "all") params.set("status", status);
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategoryId("all");
    setPlantId("all");
    setStatus("all");
    router.push("?");
  };

  return (
    <div
      className={cn(
        embedded
          ? "border-b border-border/50 bg-background/50 px-5 py-4"
          : "rounded-xl border border-border/60 bg-muted/40 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Filtros</span>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-3 sm:grid-cols-2",
            showPlantFilter ? "xl:grid-cols-6" : "xl:grid-cols-5"
          )}
        >
          <FilterField label="Desde" htmlFor="dateFrom" className="min-w-0">
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-full"
            />
          </FilterField>

          <FilterField label="Hasta" htmlFor="dateTo" className="min-w-0">
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-full"
            />
          </FilterField>

          <FilterField label="Categoría" className="min-w-0">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          {showPlantFilter ? (
            <FilterField label="Producto" className="min-w-0">
              <Select value={plantId} onValueChange={setPlantId}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {plants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          ) : null}

          <FilterField label="Estado" className="min-w-0">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {getStatusLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
            <Button onClick={applyFilters} size="sm" className="h-8 flex-1 xl:flex-none">
              Filtrar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8 flex-1 xl:flex-none"
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
