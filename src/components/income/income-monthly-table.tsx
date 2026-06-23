"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { EntryType, IncomeCollectionStatus, IncomeEntryWithRelations } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { formatNio, formatUsd, resolveIncomeDisplay } from "@/lib/currency";
import { getIncomeMonthSummary } from "@/lib/income-month-summary";
import { getIncomeCollectionStatusLabel } from "@/lib/entry-labels";
import { getMeasurementUnitShort } from "@/lib/measurement-unit";
import { MonthlyAccordionTable } from "@/components/shared/monthly-accordion-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EntryChangelogDialog } from "@/components/shared/entry-changelog-dialog";
import { deleteIncomeEntry, fetchIncomeChangelog } from "@/lib/actions/income";
import { parseLocalDate } from "@/lib/db/helpers";
import type { MonthlyGroup } from "@/lib/queries/costs";
import { cn } from "@/lib/utils";

function formatIncomeMonthTitle(monthLabel: string) {
  return monthLabel.replace(/\s+de\s+/i, " ");
}

function IncomeMonthTrigger({
  month,
  volumePricing,
  defaultExchangeRate,
}: {
  month: MonthlyGroup<IncomeEntryWithRelations>;
  volumePricing: boolean;
  defaultExchangeRate: number;
}) {
  const displayOptions = { volumePricing, defaultExchangeRate };
  const { transactionCount, receivedTotal, receivableTotal, monthTotal } =
    getIncomeMonthSummary(month.entries, displayOptions);
  const transactionLabel = transactionCount === 1 ? "transacción" : "transacciones";

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 pr-2 text-left">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold capitalize text-foreground">
          {formatIncomeMonthTitle(month.monthLabel)}
        </span>
        <span className="text-sm text-muted-foreground">
          ({transactionCount} {transactionLabel})
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {receivedTotal > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-800">
            <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span>Recibido</span>
            <span className="font-semibold tabular-nums">{formatUsd(receivedTotal)}</span>
          </span>
        ) : null}
        {receivableTotal > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-amber-900">
            <span className="size-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
            <span>Cuenta por cobrar</span>
            <span className="font-semibold tabular-nums">{formatUsd(receivableTotal)}</span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-primary-foreground">
          <span className="text-xs font-medium">Total del mes</span>
          <span className="font-bold tabular-nums">{formatUsd(monthTotal)}</span>
        </span>
      </div>
    </div>
  );
}

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
      <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-right text-sm">
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
  const [changelogEntry, setChangelogEntry] = useState<IncomeEntryWithRelations | null>(null);

  const loadChangelog = useCallback(async () => {
    if (!changelogEntry) return [];
    return fetchIncomeChangelog(businessUnitId, changelogEntry.id);
  }, [businessUnitId, changelogEntry]);

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
              {format(parseLocalDate(row.original.date), "dd/MM/yyyy", { locale: es })}
            </span>
          ),
        },
        {
          id: "category",
          header: "Categoría",
          cell: ({ row }) => row.original.category?.name,
        },
        {
          id: "collectionStatus",
          header: "Estado",
          cell: ({ row }) => {
            const status = row.original.collectionStatus;
            const label = getIncomeCollectionStatusLabel(status);
            const isReceivable =
              status === IncomeCollectionStatus.ACCOUNTS_RECEIVABLE;

            return (
              <Badge
                variant="outline"
                className={cn(
                  isReceivable
                    ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50"
                    : "border-transparent bg-emerald-50 text-emerald-800 hover:bg-emerald-50"
                )}
              >
                {label}
              </Badge>
            );
          },
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
        {
          id: "actions",
          header: "Acciones",
          cell: ({ row }: { row: { original: IncomeEntryWithRelations } }) => (
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Ver historial de cambios"
                onClick={() => setChangelogEntry(row.original)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canWrite && (
                <>
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
                </>
              )}
            </div>
          ),
        },
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
        renderMonthTrigger={(month) => (
          <IncomeMonthTrigger
            month={month}
            volumePricing={volumePricing}
            defaultExchangeRate={defaultExchangeRate}
          />
        )}
      />

      <EntryChangelogDialog
        open={changelogEntry != null}
        onOpenChange={(open) => {
          if (!open) setChangelogEntry(null);
        }}
        entryType={EntryType.INCOME}
        title={
          changelogEntry
            ? `Ingreso del ${format(parseLocalDate(changelogEntry.date), "dd/MM/yyyy", { locale: es })}`
            : "Historial"
        }
        loadChangelog={loadChangelog}
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
