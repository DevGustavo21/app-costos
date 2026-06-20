"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Currency, IncomeEntryWithRelations, Plant } from "@/types/database";
import { getMeasurementUnitLabel, getMeasurementUnitShort } from "@/lib/measurement-unit";
import { Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { CurrencyFields } from "@/components/shared/currency-fields";
import {
  incomeEntrySchema,
  type IncomeEntryFormValues,
} from "@/lib/validations/income";
import { createIncomeEntry, updateIncomeEntry } from "@/lib/actions/income";
import { formatNio } from "@/lib/currency";
import { parseLocalDate, normalizePickerDate } from "@/lib/db/helpers";

function getEmptyIncomeValues(): IncomeEntryFormValues {
  return {
    date: normalizePickerDate(new Date()),
    categoryId: "",
    description: "",
    currency: Currency.USD,
    amount: 0,
    exchangeRate: null,
    isPlantCategory: false,
    isVolumeSale: false,
    saleQuantity: undefined,
    unitPrice: undefined,
    lines: [],
  };
}

type IncomeFormProps = {
  businessUnitId: string;
  categories: Category[];
  plants: Plant[];
  defaultExchangeRate: number;
  editEntry?: IncomeEntryWithRelations | null;
  onEditComplete?: () => void;
};

export function IncomeForm({
  businessUnitId,
  categories,
  plants,
  defaultExchangeRate,
  editEntry,
  onEditComplete,
}: IncomeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<IncomeEntryFormValues>({
    resolver: zodResolver(incomeEntrySchema),
    defaultValues: getEmptyIncomeValues(),
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
      isPlantCategory: editEntry.category?.isPlantCategory ?? false,
      isVolumeSale: false,
      saleQuantity: editEntry.saleQuantity ?? undefined,
      unitPrice: editEntry.unitPrice ?? undefined,
      lines: (editEntry.lines ?? []).map((l) => ({
        plantId: l.plantId ?? "",
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        description: l.description,
      })),
    });
  }, [editEntry, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const selectedCategoryId = form.watch("categoryId");
  const lines = form.watch("lines");

  const catalogProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return plants.filter(
      (p) => p.isActive && p.categoryId === selectedCategoryId
    );
  }, [plants, selectedCategoryId]);

  const usesCatalog = useMemo(() => {
    if (!selectedCategoryId) return false;
    const cat = categories.find((c) => c.id === selectedCategoryId);
    return (cat?.isPlantCategory ?? false) || catalogProducts.length > 0;
  }, [selectedCategoryId, categories, catalogProducts.length]);

  useEffect(() => {
    form.setValue("isPlantCategory", usesCatalog);
    form.setValue("isVolumeSale", false);
    if (usesCatalog && fields.length === 0) {
      append({ plantId: "", quantity: 1, unitPrice: null, description: "" });
    }
  }, [selectedCategoryId, usesCatalog, form, fields.length, append]);

  const calculatedTotal = usesCatalog
    ? (lines ?? []).reduce((sum, line) => {
        const product = catalogProducts.find((p) => p.id === line.plantId);
        const price = line.unitPrice ?? product?.basePrice ?? 0;
        return sum + (line.quantity ?? 0) * price;
      }, 0)
    : form.watch("amount") ?? 0;

  useEffect(() => {
    if (usesCatalog) {
      form.setValue("amount", calculatedTotal);
      form.setValue("currency", Currency.NIO);
      if (!form.getValues("exchangeRate")) {
        form.setValue("exchangeRate", defaultExchangeRate);
      }
    }
  }, [calculatedTotal, usesCatalog, form, defaultExchangeRate]);

  const onSubmit = (values: IncomeEntryFormValues) => {
    const payload: IncomeEntryFormValues = usesCatalog
      ? {
          ...values,
          currency: Currency.NIO,
          exchangeRate: values.exchangeRate ?? defaultExchangeRate,
          isVolumeSale: false,
        }
      : values;

    startTransition(async () => {
      try {
        if (editEntry) {
          await updateIncomeEntry(businessUnitId, editEntry.id, payload);
          toast.success("Ingreso actualizado");
          onEditComplete?.();
        } else {
          await createIncomeEntry(businessUnitId, payload);
          toast.success("Ingreso registrado");
          form.reset(getEmptyIncomeValues());
        }
        router.refresh();
      } catch {
        toast.error("Error al guardar el ingreso");
      }
    });
  };

  return (
    <Card
      className={editEntry ? "bg-emerald-50/50" : undefined}
    >
      <CardHeader>
        <CardTitle>{editEntry ? "Editar ingreso" : "Registrar ingreso"}</CardTitle>
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
                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="whitespace-normal">
                          {cat.name}
                          {(cat.isPlantCategory ||
                            plants.some(
                              (p) => p.isActive && p.categoryId === cat.id
                            )) &&
                            " (catálogo)"}
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {usesCatalog && (
              <div className="space-y-3 rounded-lg bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Detalle de venta por catálogo</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ plantId: "", quantity: 1, unitPrice: null, description: "" })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Línea
                  </Button>
                </div>

                {catalogProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay productos en el catálogo para esta categoría. Agréguelos en
                    Catálogo de productos.
                  </p>
                ) : null}

                {fields.map((field, index) => {
                  const linePlantId = form.watch(`lines.${index}.plantId`);
                  const lineProduct = catalogProducts.find((p) => p.id === linePlantId);
                  const lineUnitLabel = lineProduct
                    ? getMeasurementUnitLabel(lineProduct.measurementUnit)
                    : "unidad";

                  return (
                  <div key={field.id} className="space-y-3 rounded-md border border-border/50 bg-background p-3">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.plantId`}
                      render={({ field: f }) => (
                        <FormItem className="min-w-0">
                          <FormLabel>Producto</FormLabel>
                          <Select onValueChange={f.onChange} value={f.value}>
                            <FormControl>
                              <SelectTrigger className="w-full min-w-0">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                              {catalogProducts.map((p) => (
                                <SelectItem key={p.id} value={p.id} className="whitespace-normal">
                                  {p.name} — {formatNio(p.basePrice)} /{" "}
                                  {getMeasurementUnitShort(p.measurementUnit)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.quantity`}
                        render={({ field: f }) => (
                          <FormItem className="min-w-0">
                            <FormLabel>Cantidad ({lineUnitLabel})</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.001"
                                className="w-full min-w-0"
                                {...f}
                                onChange={(e) =>
                                  f.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.unitPrice`}
                        render={({ field: f }) => (
                          <FormItem className="min-w-0">
                            <FormLabel>Precio unitario C$ (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Precio del catálogo"
                                className="w-full min-w-0"
                                value={f.value ?? ""}
                                onChange={(e) =>
                                  f.onChange(
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Eliminar línea
                      </Button>
                    )}
                  </div>
                  );
                })}

                <Separator />
                <p className="text-sm font-medium">
                  Total calculado: {formatNio(calculatedTotal)}
                </p>
              </div>
            )}

            <CurrencyFields
              form={form}
              defaultExchangeRate={defaultExchangeRate}
              fixedCurrency={usesCatalog ? Currency.NIO : undefined}
            />

            {!usesCatalog && (
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto total</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
