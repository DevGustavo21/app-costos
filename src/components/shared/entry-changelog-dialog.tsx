"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EntryType } from "@/types/database";
import type { EntryChangelogRow } from "@/lib/entry-changelog";
import {
  getChangedCostFields,
  getChangedIncomeFields,
  getCurrencyNote,
  normalizeCostSnapshot,
  normalizeIncomeSnapshot,
  type ChangelogCostRow,
  type ChangelogIncomeRow,
  type ChangelogLineRow,
} from "@/lib/entry-changelog-display";
import { cn } from "@/lib/utils";

type EntryChangelogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entryType: (typeof EntryType)[keyof typeof EntryType];
  loadChangelog: () => Promise<EntryChangelogRow[]>;
};

function changedCellClass(changed: boolean) {
  return cn(
    changed &&
      "rounded-sm bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-900 ring-1 ring-emerald-200/80"
  );
}

function ChangelogTimelineItem({
  action,
  children,
}: {
  action: "CREATE" | "UPDATE";
  children: React.ReactNode;
}) {
  const isCreate = action === "CREATE";

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div
        className={cn(
          "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-sm",
          isCreate ? "border-primary" : "border-emerald-600"
        )}
      >
        <div
          className={cn(
            "size-2 rounded-full",
            isCreate ? "bg-primary" : "bg-emerald-600"
          )}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-3">{children}</div>
    </div>
  );
}

function ChangelogEventHeader({
  row,
  currencyNote,
}: {
  row: EntryChangelogRow;
  currencyNote: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={row.action === "CREATE" ? "secondary" : "outline"}>
        {row.action === "CREATE" ? "Creación" : "Actualización"}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
      </span>
      {row.changedByName && (
        <span className="text-sm font-medium">{row.changedByName}</span>
      )}
      {currencyNote && (
        <span className="text-xs text-muted-foreground">· {currencyNote}</span>
      )}
    </div>
  );
}

function IncomeLinesTable({ lines }: { lines: ChangelogLineRow[] }) {
  const columns = useMemo<ColumnDef<ChangelogLineRow>[]>(
    () => [
      {
        accessorKey: "product",
        header: "Producto",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.product}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: () => <span className="block text-right">Cantidad</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{row.original.quantity}</span>
        ),
      },
      {
        accessorKey: "unitPrice",
        header: () => <span className="block text-right">Precio unit.</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{row.original.unitPrice}</span>
        ),
      },
      {
        accessorKey: "subtotal",
        header: () => <span className="block text-right">Subtotal</span>,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{row.original.subtotal}</span>
        ),
      },
    ],
    []
  );

  if (lines.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border/60 pt-3">
      <p className="text-xs font-medium text-muted-foreground">Detalle de venta</p>
      <DataTable columns={columns} data={lines} getRowId={(line) => line.id} />
    </div>
  );
}

function IncomeSnapshotTable({
  row,
  changedFields,
}: {
  row: ChangelogIncomeRow;
  changedFields: Set<string>;
}) {
  const columns = useMemo<ColumnDef<ChangelogIncomeRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("date"))}>
            {r.original.date}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Categoría",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("category"))}>
            {r.original.category}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("status"))}>
            {r.original.status}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("description"))}>
            {r.original.description}
          </span>
        ),
      },
      {
        accessorKey: "amountNio",
        header: () => <span className="block text-right">Monto C$</span>,
        cell: ({ row: r }) => (
          <span
            className={cn(
              "block text-right tabular-nums",
              changedCellClass(changedFields.has("amountNio"))
            )}
          >
            {r.original.amountNio}
          </span>
        ),
      },
      {
        accessorKey: "amountUsd",
        header: () => <span className="block text-right">Monto USD</span>,
        cell: ({ row: r }) => (
          <span
            className={cn(
              "block text-right tabular-nums",
              changedCellClass(changedFields.has("amountUsd"))
            )}
          >
            {r.original.amountUsd}
          </span>
        ),
      },
      {
        accessorKey: "saleDetail",
        header: "Cantidad × precio",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("saleDetail"))}>
            {r.original.saleDetail}
          </span>
        ),
      },
    ],
    [changedFields]
  );

  return (
    <>
      <DataTable columns={columns} data={[row]} getRowId={(entry) => entry.id} />
      {row.lines.length > 0 && (
        <div className={changedFields.has("lines") ? "rounded-md ring-1 ring-emerald-200/80" : ""}>
          <IncomeLinesTable lines={row.lines} />
        </div>
      )}
    </>
  );
}

function CostSnapshotTable({
  row,
  changedFields,
}: {
  row: ChangelogCostRow;
  changedFields: Set<string>;
}) {
  const columns = useMemo<ColumnDef<ChangelogCostRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("date"))}>
            {r.original.date}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Categoría",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("category"))}>
            {r.original.category}
          </span>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Estado",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("paymentStatus"))}>
            {r.original.paymentStatus}
          </span>
        ),
      },
      {
        accessorKey: "expenseReportStatus",
        header: "Rendición",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("expenseReportStatus"))}>
            {r.original.expenseReportStatus}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("description"))}>
            {r.original.description}
          </span>
        ),
      },
      {
        accessorKey: "amountNio",
        header: () => <span className="block text-right">Monto C$</span>,
        cell: ({ row: r }) => (
          <span
            className={cn(
              "block text-right tabular-nums",
              changedCellClass(changedFields.has("amountNio"))
            )}
          >
            {r.original.amountNio}
          </span>
        ),
      },
      {
        accessorKey: "amountUsd",
        header: () => <span className="block text-right">Monto USD</span>,
        cell: ({ row: r }) => (
          <span
            className={cn(
              "block text-right tabular-nums",
              changedCellClass(changedFields.has("amountUsd"))
            )}
          >
            {r.original.amountUsd}
          </span>
        ),
      },
      {
        accessorKey: "receipt",
        header: "Factura",
        cell: ({ row: r }) => (
          <span className={changedCellClass(changedFields.has("receipt"))}>
            {r.original.receipt}
          </span>
        ),
      },
    ],
    [changedFields]
  );

  return <DataTable columns={columns} data={[row]} getRowId={(entry) => entry.id} />;
}

export function EntryChangelogDialog({
  open,
  onOpenChange,
  title,
  entryType,
  loadChangelog,
}: EntryChangelogDialogProps) {
  const [rows, setRows] = useState<EntryChangelogRow[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const data = await loadChangelog();
      setRows(data);
    });
  }, [open, loadChangelog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-7xl flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de cambios
          </DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isPending ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Cargando...</p>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sin cambios registrados
            </p>
          ) : (
            <div className="relative">
              {rows.length > 1 && (
                <div
                  className="absolute top-3 bottom-8 left-[11px] w-px bg-border"
                  aria-hidden
                />
              )}
              {rows.map((row, index) => {
                const currencyNote = getCurrencyNote(row.snapshot);
                const isUpdate = row.action === "UPDATE";
                const previousRaw = isUpdate
                  ? row.previousSnapshot ?? rows[index + 1]?.snapshot
                  : null;

                if (entryType === EntryType.INCOME) {
                  const normalized = normalizeIncomeSnapshot(row.snapshot, row.id);
                  const previousNormalized = previousRaw
                    ? normalizeIncomeSnapshot(previousRaw, "previous")
                    : null;
                  const changedFields =
                    isUpdate && previousNormalized
                      ? getChangedIncomeFields(normalized, previousNormalized)
                      : new Set<string>();

                  return (
                    <ChangelogTimelineItem key={row.id} action={row.action}>
                      <ChangelogEventHeader row={row} currencyNote={currencyNote} />
                      <IncomeSnapshotTable
                        row={normalized}
                        changedFields={changedFields}
                      />
                    </ChangelogTimelineItem>
                  );
                }

                const normalized = normalizeCostSnapshot(row.snapshot, row.id);
                const previousNormalized = previousRaw
                  ? normalizeCostSnapshot(previousRaw, "previous")
                  : null;
                const changedFields =
                  isUpdate && previousNormalized
                    ? getChangedCostFields(normalized, previousNormalized)
                    : new Set<string>();

                return (
                  <ChangelogTimelineItem key={row.id} action={row.action}>
                    <ChangelogEventHeader row={row} currencyNote={currencyNote} />
                    <CostSnapshotTable row={normalized} changedFields={changedFields} />
                  </ChangelogTimelineItem>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
