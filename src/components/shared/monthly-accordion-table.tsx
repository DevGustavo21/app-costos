"use client";

import { formatUsd } from "@/lib/currency";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

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
      <Card className="flex items-center justify-center border-dashed py-12">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <Accordion
        type="multiple"
        defaultValue={[defaultMonthKey]}
        className="w-full"
      >
        {months.map((month) => (
          <AccordionItem
            key={month.monthKey}
            value={month.monthKey}
            className="border-b px-4 last:border-0"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex w-full items-center justify-between gap-4 pr-2">
                <span className="font-medium capitalize text-foreground">
                  {month.monthLabel}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
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
    </Card>
  );
}
