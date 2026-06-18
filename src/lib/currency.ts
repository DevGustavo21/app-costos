import { Currency } from "@/types/database";
import { db } from "@/lib/db/helpers";

const DEFAULT_EXCHANGE_RATE = 36.5;

export async function getExchangeRate(businessUnitId: string): Promise<number> {
  const { data: unitSetting } = await db()
    .from("settings")
    .select("value")
    .eq("business_unit_id", businessUnitId)
    .eq("key", "exchangeRate")
    .maybeSingle();

  if (unitSetting) return parseFloat(unitSetting.value);

  const { data: globalSetting } = await db()
    .from("settings")
    .select("value")
    .is("business_unit_id", null)
    .eq("key", "exchangeRate")
    .maybeSingle();

  if (globalSetting) return parseFloat(globalSetting.value);

  return DEFAULT_EXCHANGE_RATE;
}

export function computeAmountUsd(
  amount: number,
  currency: Currency,
  exchangeRate?: number | null
): number {
  if (currency === Currency.USD) return amount;
  const rate = exchangeRate ?? DEFAULT_EXCHANGE_RATE;
  return amount / rate;
}

export function formatUsd(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatAmount(amount: number | string, currency: Currency): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

/** Moneda local de operación (Nicaragua). */
export const LOCAL_CURRENCY = Currency.NIO;

export function formatNio(amount: number | string): string {
  return formatAmount(amount, Currency.NIO);
}

export function formatCurrencyLabel(currency: Currency): string {
  return currency === Currency.NIO ? "C$" : currency;
}

type IncomeDisplayEntry = {
  currency: Currency;
  amount: number;
  amountUsd: number;
  exchangeRate: number | null;
  saleQuantity: number | null;
  unitPrice: number | null;
};

/** Monto y USD para mostrar; ventas por volumen siempre en córdobas. */
export function resolveIncomeDisplay(
  entry: IncomeDisplayEntry,
  options: { volumePricing: boolean; defaultExchangeRate: number }
) {
  const isVolume = entry.saleQuantity != null && entry.unitPrice != null;
  const currency =
    isVolume && options.volumePricing ? Currency.NIO : entry.currency;
  const exchangeRate =
    currency === Currency.NIO
      ? (entry.exchangeRate ?? options.defaultExchangeRate)
      : entry.exchangeRate;
  const amountUsd =
    currency === Currency.NIO
      ? computeAmountUsd(entry.amount, Currency.NIO, exchangeRate)
      : entry.amountUsd;
  return { currency, exchangeRate, amountUsd };
}
