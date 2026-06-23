"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
import { updateBusinessUnit } from "@/lib/actions/business-units";
import {
  businessUnitUpdateSchema,
  type BusinessUnitFormValues,
} from "@/lib/validations/business-unit";
import type { BusinessUnit } from "@/types/database";
import { IconPicker } from "@/components/config/icon-picker";
import { DEFAULT_BUSINESS_UNIT_ICON } from "@/lib/business-unit-icons";

type BusinessUnitSettingsFormProps = {
  businessUnit: BusinessUnit;
};

export function BusinessUnitSettingsForm({
  businessUnit,
}: BusinessUnitSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BusinessUnitFormValues>({
    resolver: zodResolver(businessUnitUpdateSchema),
    defaultValues: {
      name: businessUnit.name,
      description: businessUnit.description ?? "",
      icon: businessUnit.icon ?? DEFAULT_BUSINESS_UNIT_ICON,
    },
  });

  const onSubmit = (values: BusinessUnitFormValues) => {
    startTransition(async () => {
      try {
        const result = await updateBusinessUnit(businessUnit.id, values);
        toast.success("Unidad de negocio actualizada");
        router.refresh();
        if (result.slugChanged) {
          router.push(`/${result.slug}/configuracion/unidad`);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo actualizar la unidad";
        toast.error(message);
      }
    });
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Datos de la unidad</CardTitle>
        <CardDescription>
          Configure el nombre y la descripción de la unidad de negocio. La unidad de medida
          se define por producto en el catálogo.
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
                    <Input disabled={isPending} {...field} />
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
                      disabled={isPending}
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccionar icono</FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
