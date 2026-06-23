"use client";

import * as React from "react";
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
  title?: string;
  filters?: React.ReactNode;
  renderMonthTrigger?: (month: MonthlySection<T>) => React.ReactNode;
  renderMonthContent?: (month: MonthlySection<T>) => React.ReactNode;
};

export function MonthlyAccordionTable<T>({
  months,
  defaultMonthKey,
  renderTable,
  emptyMessage = "No hay registros",
  title,
  filters,
  renderMonthTrigger,
  renderMonthContent,
}: MonthlyAccordionTableProps<T>) {
  const openMonths = React.useMemo(() => {
    if (months.some((month) => month.monthKey === defaultMonthKey)) {
      return [defaultMonthKey];
    }
    return months[0] ? [months[0].monthKey] : [];
  }, [months, defaultMonthKey]);

  if (months.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-sm">
        {filters}
        {title ? (
          <div className="border-b border-border/50 bg-background/50 px-5 py-3">
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
        ) : null}
        <div className="flex items-center justify-center px-5 py-16">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-sm">
      {filters}
      {title ? (
        <div className="border-b border-border/50 bg-background/50 px-5 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
      ) : null}
      <Accordion
        type="multiple"
        defaultValue={openMonths}
        className="w-full rounded-none border-0"
      >
        {months.map((month) => (
          <AccordionItem
            key={month.monthKey}
            value={month.monthKey}
            className="border-b border-border/50 px-5 last:border-0"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              {renderMonthTrigger ? (
                renderMonthTrigger(month)
              ) : (
                <div className="flex w-full items-center justify-between gap-4 pr-2">
                  <span className="font-medium capitalize text-foreground">
                    {month.monthLabel}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                    {formatUsd(month.totalUsd)}
                  </span>
                </div>
              )}
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="overflow-x-auto">
                {renderMonthContent
                  ? renderMonthContent(month)
                  : renderTable(month.entries)}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
