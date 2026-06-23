"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plant, MeasurementUnit, Category } from "@/types/database";
import { getMeasurementUnitLabel, getMeasurementUnitShort } from "@/lib/measurement-unit";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DataTable } from "@/components/ui/data-table";
import { MoneyInput } from "@/components/shared/money-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MeasurementUnitField } from "@/components/shared/measurement-unit-field";
import { plantFormSchema, toPlantPayload, type PlantFormValues } from "@/lib/validations/plant";
import { createPlant, updatePlant, deletePlant } from "@/lib/actions/plants";
import { formatNio } from "@/lib/currency";
import {
  FORM_TABLE_FORM_SLOT,
  FORM_TABLE_GRID,
  FORM_TABLE_TABLE_SLOT,
} from "@/lib/form-table-layout";
import { cn } from "@/lib/utils";

type ProductCrudProps = {
  businessUnitId: string;
  products: Plant[];
  catalogCategories: Category[];
};

export function ProductCrud({
  businessUnitId,
  products,
  catalogCategories,
}: ProductCrudProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const defaultCategoryId = catalogCategories[0]?.id ?? "";

  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: defaultCategoryId,
      measurementUnit: MeasurementUnit.UNIT,
      basePrice: undefined,
      trackStock: false,
      stock: null,
      isActive: true,
    } satisfies DefaultValues<PlantFormValues>,
  });

  const measurementUnit = form.watch("measurementUnit");
  const trackStock = form.watch("trackStock");
  const unitLabel = getMeasurementUnitLabel(measurementUnit);

  const onSubmit = (values: PlantFormValues) => {
    const payload = toPlantPayload(values);
    startTransition(async () => {
      try {
        if (editingId) {
          await updatePlant(businessUnitId, editingId, payload);
          toast.success("Producto actualizado");
        } else {
          await createPlant(businessUnitId, payload);
          toast.success("Producto creado");
        }
        form.reset({
          name: "",
          description: "",
          categoryId: defaultCategoryId,
          measurementUnit: MeasurementUnit.UNIT,
          basePrice: undefined,
          trackStock: false,
          stock: null,
          isActive: true,
        });
        setEditingId(null);
        router.refresh();
      } catch {
        toast.error("Error al guardar producto");
      }
    });
  };

  const handleEdit = useCallback((product: Plant) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId ?? defaultCategoryId,
      measurementUnit: product.measurementUnit,
      basePrice: product.basePrice,
      trackStock: product.stock != null,
      stock: product.stock,
      isActive: product.isActive,
    });
  }, [defaultCategoryId, form]);

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    startTransition(async () => {
      try {
        await deletePlant(businessUnitId, id);
        toast.success("Producto eliminado/desactivado");
        setConfirmDeleteId(null);
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      }
    });
  };

  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, Plant[]>();
    for (const product of products) {
      const key = product.categoryId ?? "sin-categoria";
      const list = grouped.get(key) ?? [];
      list.push(product);
      grouped.set(key, list);
    }
    return grouped;
  }, [products]);

  const productColumns = useMemo<ColumnDef<Plant>[]>(
    () => [
      {
        id: "name",
        header: "Producto",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="text-xs text-muted-foreground">{row.original.description}</p>
            )}
          </div>
        ),
      },
      {
        id: "unit",
        header: "Unidad",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {getMeasurementUnitShort(row.original.measurementUnit)}
          </span>
        ),
      },
      {
        id: "price",
        header: "Precio",
        cell: ({ row }) => formatNio(row.original.basePrice),
      },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => {
          if (row.original.stock == null) {
            return <span className="text-muted-foreground">Ilimitado</span>;
          }

          const isDepleted = row.original.stock <= 0;

          return (
            <span className={isDepleted ? "font-medium text-destructive" : undefined}>
              {row.original.stock} {getMeasurementUnitShort(row.original.measurementUnit)}
              {isDepleted ? " (agotado)" : ""}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDeleteId(row.original.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit]
  );

  if (catalogCategories.length === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Sin categorías con catálogo</AlertTitle>
        <AlertDescription>
          Active <strong>Venta por catálogo en ingresos</strong> en al menos una
          categoría de <strong>Categorías de ingresos</strong> (ej. Ganado, Leche) y
          luego agregue aquí los subproductos con precio y stock (novillo, toro, vaca,
          etc.).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={FORM_TABLE_GRID}>
      <Card className={cn(FORM_TABLE_FORM_SLOT)}>
        <CardHeader>
          <CardTitle>{editingId ? "Editar producto" : "Nuevo producto"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría de ingreso</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría padre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {catalogCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Categoría padre (ej. Ganado, Leche). Los productos aquí son las
                      subcategorías con precio y stock.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del producto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
              <MeasurementUnitField
                control={form.control}
                name="measurementUnit"
                disabled={isPending}
              />
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio base (C$)</FormLabel>
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
                name="trackStock"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                              form.setValue("stock", null);
                            }
                          }}
                        />
                      </FormControl>
                      <Label>¿Desea activar stock?</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Si está desactivado, el producto tiene stock ilimitado y no se
                      valida inventario al vender.
                    </p>
                  </FormItem>
                )}
              />
              {trackStock && (
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock disponible ({unitLabel})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.001"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Cantidad inicial en inventario. Se descuenta con cada venta y no
                        permite vender por encima de este límite.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <Label>Activo</Label>
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isPending} className="w-full">
                  {editingId ? "Actualizar" : "Guardar"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit self-start"
                    onClick={() => {
                      form.reset({
                        name: "",
                        description: "",
                        categoryId: defaultCategoryId,
                        measurementUnit: MeasurementUnit.UNIT,
                        basePrice: undefined,
                        trackStock: false,
                        stock: null,
                        isActive: true,
                      });
                      setEditingId(null);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className={cn(FORM_TABLE_TABLE_SLOT)}>
        <CardHeader>
          <CardTitle>Productos por categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {catalogCategories.map((cat) => {
            const items = productsByCategory.get(cat.id) ?? [];
            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{cat.name}</h3>
                  <Badge variant="secondary">{items.length} producto(s)</Badge>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin productos. Agregue subcategorías como novillo, toro, vaca, etc.
                  </p>
                ) : (
                  <DataTable
                    columns={productColumns}
                    data={items}
                    getRowId={(product) => product.id}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDeleteId != null}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmDeleteId(null);
        }}
        title="¿Eliminar producto?"
        description="Si el producto tiene ventas asociadas, se desactivará. De lo contrario, se eliminará permanentemente."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
