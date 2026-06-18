import { createAdminClient } from "@/lib/supabase/admin";

/** Cliente con service role para operaciones de servidor (reemplaza Prisma). */
export function db() {
  return createAdminClient();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function dateOnly(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

export function sumAmountUsd(rows: { amount_usd?: number | string; amountUsd?: number }[]): number {
  return rows.reduce((s, r) => s + Number(r.amount_usd ?? r.amountUsd ?? 0), 0);
}

/** Supabase puede devolver relaciones como objeto o array según el join. */
export function unwrapJoin<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

export function formatMonthKey(date: string | Date): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(date: string | Date): string {
  return new Intl.DateTimeFormat("es", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
