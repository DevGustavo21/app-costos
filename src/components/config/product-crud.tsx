"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { plantSchema, type PlantFormValues } from "@/lib/validations/plant";
import { createPlant, updatePlant, deletePlant } from "@/lib/actions/plants";
import { formatNio } from "@/lib/currency";

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
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: defaultCategoryId,
      measurementUnit: MeasurementUnit.UNIT,
      basePrice: 0,
      stock: null,
      isActive: true,
    },
  });

  const measurementUnit = form.watch("measurementUnit");
  const unitLabel = getMeasurementUnitLabel(measurementUnit);

  const onSubmit = (values: PlantFormValues) => {
    startTransition(async () => {
      try {
        if (editingId) {
          await updatePlant(businessUnitId, editingId, values);
          toast.success("Producto actualizado");
        } else {
          await createPlant(businessUnitId, values);
          toast.success("Producto creado");
        }
        form.reset({
          name: "",
          description: "",
          categoryId: defaultCategoryId,
          measurementUnit: MeasurementUnit.UNIT,
          basePrice: 0,
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

  const handleEdit = (product: Plant) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId ?? defaultCategoryId,
      measurementUnit: product.measurementUnit,
      basePrice: product.basePrice,
      stock: product.stock,
      isActive: product.isActive,
    });
  };

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

  if (catalogCategories.length === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Sin categorías de ingreso</AlertTitle>
        <AlertDescription>
          Cree categorías activas en{" "}
          <strong>Categorías de ingresos</strong> (ej. Ganado, Leche) y luego agregue
          aquí los subproductos con precio y stock (novillo, toro, vaca, etc.).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
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
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock en {unitLabel} (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.001"
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
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {editingId ? "Actualizar" : "Guardar"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset({
                        name: "",
                        description: "",
                        categoryId: defaultCategoryId,
                        measurementUnit: MeasurementUnit.UNIT,
                        basePrice: 0,
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

      <Card>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getMeasurementUnitShort(product.measurementUnit)}
                          </TableCell>
                          <TableCell>{formatNio(product.basePrice)}</TableCell>
                          <TableCell>
                            {product.stock != null
                              ? `${product.stock} ${getMeasurementUnitShort(product.measurementUnit)}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setConfirmDeleteId(product.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
