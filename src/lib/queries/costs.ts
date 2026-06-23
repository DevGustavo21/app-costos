import { CostEntryWithCategory } from "@/types/database";
import { db, dateOnly, formatMonthKey, formatMonthLabel, getCurrentMonthKey } from "@/lib/db/helpers";
import { mapCostEntry } from "@/lib/db/mappers";

export type MonthlyGroup<T> = {
  monthKey: string;
  monthLabel: string;
  totalUsd: number;
  entries: T[];
};

export type CostFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  paymentStatus?: string;
};

export async function getCostsGroupedByMonth(
  businessUnitId: string,
  filters: CostFilters = {}
) {
  let query = db()
    .from("cost_entries")
    .select("*, categories(*)")
    .eq("business_unit_id", businessUnitId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.paymentStatus) query = query.eq("payment_status", filters.paymentStatus);
  if (filters.dateFrom) query = query.gte("date", dateOnly(filters.dateFrom));
  if (filters.dateTo) query = query.lte("date", dateOnly(filters.dateTo));

  const { data, error } = await query;
  if (error) throw error;

  const entries = (data ?? []).map(mapCostEntry) as CostEntryWithCategory[];

  const totalsMap = new Map<string, number>();
  for (const entry of entries) {
    const key = formatMonthKey(entry.date);
    totalsMap.set(key, (totalsMap.get(key) ?? 0) + entry.amountUsd);
  }

  const grouped = new Map<string, CostEntryWithCategory[]>();
  for (const entry of entries) {
    const key = formatMonthKey(entry.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(entry);
  }

  const months: MonthlyGroup<CostEntryWithCategory>[] = [];
  for (const [monthKey, monthEntries] of Array.from(grouped.entries())) {
    months.push({
      monthKey,
      monthLabel: formatMonthLabel(monthEntries[0]!.date),
      totalUsd: totalsMap.get(monthKey) ?? 0,
      entries: monthEntries,
    });
  }

  return months;
}

export { getCurrentMonthKey };
