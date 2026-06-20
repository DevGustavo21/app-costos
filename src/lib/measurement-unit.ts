import { MeasurementUnit } from "@/types/database";

export const MEASUREMENT_UNIT_OPTIONS: {
  value: MeasurementUnit;
  label: string;
  description: string;
}[] = [
  {
    value: MeasurementUnit.UNIT,
    label: "Unidad",
    description: "Piezas, plantas, artículos contables por unidad",
  },
  {
    value: MeasurementUnit.LITER,
    label: "Litro",
    description: "Líquidos como leche, jugos o aceites",
  },
  {
    value: MeasurementUnit.GALLON,
    label: "Galón",
    description: "Líquidos vendidos por galón",
  },
  {
    value: MeasurementUnit.KILOGRAM,
    label: "Kilogramo",
    description: "Productos vendidos por peso (kg)",
  },
  {
    value: MeasurementUnit.POUND,
    label: "Libra",
    description: "Productos vendidos por libra",
  },
  {
    value: MeasurementUnit.BOX,
    label: "Caja",
    description: "Productos empacados por caja",
  },
  {
    value: MeasurementUnit.BAG,
    label: "Bolsa",
    description: "Productos empacados por bolsa",
  },
  {
    value: MeasurementUnit.LIVESTOCK_HEAD,
    label: "Cabeza de ganado",
    description: "Ganado contabilizado por cabeza",
  },
];

export function getMeasurementUnitLabel(unit: MeasurementUnit): string {
  return MEASUREMENT_UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? unit;
}

export function getMeasurementUnitShort(unit: MeasurementUnit): string {
  const shorts: Record<MeasurementUnit, string> = {
    unidad: "u.",
    litro: "L",
    galon: "gal",
    kg: "kg",
    libra: "lb",
    caja: "caja",
    bolsa: "bolsa",
    cabeza_ganado: "cab.",
  };
  return shorts[unit] ?? unit;
}

/** Litro o galón: ventas por cantidad × precio base. */
export function usesVolumePricing(unit: MeasurementUnit): boolean {
  return unit === MeasurementUnit.LITER || unit === MeasurementUnit.GALLON;
}

export function getBasePricePerUnitLabel(unit: MeasurementUnit): string {
  switch (unit) {
    case MeasurementUnit.LITER:
      return "Precio base por litro (C$)";
    case MeasurementUnit.GALLON:
      return "Precio base por galón (C$)";
    case MeasurementUnit.LIVESTOCK_HEAD:
      return "Precio base por cabeza (C$)";
    default:
      return "Precio base por unidad (C$)";
  }
}
