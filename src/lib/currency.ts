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

export function computeAmountNio(
  amount: number,
  currency: Currency,
  exchangeRate?: number | null
): number {
  if (currency === Currency.NIO) return amount;
  const rate = exchangeRate ?? DEFAULT_EXCHANGE_RATE;
  return amount * rate;
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

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
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

/** Montos C$ y USD para mostrar en tablas de ingresos. */
export function resolveIncomeDisplay(
  entry: IncomeDisplayEntry,
  options: { volumePricing: boolean; defaultExchangeRate: number }
) {
  const isVolume = entry.saleQuantity != null && entry.unitPrice != null;
  const currency =
    isVolume && options.volumePricing ? Currency.NIO : entry.currency;
  const exchangeRate = entry.exchangeRate ?? options.defaultExchangeRate;

  const amountNio =
    currency === Currency.NIO
      ? entry.amount
      : computeAmountNio(entry.amount, Currency.USD, exchangeRate);
  const amountUsd =
    currency === Currency.NIO
      ? computeAmountUsd(entry.amount, Currency.NIO, exchangeRate)
      : Number(entry.amountUsd);

  return { currency, exchangeRate, amountNio, amountUsd };
}

type CostDisplayEntry = {
  currency: Currency;
  amount: number;
  amountUsd: number;
  exchangeRate: number | null;
};

/** Montos C$ y USD para mostrar en tablas de costos. */
export function resolveCostDisplay(
  entry: CostDisplayEntry,
  options: { defaultExchangeRate: number }
) {
  const exchangeRate = entry.exchangeRate ?? options.defaultExchangeRate;
  const amountNio =
    entry.currency === Currency.NIO
      ? entry.amount
      : computeAmountNio(entry.amount, Currency.USD, exchangeRate);
  const amountUsd =
    entry.currency === Currency.USD
      ? entry.amount
      : Number(entry.amountUsd);

  return { exchangeRate, amountNio, amountUsd };
}

export async function resolveExchangeRate(
  businessUnitId: string,
  currency: Currency,
  exchangeRate?: number | null
): Promise<number | null> {
  if (exchangeRate && exchangeRate > 0) return exchangeRate;
  return getExchangeRate(businessUnitId);
}
