"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { IncomeEntryWithRelations } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
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
  filters?: React.ReactNode;
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

  const lineColumns = useMemo<ColumnDef<IncomeEntryWithRelations["lines"][number]>[]>(
    () => [
      {
        accessorKey: "product",
        header: "Producto",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.plant?.name ?? row.original.description ?? "—"}
          </span>
        ),
      },
      {
        id: "quantity",
        header: () => <span className="block text-right">Cantidad</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {row.original.quantity}
            {row.original.plant?.measurementUnit
              ? ` ${getMeasurementUnitShort(row.original.plant.measurementUnit)}`
              : ""}
          </span>
        ),
      },
      {
        id: "unitPrice",
        header: () => <span className="block text-right">Precio unit.</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatNio(row.original.unitPrice)}
          </span>
        ),
      },
      {
        id: "subtotal",
        header: () => <span className="block text-right">Subtotal</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatNio(row.original.subtotal)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-3 border-t border-border/60 bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">Detalle de venta</p>
      <DataTable
        columns={lineColumns}
        data={entry.lines}
        getRowId={(line) => line.id}
      />
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
  filters,
}: IncomeMonthlyTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const columns = useMemo<ColumnDef<IncomeEntryWithRelations>[]>(
    () => [
      {
        id: "expand",
          header: () => <span className="sr-only">Detalle</span>,
          cell: ({ row }) => {
            const hasDetail = row.original.lines.length >= 2;
            const isExpanded = expandedId === row.original.id;
            if (!hasDetail) {
              return <span className="inline-block size-8" aria-hidden />;
            }
            return (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle de venta"}
                onClick={() =>
                  setExpandedId(isExpanded ? null : row.original.id)
                }
              >
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </Button>
            );
          },
        },
        {
          id: "date",
          header: "Fecha",
          cell: ({ row }) => (
            <span className="whitespace-nowrap">
              {format(new Date(row.original.date), "dd/MM/yyyy", { locale: es })}
            </span>
          ),
        },
        {
          id: "category",
          header: "Categoría",
          cell: ({ row }) => row.original.category?.name,
        },
        {
          id: "description",
          header: "Descripción",
          cell: ({ row }) => {
            const entry = row.original;
            return (
              <div className="max-w-[200px] truncate">
                {entry.description ?? "—"}
                {entry.saleQuantity != null && entry.unitPrice != null && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {entry.saleQuantity} × {formatNio(entry.unitPrice)}
                  </span>
                )}
              </div>
            );
          },
        },
        {
          id: "amountNio",
          accessorFn: (row) =>
            resolveIncomeDisplay(row, {
              volumePricing,
              defaultExchangeRate,
            }).amountNio,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title="Monto C$"
              className="justify-end"
            />
          ),
          cell: ({ row }) => {
            const display = resolveIncomeDisplay(row.original, {
              volumePricing,
              defaultExchangeRate,
            });
            return (
              <span className="block text-right tabular-nums">
                {formatNio(display.amountNio)}
              </span>
            );
          },
        },
        {
          id: "amountUsd",
          header: () => <span className="block text-right">Monto USD</span>,
          cell: ({ row }) => {
            const display = resolveIncomeDisplay(row.original, {
              volumePricing,
              defaultExchangeRate,
            });
            return (
              <span className="block text-right tabular-nums">
                {formatUsd(display.amountUsd)}
              </span>
            );
          },
        },
        ...(canWrite
          ? [
              {
                id: "actions",
                header: "Acciones",
                cell: ({ row }: { row: { original: IncomeEntryWithRelations } }) => (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(row.original)}
                      aria-label="Editar ingreso"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteId(row.original.id)}
                      disabled={isPending && deletingId === row.original.id}
                      aria-label="Eliminar ingreso"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ),
              } satisfies ColumnDef<IncomeEntryWithRelations>,
            ]
          : []),
    ],
    [canWrite, defaultExchangeRate, deletingId, expandedId, isPending, onEdit, volumePricing]
  );

  const renderTable = (entries: IncomeEntryWithRelations[]) => (
    <DataTable
      columns={columns}
      data={entries}
      getRowId={(entry) => entry.id}
      isSubRowOpen={(entry) => expandedId === entry.id && entry.lines.length >= 2}
      getRowClassName={(entry) =>
        cn(expandedId === entry.id && entry.lines.length >= 2 && "border-b-0")
      }
      renderSubRow={(row) => (
        <IncomeEntryDetailPanel
          entry={row.original}
          volumePricing={volumePricing}
          defaultExchangeRate={defaultExchangeRate}
        />
      )}
    />
  );

  return (
    <>
      <MonthlyAccordionTable
        months={months}
        defaultMonthKey={defaultMonthKey}
        renderTable={renderTable}
        emptyMessage="No hay ingresos registrados"
        filters={filters}
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
