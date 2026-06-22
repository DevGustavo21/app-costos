"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, CostEntryWithCategory, Currency } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyInput } from "@/components/shared/money-input";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { CurrencyFields } from "@/components/shared/currency-fields";
import { ReceiptUpload } from "@/components/shared/receipt-upload";
import { costEntrySchema, type CostEntryFormValues } from "@/lib/validations/cost";
import { createCostEntry, updateCostEntry } from "@/lib/actions/costs";
import { normalizePickerDate, parseLocalDate } from "@/lib/db/helpers";

type CostFormProps = {
  businessUnitId: string;
  categories: Category[];
  defaultExchangeRate: number;
  editEntry?: CostEntryWithCategory | null;
  onEditComplete?: () => void;
};

function getEmptyCostValues(): DefaultValues<CostEntryFormValues> {
  return {
    date: normalizePickerDate(new Date()),
    categoryId: "",
    description: "",
    currency: Currency.USD,
    amount: undefined,
    exchangeRate: null,
    receiptUrl: null,
  };
}

export function CostForm({
  businessUnitId,
  categories,
  defaultExchangeRate,
  editEntry,
  onEditComplete,
}: CostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CostEntryFormValues>({
    resolver: zodResolver(costEntrySchema),
    defaultValues: getEmptyCostValues(),
  });

  useEffect(() => {
    if (!editEntry) return;

    form.reset({
      date: parseLocalDate(editEntry.date),
      categoryId: editEntry.categoryId,
      description: editEntry.description,
      currency: editEntry.currency,
      amount: editEntry.amount,
      exchangeRate: editEntry.exchangeRate,
      receiptUrl: editEntry.receiptUrl,
    });
  }, [editEntry, form]);

  const onSubmit = (values: CostEntryFormValues) => {
    startTransition(async () => {
      try {
        if (editEntry) {
          await updateCostEntry(businessUnitId, editEntry.id, values);
          toast.success("Costo actualizado");
          onEditComplete?.();
        } else {
          await createCostEntry(businessUnitId, values);
          toast.success("Costo registrado");
          form.reset(getEmptyCostValues());
        }
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al guardar el costo";
        toast.error(message);
      }
    });
  };

  return (
    <Card
      className={editEntry ? "bg-emerald-50/50" : undefined}
    >
      <CardHeader>
        <CardTitle>{editEntry ? "Editar costo" : "Registrar costo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <DatePickerField
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CurrencyFields form={form} defaultExchangeRate={defaultExchangeRate} />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto de factura (opcional)</FormLabel>
                  <ReceiptUpload
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
              {editEntry && (
                <Button type="button" variant="outline" onClick={onEditComplete}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
