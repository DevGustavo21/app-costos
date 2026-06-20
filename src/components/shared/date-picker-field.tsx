"use client";

import { format } from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateOnly, normalizePickerDate, parseLocalDate } from "@/lib/db/helpers";
import { Input } from "@/components/ui/input";

type DatePickerFieldProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
};

export function DatePickerField({
  value,
  onChange,
  onBlur,
  disabled,
}: DatePickerFieldProps) {
  const inputValue = value ? dateOnly(value) : "";

  return (
    <div className="relative">
      <CalendarIcon className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="date"
        value={inputValue}
        disabled={disabled}
        className={cn("pl-9", !value && "text-muted-foreground")}
        onChange={(e) => {
          const next = e.target.value;
          if (!next) return;
          onChange(normalizePickerDate(parseLocalDate(next)));
        }}
        onBlur={onBlur}
        aria-label={value ? format(value, "PPP", { locale: esDateFns }) : "Seleccionar fecha"}
      />
    </div>
  );
}
