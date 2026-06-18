"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2024, i, 1);
  return {
    value: String(i + 1),
    label: format(date, "MMMM", { locale: es }),
  };
});

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const year = searchParams.get("year") ?? now.getFullYear().toString();
  const month = searchParams.get("month") ?? (now.getMonth() + 1).toString();

  const apply = (y: string, m: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", y);
    params.set("month", m);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label>Año</Label>
        <Input
          type="number"
          value={year}
          onChange={(e) => apply(e.target.value, month)}
          className="w-24"
        />
      </div>
      <div className="space-y-1">
        <Label>Mes</Label>
        <Select value={month} onValueChange={(m) => apply(year, m)}>
          <SelectTrigger className="w-[140px] capitalize">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value} className="capitalize">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        onClick={() =>
          apply(now.getFullYear().toString(), (now.getMonth() + 1).toString())
        }
      >
        Mes actual
      </Button>
    </div>
  );
}
