import { roundMoney } from "@/lib/currency";
import type { MonthlyGroup } from "@/lib/queries/costs";

export function sumEntriesAmountUsd<T extends { amountUsd: number }>(entries: T[]) {
  return roundMoney(
    entries.reduce((sum, entry) => sum + Number(entry.amountUsd), 0)
  );
}

export function filterMonthlyGroupsBy<T extends { amountUsd: number }>(
  months: MonthlyGroup<T>[],
  predicate: (entry: T) => boolean
): MonthlyGroup<T>[] {
  return months
    .map((month) => {
      const entries = month.entries.filter(predicate);
      const totalUsd = sumEntriesAmountUsd(entries);
      return { ...month, entries, totalUsd };
    })
    .filter((month) => month.entries.length > 0);
}
