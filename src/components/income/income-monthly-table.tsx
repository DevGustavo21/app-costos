"use client";

import { useState, useTransition } from "react";
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
import { formatCurrencyLabel, formatNio, formatUsd, resolveIncomeDisplay } from "@/lib/currency";
import { MonthlyAccordionTable } from "@/components/shared/monthly-accordion-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteIncomeEntry } from "@/lib/actions/income";
import type { MonthlyGroup } from "@/lib/queries/costs";

type IncomeMonthlyTableProps = {
  months: MonthlyGroup<IncomeEntryWithRelations>[];
  defaultMonthKey: string;
  businessUnitId: string;
  canWrite: boolean;
  defaultExchangeRate: number;
  volumePricing: boolean;
  onEdit: (entry: IncomeEntryWithRelations) => void;
};

function ExpandableDetail({ entry }: { entry: IncomeEntryWithRelations }) {
  const [open, setOpen] = useState(false);

  if (!entry.lines.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="mr-1 h-4 w-4" />
        ) : (
          <ChevronRight className="mr-1 h-4 w-4" />
        )}
        {entry.lines.length} línea(s)
      </Button>
      {open && (
        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
          {entry.lines.map((line) => (
            <li key={line.id}>
              {line.plant?.name ?? "—"} × {line.quantity} ={" "}
              {formatNio(line.subtotal)}
            </li>
          ))}
        </ul>
      )}
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

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteIncomeEntry(businessUnitId, id);
        toast.success("Ingreso eliminado");
        setConfirmDeleteId(null);
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
          <TableHead>Fecha</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Monto C$</TableHead>
          <TableHead>Moneda</TableHead>
          <TableHead className="text-right">Monto USD</TableHead>
          <TableHead>Detalle</TableHead>
          {canWrite && <TableHead>Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const display = resolveIncomeDisplay(entry, {
            volumePricing,
            defaultExchangeRate,
          });

          return (
          <TableRow key={entry.id}>
            <TableCell>
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
            <TableCell className="text-right">
              {formatNio(display.amountNio)}
            </TableCell>
            <TableCell>{formatCurrencyLabel(display.currency)}</TableCell>
            <TableCell className="text-right">
              {formatUsd(display.amountUsd)}
            </TableCell>
            <TableCell>
              <ExpandableDetail entry={entry} />
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
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
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
