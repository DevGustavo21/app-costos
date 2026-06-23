"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CostEntryWithCategory } from "@/types/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatAmount, formatUsd } from "@/lib/currency";
import { MonthlyAccordionTable } from "@/components/shared/monthly-accordion-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteCostEntry } from "@/lib/actions/costs";
import type { MonthlyGroup } from "@/lib/queries/costs";

type CostMonthlyTableProps = {
  months: MonthlyGroup<CostEntryWithCategory>[];
  defaultMonthKey: string;
  businessUnitId: string;
  canWrite: boolean;
  onEdit: (entry: CostEntryWithCategory) => void;
  filters?: React.ReactNode;
};

export function CostMonthlyTable({
  months,
  defaultMonthKey,
  businessUnitId,
  canWrite,
  onEdit,
  filters,
}: CostMonthlyTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const columns = useMemo<ColumnDef<CostEntryWithCategory>[]>(
    () => [
      {
        id: "date",
        header: "Fecha",
        cell: ({ row }) =>
          format(new Date(row.original.date), "dd/MM/yyyy", { locale: es }),
      },
      {
        id: "category",
        header: "Categoría",
        cell: ({ row }) => row.original.category?.name,
      },
      {
        id: "description",
        header: "Descripción",
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate">{row.original.description}</span>
        ),
      },
      {
        id: "amount",
        header: () => <span className="block text-right">Monto</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatAmount(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "currency",
        header: "Moneda",
      },
      {
        id: "amountUsd",
        header: () => <span className="block text-right">Monto USD</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatUsd(row.original.amountUsd)}
          </span>
        ),
      },
      {
        id: "receipt",
        header: "Foto",
        cell: ({ row }) =>
          row.original.receiptUrl ? (
            <a
              href={row.original.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null,
      },
      ...(canWrite
        ? [
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }: { row: { original: CostEntryWithCategory } }) => (
                <div className="flex gap-1">
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
                </div>
              ),
            } satisfies ColumnDef<CostEntryWithCategory>,
          ]
        : []),
    ],
    [canWrite, deletingId, isPending, onEdit]
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
