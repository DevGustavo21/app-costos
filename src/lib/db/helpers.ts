import { createAdminClient } from "@/lib/supabase/admin";

/** Cliente con service role para operaciones de servidor. */
export function db() {
  return createAdminClient();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function dateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Interpreta un valor DATE de la BD (YYYY-MM-DD) en hora local, sin desfase UTC. */
export function parseLocalDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
  }
  const [year, month, day] = value.split("T")[0]!.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/** Normaliza una fecha del calendario a mediodía local para evitar saltos de día. */
export function normalizePickerDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
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
  const d = typeof date === "string" ? parseLocalDate(date) : normalizePickerDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(date: string | Date): string {
  const d = typeof date === "string" ? parseLocalDate(date) : normalizePickerDate(date);
  return new Intl.DateTimeFormat("es", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getCurrentMonthKey(): string {
  return formatMonthKey(dateOnly(new Date()));
}
