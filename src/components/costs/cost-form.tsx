"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, CostEntryWithCategory, Currency, CostPaymentStatus, CostExpenseReportStatus } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  COST_EXPENSE_REPORT_STATUS_OPTIONS,
  COST_PAYMENT_STATUS_OPTIONS,
  getCostExpenseReportStatusLabel,
  getCostPaymentStatusLabel,
} from "@/lib/entry-labels";

type CostFormProps = {
  businessUnitId: string;
  categories: Category[];
  defaultExchangeRate: number;
  defaultDate?: string;
  editEntry?: CostEntryWithCategory | null;
  onEditComplete?: () => void;
};

function getEmptyCostValues(defaultDate?: string): DefaultValues<CostEntryFormValues> {
  return {
    date: defaultDate
      ? parseLocalDate(defaultDate)
      : normalizePickerDate(new Date()),
    categoryId: "",
    description: "",
    currency: Currency.USD,
    amount: undefined,
    exchangeRate: null,
    receiptUrls: [],
    paymentStatus: CostPaymentStatus.ACCOUNTS_PAYABLE,
    expenseReportStatus: CostExpenseReportStatus.PENDING_REPORT,
    invoiceNumber: null,
  };
}

function buildCostFormValues(
  editEntry: CostEntryWithCategory | null | undefined,
  defaultExchangeRate: number,
  defaultDate?: string
): DefaultValues<CostEntryFormValues> {
  if (!editEntry) return getEmptyCostValues(defaultDate);

  const currency =
    editEntry.currency === Currency.NIO ? Currency.NIO : Currency.USD;

  return {
    date: parseLocalDate(editEntry.date),
    categoryId: editEntry.categoryId,
    description: editEntry.description,
    currency,
    amount: editEntry.amount,
    exchangeRate: editEntry.exchangeRate ?? defaultExchangeRate,
    receiptUrls: editEntry.receiptUrls ?? [],
    paymentStatus: editEntry.paymentStatus,
    expenseReportStatus: editEntry.expenseReportStatus,
    invoiceNumber: editEntry.invoiceNumber,
  };
}

export function CostForm({
  businessUnitId,
  categories,
  defaultExchangeRate,
  defaultDate,
  editEntry,
  onEditComplete,
}: CostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialValues = useMemo(
    () => buildCostFormValues(editEntry, defaultExchangeRate, defaultDate),
    [editEntry, defaultExchangeRate, defaultDate]
  );

  const form = useForm<CostEntryFormValues>({
    resolver: zodResolver(costEntrySchema),
    defaultValues: initialValues,
  });

  const currency = form.watch("currency");
  const expenseReportStatus = form.watch("expenseReportStatus");
  const requiresInvoiceNumber =
    expenseReportStatus === CostExpenseReportStatus.REPORTED_WITH_RECEIPT;

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
          form.reset(getEmptyCostValues(defaultDate));
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="min-w-0">
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
                  <FormItem className="min-w-0">
                    <FormLabel>Categoría</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COST_PAYMENT_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {getCostPaymentStatusLabel(status)}
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
                name="expenseReportStatus"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Rendición</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value !== CostExpenseReportStatus.REPORTED_WITH_RECEIPT) {
                          form.setValue("invoiceNumber", null);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COST_EXPENSE_REPORT_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {getCostExpenseReportStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {requiresInvoiceNumber && (
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Número de factura</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Ej. 001-002-00012345"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={2}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CurrencyFields
                form={form}
                defaultExchangeRate={defaultExchangeRate}
                showExchangeRate
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto total ({currency === Currency.NIO ? "C$" : "USD"})</FormLabel>
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
              name="receiptUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fotos de factura (opcional)</FormLabel>
                  <ReceiptUpload
                    value={field.value ?? []}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
              {editEntry && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit self-start"
                  onClick={onEditComplete}
                >
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
