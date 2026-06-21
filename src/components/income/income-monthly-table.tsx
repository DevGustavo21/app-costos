"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { IncomeEntryWithRelations } from "@/types/database";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatNio, formatUsd, resolveIncomeDisplay } from "@/lib/currency";
import { getMeasurementUnitShort } from "@/lib/measurement-unit";
import { MonthlyAccordionTable } from "@/components/shared/monthly-accordion-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteIncomeEntry } from "@/lib/actions/income";
import type { MonthlyGroup } from "@/lib/queries/costs";
import { cn } from "@/lib/utils";

type IncomeMonthlyTableProps = {
  months: MonthlyGroup<IncomeEntryWithRelations>[];
  defaultMonthKey: string;
  businessUnitId: string;
  canWrite: boolean;
  defaultExchangeRate: number;
  volumePricing: boolean;
  onEdit: (entry: IncomeEntryWithRelations) => void;
};

function IncomeEntryDetailPanel({
  entry,
  volumePricing,
  defaultExchangeRate,
}: {
  entry: IncomeEntryWithRelations;
  volumePricing: boolean;
  defaultExchangeRate: number;
}) {
  const display = resolveIncomeDisplay(entry, { volumePricing, defaultExchangeRate });

  return (
    <div className="space-y-3 border-t border-border/60 bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">Detalle de venta</p>
      <div className="overflow-x-auto rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entry.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium">
                  {line.plant?.name ?? line.description ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.quantity}
                  {line.plant?.measurementUnit
                    ? ` ${getMeasurementUnitShort(line.plant.measurementUnit)}`
                    : ""}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNio(line.unitPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNio(line.subtotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="text-muted-foreground">Total C$: </span>
          <span className="font-semibold tabular-nums">{formatNio(display.amountNio)}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Total USD: </span>
          <span className="font-semibold tabular-nums">{formatUsd(display.amountUsd)}</span>
        </span>
      </div>
    </div>
  );
}

export function IncomeMonthlyTable({
  months,
  defaultMonthKey,
  businessUnitId,
  canWrite,
  defaultExchangeRate,
  volumePricing,
  onEdit,
}: IncomeMonthlyTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const columnCount = canWrite ? 7 : 6;

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteIncomeEntry(businessUnitId, id);
        toast.success("Ingreso eliminado");
        setConfirmDeleteId(null);
        if (expandedId === id) setExpandedId(null);
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const renderTable = (entries: IncomeEntryWithRelations[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>Fecha</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Monto C$</TableHead>
          <TableHead className="text-right">Monto USD</TableHead>
          {canWrite && <TableHead className="w-24">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const display = resolveIncomeDisplay(entry, {
            volumePricing,
            defaultExchangeRate,
          });
          const hasDetail = entry.lines.length >= 2;
          const isExpanded = expandedId === entry.id;

          return (
            <Fragment key={entry.id}>
              <TableRow className={cn(isExpanded && "border-b-0")}>
                <TableCell className="w-10 p-2 align-middle">
                  {hasDetail ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle de venta"}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </Button>
                  ) : (
                    <span className="inline-block size-8" aria-hidden />
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(entry.date), "dd/MM/yyyy", { locale: es })}
                </TableCell>
                <TableCell>{entry.category?.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {entry.description ?? "—"}
                  {entry.saleQuantity != null && entry.unitPrice != null && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {entry.saleQuantity} × {formatNio(entry.unitPrice)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNio(display.amountNio)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUsd(display.amountUsd)}
                </TableCell>
                {canWrite && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(entry)}
                        aria-label="Editar ingreso"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(entry.id)}
                        disabled={isPending && deletingId === entry.id}
                        aria-label="Eliminar ingreso"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>

              {hasDetail && isExpanded && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columnCount} className="p-0">
                    <IncomeEntryDetailPanel
                      entry={entry}
                      volumePricing={volumePricing}
                      defaultExchangeRate={defaultExchangeRate}
                    />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <>
      <MonthlyAccordionTable
        months={months}
        defaultMonthKey={defaultMonthKey}
        renderTable={renderTable}
        emptyMessage="No hay ingresos registrados"
      />

      <ConfirmDialog
        open={confirmDeleteId != null}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmDeleteId(null);
        }}
        title="¿Eliminar ingreso?"
        description="Esta acción no se puede deshacer. El registro de ingreso se eliminará permanentemente."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        isPending={isPending && deletingId != null}
      />
    </>
  );
}
