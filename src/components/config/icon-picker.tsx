"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ANIMAL_ICON_COUNT,
  searchAnimalIcons,
  searchIcons,
  SUGGESTED_ANIMAL_ICONS,
  SUGGESTED_BUSINESS_ICONS,
  TOTAL_ICON_COUNT,
} from "@/lib/business-unit-icon-catalog";
import {
  formatIconCollection,
  formatIconLabel,
  resolveIconId,
} from "@/lib/business-unit-icons";
import { cn } from "@/lib/utils";

type IconPickerProps = {
  value: string | null | undefined;
  onChange: (iconId: string) => void;
};

function IconGrid({
  icons,
  selected,
  onChange,
}: {
  icons: string[];
  selected: string;
  onChange: (iconId: string) => void;
}) {
  if (icons.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay iconos con ese nombre
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
      {icons.map((id) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md border p-2 text-[10px] leading-tight transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent hover:border-border hover:bg-background"
            )}
            title={id}
          >
            <Icon icon={id} className="size-5 shrink-0" />
            <span className="line-clamp-2 w-full text-center">
              {formatIconLabel(id)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"business" | "animals" | "all">("business");
  const selected = resolveIconId(value);
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, "-");

  const businessIcons = useMemo(() => {
    if (normalizedQuery) return searchIcons(normalizedQuery);
    return SUGGESTED_BUSINESS_ICONS;
  }, [normalizedQuery]);

  const animalIcons = useMemo(() => {
    if (normalizedQuery) return searchAnimalIcons(normalizedQuery);
    return SUGGESTED_ANIMAL_ICONS;
  }, [normalizedQuery]);

  const allIcons = useMemo(() => {
    if (!normalizedQuery) return SUGGESTED_BUSINESS_ICONS;
    return searchIcons(normalizedQuery);
  }, [normalizedQuery]);

  const activeIcons =
    tab === "business"
      ? businessIcons
      : tab === "animals"
        ? animalIcons
        : allIcons;

  const hint = normalizedQuery
    ? `${activeIcons.length} resultado(s)${activeIcons.length === 240 ? " (máx. mostrados)" : ""}`
    : tab === "animals"
      ? `${ANIMAL_ICON_COUNT} iconos de animales. Escriba en el buscador para filtrar.`
      : `Biblioteca de ${TOTAL_ICON_COUNT} iconos (Lucide, Material, Font Awesome, Game Icons).`;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar iconos (ej. cow, store, fish, pig)..."
          className="pl-8"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "business" | "animals" | "all")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business">Negocios</TabsTrigger>
          <TabsTrigger value="animals">Animales</TabsTrigger>
          <TabsTrigger value="all">Todo</TabsTrigger>
        </TabsList>

        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>

        <TabsContent value="business" className="mt-2">
          <div className="max-h-72 overflow-y-auto rounded-md border bg-muted/20 p-2">
            <IconGrid
              icons={businessIcons}
              selected={selected}
              onChange={onChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="animals" className="mt-2">
          <div className="max-h-72 overflow-y-auto rounded-md border bg-muted/20 p-2">
            <IconGrid
              icons={animalIcons}
              selected={selected}
              onChange={onChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-2">
          <div className="max-h-72 overflow-y-auto rounded-md border bg-muted/20 p-2">
            <IconGrid icons={allIcons} selected={selected} onChange={onChange} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Seleccionado:</span>
        <Icon icon={selected} className="size-4" />
        <span className="font-medium">{formatIconLabel(selected)}</span>
        <span className="text-xs text-muted-foreground">
          ({formatIconCollection(selected)})
        </span>
      </div>
    </div>
  );
}

