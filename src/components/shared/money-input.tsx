"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  value: number | null | undefined;
  onChange: (value: number | null | undefined) => void;
};

function toDisplayValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return String(value);
}

export function MoneyInput({
  value,
  onChange,
  className,
  disabled,
  onBlur,
  ...props
}: MoneyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [display, setDisplay] = React.useState(() => toDisplayValue(value));

  React.useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setDisplay(toDisplayValue(value));
  }, [value]);

  const commit = (raw: string) => {
    const normalized = raw.replace(",", ".").trim();
    if (normalized === "" || normalized === ".") {
      setDisplay("");
      onChange(undefined);
      return;
    }
    const num = Number(normalized);
    if (!Number.isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={cn("tabular-nums", className)}
      value={display}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
        setDisplay(raw);
        if (raw === "" || raw === ".") {
          onChange(undefined);
          return;
        }
        if (!raw.endsWith(".")) {
          const num = Number(raw);
          if (!Number.isNaN(num)) onChange(num);
        }
      }}
      onBlur={(e) => {
        commit(display);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}
