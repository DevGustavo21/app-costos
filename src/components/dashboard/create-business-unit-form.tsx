"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createBusinessUnit } from "@/lib/actions/business-units";
import {
  businessUnitSchema,
  type BusinessUnitFormValues,
} from "@/lib/validations/business-unit";
import { MeasurementUnitField } from "@/components/shared/measurement-unit-field";
import { BasePricePerUnitField } from "@/components/shared/base-price-per-unit-field";
import { MeasurementUnit } from "@/types/database";
import { usesVolumePricing } from "@/lib/measurement-unit";

export function CreateBusinessUnitForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BusinessUnitFormValues>({
    resolver: zodResolver(businessUnitSchema),
    defaultValues: {
      name: "",
      description: "",
      measurementUnit: MeasurementUnit.UNIT,
      basePricePerUnit: null,
    },
  });

  const measurementUnit = form.watch("measurementUnit");

  useEffect(() => {
    if (!usesVolumePricing(measurementUnit)) {
      form.setValue("basePricePerUnit", null);
    }
  }, [measurementUnit, form]);

  const onSubmit = (values: BusinessUnitFormValues) => {
    startTransition(async () => {
      try {
        const { slug } = await createBusinessUnit(values);
        toast.success("Unidad de negocio creada");
        form.reset();
        router.refresh();
        router.push(`/${slug}`);
      } catch {
        toast.error("No se pudo crear la unidad de negocio");
      }
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Nueva unidad de negocio</CardTitle>
        <CardDescription>
          Cree una unidad para gestionar ingresos, costos y configuración de forma independiente.
        </CardDescription>
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
                    <Input
                      placeholder="Ej. Vivero Central"
                      disabled={isPending}
                      {...field}
                    />
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
                    <Textarea
                      placeholder="Breve descripción de la unidad"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
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
            {usesVolumePricing(measurementUnit) && (
              <BasePricePerUnitField
                control={form.control}
                name="basePricePerUnit"
                measurementUnit={measurementUnit}
                disabled={isPending}
              />
            )}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear unidad
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
