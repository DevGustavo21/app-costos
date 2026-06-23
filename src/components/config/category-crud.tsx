"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, CategoryType } from "@/types/database";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { categorySchema, type CategoryFormValues } from "@/lib/validations/category";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import {
  FORM_TABLE_FORM_SLOT,
  FORM_TABLE_GRID,
  FORM_TABLE_TABLE_SLOT,
} from "@/lib/form-table-layout";
import { cn } from "@/lib/utils";

type CategoryCrudProps = {
  businessUnitId: string;
  type: CategoryType;
  categories: Category[];
  title: string;
  showPlantFlag?: boolean;
  productCounts?: Record<string, number>;
};

export function CategoryCrud({
  businessUnitId,
  type,
  categories,
  title,
  showPlantFlag = false,
  productCounts = {},
}: CategoryCrudProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      isPlantCategory: false,
    },
  });

  const onSubmit = (values: CategoryFormValues) => {
    startTransition(async () => {
      try {
        if (editingId) {
          await updateCategory(businessUnitId, type, editingId, values);
          toast.success("Categoría actualizada");
        } else {
          await createCategory(businessUnitId, type, values);
          toast.success("Categoría creada");
        }
        form.reset({ name: "", description: "", isActive: true, isPlantCategory: false });
        setEditingId(null);
        router.refresh();
      } catch {
        toast.error("Error al guardar categoría");
      }
    });
  };

  const handleEdit = useCallback((cat: Category) => {
    setEditingId(cat.id);
    form.reset({
      name: cat.name,
      description: cat.description ?? "",
      isActive: cat.isActive,
      isPlantCategory: cat.isPlantCategory,
    });
  }, [form]);

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    startTransition(async () => {
      try {
        await deleteCategory(businessUnitId, type, id);
        toast.success("Categoría eliminada/desactivada");
        setConfirmDeleteId(null);
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      }
    });
  };

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        id: "name",
        header: "Nombre",
        cell: ({ row }) => {
          const cat = row.original;
          return (
            <div>
              <p className="font-medium">{cat.name}</p>
              {cat.description && (
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              )}
              {cat.isPlantCategory && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary">Catálogo</Badge>
                  {(productCounts[cat.id] ?? 0) > 0 && (
                    <Badge variant="outline">
                      {productCounts[cat.id]} producto(s)
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Activa" : "Inactiva"}
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
    [productCounts, handleEdit]
  );

  return (
    <div className={FORM_TABLE_GRID}>
      <Card className={cn("shadow-sm", FORM_TABLE_FORM_SLOT)}>
        <CardHeader>
          <CardTitle>{editingId ? "Editar categoría" : `Nueva — ${title}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
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
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <Label>Activa</Label>
                  </FormItem>
                )}
              />
              {showPlantFlag && (
                <FormField
                  control={form.control}
                  name="isPlantCategory"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <Label>Venta por catálogo en ingresos</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Al registrar ingresos, permite elegir productos con cantidad y precio.
                        Los subproductos (novillo, toro, vaca) se crean en Catálogo de productos.
                      </p>
                    </FormItem>
                  )}
                />
              )}
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
                        isActive: true,
                        isPlantCategory: false,
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

      <Card className={cn("shadow-sm", FORM_TABLE_TABLE_SLOT)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories}
            getRowId={(cat) => cat.id}
            emptyMessage="No hay categorías registradas"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDeleteId != null}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmDeleteId(null);
        }}
        title="¿Eliminar categoría?"
        description="Si la categoría tiene registros asociados, se desactivará. De lo contrario, se eliminará permanentemente."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
