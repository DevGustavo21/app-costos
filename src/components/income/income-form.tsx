"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Currency, IncomeEntryWithRelations, Plant, MeasurementUnit } from "@/types/database";
import { getMeasurementUnitLabel, getMeasurementUnitShort, usesVolumePricing } from "@/lib/measurement-unit";
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
import { computeAmountUsd, formatNio, formatUsd } from "@/lib/currency";

type IncomeFormProps = {
  businessUnitId: string;
  categories: Category[];
  plants: Plant[];
  defaultExchangeRate: number;
  measurementUnit: MeasurementUnit;
  basePricePerUnit: number | null;
  editEntry?: IncomeEntryWithRelations | null;
  onEditComplete?: () => void;
};

const emptyIncomeValues: IncomeEntryFormValues = {
  date: new Date(),
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

export function IncomeForm({
  businessUnitId,
  categories,
  plants,
  defaultExchangeRate,
  measurementUnit,
  basePricePerUnit,
  editEntry,
  onEditComplete,
}: IncomeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unitLabel = getMeasurementUnitLabel(measurementUnit);
  const unitShort = getMeasurementUnitShort(measurementUnit);

  const form = useForm<IncomeEntryFormValues>({
    resolver: zodResolver(incomeEntrySchema),
    defaultValues: emptyIncomeValues,
  });

  useEffect(() => {
    if (!editEntry) {
      const volumeSale = usesVolumePricing(measurementUnit);
      form.reset({
        ...emptyIncomeValues,
        date: new Date(),
        unitPrice: basePricePerUnit ?? undefined,
        isVolumeSale: volumeSale,
        currency: volumeSale ? Currency.NIO : Currency.USD,
        exchangeRate: volumeSale ? defaultExchangeRate : null,
      });
      return;
    }

    const volumeSale =
      usesVolumePricing(measurementUnit) &&
      !(editEntry.category?.isPlantCategory ?? false);

    form.reset({
      date: new Date(editEntry.date),
      categoryId: editEntry.categoryId,
      description: editEntry.description,
      currency: volumeSale ? Currency.NIO : editEntry.currency,
      amount: editEntry.amount,
      exchangeRate: volumeSale
        ? (editEntry.exchangeRate ?? defaultExchangeRate)
        : editEntry.exchangeRate,
      isPlantCategory: editEntry.category?.isPlantCategory ?? false,
      isVolumeSale: volumeSale,
      saleQuantity: editEntry.saleQuantity ?? undefined,
      unitPrice: editEntry.unitPrice ?? basePricePerUnit ?? undefined,
      lines: (editEntry.lines ?? []).map((l) => ({
        plantId: l.plantId ?? "",
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        description: l.description,
      })),
    });
  }, [editEntry, form, basePricePerUnit, measurementUnit, defaultExchangeRate]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const selectedCategoryId = form.watch("categoryId");
  const isPlantCategory = form.watch("isPlantCategory");
  const isVolumeSale =
    usesVolumePricing(measurementUnit) && !isPlantCategory;
  const saleQuantity = form.watch("saleQuantity") ?? 0;
  const volumeUnitPrice = form.watch("unitPrice") ?? basePricePerUnit ?? 0;
  const lines = form.watch("lines");

  useEffect(() => {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    form.setValue("isPlantCategory", cat?.isPlantCategory ?? false);
    form.setValue("isVolumeSale", usesVolumePricing(measurementUnit) && !cat?.isPlantCategory);
    if (cat?.isPlantCategory && fields.length === 0) {
      append({ plantId: "", quantity: 1, unitPrice: null, description: "" });
    }
  }, [selectedCategoryId, categories, form, fields.length, append, measurementUnit]);

  useEffect(() => {
    if (isVolumeSale && basePricePerUnit && !form.getValues("unitPrice")) {
      form.setValue("unitPrice", basePricePerUnit);
    }
  }, [isVolumeSale, basePricePerUnit, form]);

  useEffect(() => {
    if (isVolumeSale) {
      form.setValue("currency", Currency.NIO);
      if (!form.getValues("exchangeRate")) {
        form.setValue("exchangeRate", defaultExchangeRate);
      }
    }
  }, [isVolumeSale, defaultExchangeRate, form]);

  const exchangeRate = form.watch("exchangeRate") ?? defaultExchangeRate;

  const calculatedTotal = isPlantCategory
    ? (lines ?? []).reduce((sum, line) => {
        const plant = plants.find((p) => p.id === line.plantId);
        const price =
          line.unitPrice ?? plant?.basePrice ?? 0;
        return sum + (line.quantity ?? 0) * price;
      }, 0)
    : isVolumeSale
      ? saleQuantity * volumeUnitPrice
      : form.watch("amount") ?? 0;

  useEffect(() => {
    if (isPlantCategory || isVolumeSale) {
      form.setValue("amount", calculatedTotal);
    }
  }, [calculatedTotal, isPlantCategory, isVolumeSale, form]);

  const onSubmit = (values: IncomeEntryFormValues) => {
    const payload: IncomeEntryFormValues = isVolumeSale
      ? {
          ...values,
          currency: Currency.NIO,
          exchangeRate: values.exchangeRate ?? defaultExchangeRate,
          isVolumeSale: true,
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
          const volumeSale = usesVolumePricing(measurementUnit);
          form.reset({
            ...emptyIncomeValues,
            date: new Date(),
            unitPrice: basePricePerUnit ?? undefined,
            isVolumeSale: volumeSale,
            currency: volumeSale ? Currency.NIO : Currency.USD,
            exchangeRate: volumeSale ? defaultExchangeRate : null,
          });
        }
        router.refresh();
      } catch {
        toast.error("Error al guardar el ingreso");
      }
    });
  };

  return (
    <Card
      className={editEntry ? "shadow-sm ring-2 ring-emerald-200" : "shadow-sm"}
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
                  <DatePickerField value={field.value} onChange={field.onChange} />
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isPlantCategory && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Detalle de venta de plantas</h4>
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

                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2 rounded-md bg-muted/50 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.plantId`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Planta</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {plants.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} — {formatUsd(p.basePrice)}
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
                        name={`lines.${index}.quantity`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Cantidad ({unitLabel})</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...f}
                                onChange={(e) => f.onChange(parseInt(e.target.value) || 0)}
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
                          <FormItem>
                            <FormLabel>Precio unitario (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Precio base del catálogo"
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
                ))}

                <Separator />
                <p className="text-sm font-medium">
                  Total calculado: {formatUsd(calculatedTotal)}
                </p>
              </div>
            )}

            {isVolumeSale && (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                <h4 className="text-sm font-medium">Venta por volumen</h4>
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Precio por {unitShort} (C$)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          disabled={isPending}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="saleQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad ({unitLabel})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min={0}
                          disabled={isPending}
                          placeholder="Ej. 50"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-sm font-medium text-emerald-800">
                  Total calculado: {formatNio(calculatedTotal)}
                  {saleQuantity > 0 && volumeUnitPrice > 0 && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({saleQuantity} {unitShort} × {formatNio(volumeUnitPrice)})
                    </span>
                  )}
                  {calculatedTotal > 0 && (
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      ≈ {formatUsd(computeAmountUsd(calculatedTotal, Currency.NIO, exchangeRate))} USD
                    </span>
                  )}
                </p>
              </div>
            )}

            <CurrencyFields
              form={form}
              defaultExchangeRate={defaultExchangeRate}
              fixedCurrency={isVolumeSale ? Currency.NIO : undefined}
            />

            {!isPlantCategory && !isVolumeSale && (
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
