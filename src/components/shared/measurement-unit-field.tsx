"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { MEASUREMENT_UNIT_OPTIONS } from "@/lib/measurement-unit";
import type { MeasurementUnit } from "@/types/database";

type MeasurementUnitFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  disabled?: boolean;
};

export function MeasurementUnitField<T extends FieldValues>({
  control,
  name,
  disabled,
}: MeasurementUnitFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Unidad de medida</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value as MeasurementUnit}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione unidad de medida" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {MEASUREMENT_UNIT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="font-medium">{option.label}</span>
                  <span className="ml-2 text-muted-foreground">
                    — {option.description}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
