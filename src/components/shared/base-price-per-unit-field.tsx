"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { getBasePricePerUnitLabel } from "@/lib/measurement-unit";
import type { MeasurementUnit } from "@/types/database";

type BasePricePerUnitFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  measurementUnit: MeasurementUnit;
  disabled?: boolean;
};

export function BasePricePerUnitField<T extends FieldValues>({
  control,
  name,
  measurementUnit,
  disabled,
}: BasePricePerUnitFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{getBasePricePerUnitLabel(measurementUnit)}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              min={0}
              disabled={disabled}
              placeholder="Ej. 45.50"
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
  );
}
