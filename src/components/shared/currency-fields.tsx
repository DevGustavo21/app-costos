"use client";

import { Currency } from "@/types/database";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CurrencyFieldsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  defaultExchangeRate?: number;
  /** Si se define, la moneda queda fija (p. ej. ventas por volumen en córdobas). */
  fixedCurrency?: Currency;
};

export function CurrencyFields({
  form,
  defaultExchangeRate,
  fixedCurrency,
}: CurrencyFieldsProps) {
  const currency = (fixedCurrency ?? form.watch("currency")) as Currency;

  useEffect(() => {
    if (fixedCurrency) {
      form.setValue("currency", fixedCurrency);
    }
  }, [fixedCurrency, form]);

  useEffect(() => {
    if (currency === Currency.NIO && defaultExchangeRate && !form.getValues("exchangeRate")) {
      form.setValue("exchangeRate", defaultExchangeRate);
    }
  }, [currency, defaultExchangeRate, form]);

  return (
    <>
      {!fixedCurrency && (
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moneda</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={Currency.USD}>USD</SelectItem>
                  <SelectItem value={Currency.NIO}>C$ (córdobas)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {currency === Currency.NIO && (
        <FormField
          control={form.control}
          name="exchangeRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tasa de cambio (NIO → USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder={defaultExchangeRate?.toString()}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
