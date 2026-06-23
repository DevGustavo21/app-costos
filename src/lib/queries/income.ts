import { IncomeEntryWithRelations } from "@/types/database";
import { db, dateOnly, formatMonthKey, formatMonthLabel } from "@/lib/db/helpers";
import { mapIncomeEntry } from "@/lib/db/mappers";
import { sumEntriesAmountUsd } from "@/lib/monthly-groups";
import type { MonthlyGroup } from "./costs";

export type IncomeFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  plantId?: string;
  collectionStatus?: string;
};

export async function getIncomeGroupedByMonth(
  businessUnitId: string,
  filters: IncomeFilters = {}
) {
  if (filters.plantId) {
    const { data: lineRows } = await db()
      .from("income_lines")
      .select("income_entry_id")
      .eq("plant_id", filters.plantId);

    const entryIds = Array.from(new Set((lineRows ?? []).map((r) => r.income_entry_id)));
    if (entryIds.length === 0) return [];
  }

  let query = db()
    .from("income_entries")
    .select("*, categories(*), income_lines(*, plants(*))")
    .eq("business_unit_id", businessUnitId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.collectionStatus) {
    query = query.eq("collection_status", filters.collectionStatus);
  }
  if (filters.dateFrom) query = query.gte("date", dateOnly(filters.dateFrom));
  if (filters.dateTo) query = query.lte("date", dateOnly(filters.dateTo));

  const { data, error } = await query;
  if (error) throw error;

  let entries = (data ?? []).map((row) =>
    mapIncomeEntry({ ...row, lines: row.income_lines })
  ) as IncomeEntryWithRelations[];

  if (filters.plantId) {
    entries = entries.filter((e) =>
      e.lines?.some((l) => l.plantId === filters.plantId)
    );
  }

  const grouped = new Map<string, IncomeEntryWithRelations[]>();
  for (const entry of entries) {
    const key = formatMonthKey(entry.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(entry);
  }

  const months: MonthlyGroup<IncomeEntryWithRelations>[] = [];
  for (const [monthKey, monthEntries] of Array.from(grouped.entries())) {
    months.push({
      monthKey,
      monthLabel: formatMonthLabel(monthEntries[0]!.date),
      totalUsd: sumEntriesAmountUsd(monthEntries),
      entries: monthEntries,
    });
  }

  return months;
}
