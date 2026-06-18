"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plant, MeasurementUnit } from "@/types/database";
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
import { plantSchema, type PlantFormValues } from "@/lib/validations/plant";
import { createPlant, updatePlant, deletePlant } from "@/lib/actions/plants";
import { formatUsd } from "@/lib/currency";

type PlantCrudProps = {
  businessUnitId: string;
  plants: Plant[];
  measurementUnit: MeasurementUnit;
};

export function PlantCrud({
  businessUnitId,
  plants,
  measurementUnit,
}: PlantCrudProps) {
  const unitLabel = getMeasurementUnitLabel(measurementUnit);
  const unitShort = getMeasurementUnitShort(measurementUnit);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: 0,
      stock: null,
      isActive: true,
    },
  });

  const onSubmit = (values: PlantFormValues) => {
    startTransition(async () => {
      try {
        if (editingId) {
          await updatePlant(businessUnitId, editingId, values);
          toast.success("Planta actualizada");
        } else {
          await createPlant(businessUnitId, values);
          toast.success("Planta creada");
        }
        form.reset({ name: "", description: "", basePrice: 0, stock: null, isActive: true });
        setEditingId(null);
        router.refresh();
      } catch {
        toast.error("Error al guardar planta");
      }
    });
  };

  const handleEdit = (plant: Plant) => {
    setEditingId(plant.id);
    form.reset({
      name: plant.name,
      description: plant.description ?? "",
      basePrice: plant.basePrice,
      stock: plant.stock,
      isActive: plant.isActive,
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar o desactivar esta planta?")) return;
    startTransition(async () => {
      try {
        await deletePlant(businessUnitId, id);
        toast.success("Planta eliminada/desactivada");
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{editingId ? "Editar planta" : "Nueva planta"}</CardTitle>
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
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio base (USD)</FormLabel>
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
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : null)
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
                    <Label>Activa</Label>
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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Catálogo de plantas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock ({unitShort})</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.map((plant) => (
                <TableRow key={plant.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{plant.name}</p>
                      {plant.description && (
                        <p className="text-xs text-muted-foreground">{plant.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatUsd(plant.basePrice)}</TableCell>
                  <TableCell>{plant.stock ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={plant.isActive ? "default" : "secondary"}>
                      {plant.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(plant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(plant.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
