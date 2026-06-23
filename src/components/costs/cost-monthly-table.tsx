"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Eye, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CostEntryWithCategory } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatNio, formatUsd, resolveCostDisplay } from "@/lib/currency";
import {
  getCostExpenseReportStatusLabel,
  getCostPaymentStatusLabel,
} from "@/lib/entry-labels";
import { parseLocalDate } from "@/lib/db/helpers";
import { MonthlyAccordionTable } from "@/components/shared/monthly-accordion-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EntryChangelogDialog } from "@/components/shared/entry-changelog-dialog";
import { deleteCostEntry, fetchCostChangelog } from "@/lib/actions/costs";
import { EntryType } from "@/types/database";
import type { MonthlyGroup } from "@/lib/queries/costs";

type CostMonthlyTableProps = {
  months: MonthlyGroup<CostEntryWithCategory>[];
  defaultMonthKey: string;
  businessUnitId: string;
  defaultExchangeRate: number;
  canWrite: boolean;
  onEdit: (entry: CostEntryWithCategory) => void;
  filters?: React.ReactNode;
};

export function CostMonthlyTable({
  months,
  defaultMonthKey,
  businessUnitId,
  defaultExchangeRate,
  canWrite,
  onEdit,
  filters,
}: CostMonthlyTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [changelogEntry, setChangelogEntry] = useState<CostEntryWithCategory | null>(null);

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteCostEntry(businessUnitId, id);
        toast.success("Costo eliminado");
        setConfirmDeleteId(null);
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const loadChangelog = useCallback(async () => {
    if (!changelogEntry) return [];
    return fetchCostChangelog(businessUnitId, changelogEntry.id);
  }, [businessUnitId, changelogEntry]);

  const columns = useMemo<ColumnDef<CostEntryWithCategory>[]>(
    () => [
      {
        id: "date",
        header: "Fecha",
        cell: ({ row }) =>
          format(parseLocalDate(row.original.date), "dd/MM/yyyy", { locale: es }),
      },
      {
        id: "category",
        header: "Categoría",
        cell: ({ row }) => row.original.category?.name,
      },
      {
        id: "paymentStatus",
        header: "Estado",
        cell: ({ row }) => getCostPaymentStatusLabel(row.original.paymentStatus),
      },
      {
        id: "expenseReportStatus",
        header: "Rendición",
        cell: ({ row }) =>
          getCostExpenseReportStatusLabel(row.original.expenseReportStatus),
      },
      {
        id: "description",
        header: "Descripción",
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate">{row.original.description}</span>
        ),
      },
      {
        id: "amountNio",
        header: () => <span className="block text-right">Monto C$</span>,
        cell: ({ row }) => {
          const display = resolveCostDisplay(row.original, { defaultExchangeRate });
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
          const display = resolveCostDisplay(row.original, { defaultExchangeRate });
          return (
            <span className="block text-right tabular-nums">
              {formatUsd(display.amountUsd)}
            </span>
          );
        },
      },
      {
        id: "receipt",
        header: "Factura",
        cell: ({ row }) => {
          const urls = row.original.receiptUrls ?? [];
          if (urls.length === 0) return null;

          return (
            <div className="flex items-center gap-1">
              <CheckCircle2
                className="h-4 w-4 text-emerald-600"
                aria-label={`${urls.length} factura(s) adjunta(s)`}
              />
              {urls.length === 1 ? (
                <a
                  href={urls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  aria-label="Ver factura"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {urls.length}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }: { row: { original: CostEntryWithCategory } }) => (
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
                  disabled={isPending}
                  aria-label="Editar costo"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDeleteId(row.original.id)}
                  disabled={isPending && deletingId === row.original.id}
                  aria-label="Eliminar costo"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canWrite, defaultExchangeRate, deletingId, isPending, onEdit]
  );

  const renderTable = (entries: CostEntryWithCategory[]) => (
    <DataTable
      columns={columns}
      data={entries}
      getRowId={(entry) => entry.id}
    />
  );

  return (
    <>
      <MonthlyAccordionTable
        months={months}
        defaultMonthKey={defaultMonthKey}
        renderTable={renderTable}
        emptyMessage="No hay costos registrados"
        filters={filters}
      />

      <EntryChangelogDialog
        open={changelogEntry != null}
        onOpenChange={(open) => {
          if (!open) setChangelogEntry(null);
        }}
        entryType={EntryType.COST}
        title={
          changelogEntry
            ? `Costo del ${format(parseLocalDate(changelogEntry.date), "dd/MM/yyyy", { locale: es })}`
            : "Historial"
        }
        loadChangelog={loadChangelog}
      />

      <ConfirmDialog
        open={confirmDeleteId != null}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmDeleteId(null);
        }}
        title="¿Eliminar costo?"
        description="Esta acción no se puede deshacer. El registro de costo se eliminará permanentemente."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        isPending={isPending && deletingId != null}
      />
    </>
  );
}
