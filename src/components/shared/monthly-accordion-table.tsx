"use client";

import { formatUsd } from "@/lib/currency";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type MonthlySection<T> = {
  monthKey: string;
  monthLabel: string;
  totalUsd: number;
  entries: T[];
};

type MonthlyAccordionTableProps<T> = {
  months: MonthlySection<T>[];
  defaultMonthKey: string;
  renderTable: (entries: T[]) => React.ReactNode;
  emptyMessage?: string;
};

export function MonthlyAccordionTable<T>({
  months,
  defaultMonthKey,
  renderTable,
  emptyMessage = "No hay registros",
}: MonthlyAccordionTableProps<T>) {
  if (months.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-card py-16 shadow-sm">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm">
      <Accordion
        type="multiple"
        defaultValue={[defaultMonthKey]}
        className="w-full"
      >
        {months.map((month) => (
          <AccordionItem
            key={month.monthKey}
            value={month.monthKey}
            className="border-b border-border/50 px-5 last:border-0"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex w-full items-center justify-between gap-4 pr-2">
                <span className="font-medium capitalize text-foreground">
                  {month.monthLabel}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                  {formatUsd(month.totalUsd)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {renderTable(month.entries)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
