"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { CostEntryWithCategory } from "@/types/database";
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
import { formatAmount, formatUsd } from "@/lib/currency";
import { MonthlyAccordionTable } from "@/components/shared/monthly-accordion-table";
import { deleteCostEntry } from "@/lib/actions/costs";
import type { MonthlyGroup } from "@/lib/queries/costs";

type CostMonthlyTableProps = {
  months: MonthlyGroup<CostEntryWithCategory>[];
  defaultMonthKey: string;
  businessUnitId: string;
  canWrite: boolean;
  onEdit: (entry: CostEntryWithCategory) => void;
};

export function CostMonthlyTable({
  months,
  defaultMonthKey,
  businessUnitId,
  canWrite,
  onEdit,
}: CostMonthlyTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este registro de costo?")) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteCostEntry(businessUnitId, id);
        toast.success("Costo eliminado");
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      } finally {
        setDeletingId(null);
      }
    });
  };

  const renderTable = (entries: CostEntryWithCategory[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Moneda</TableHead>
          <TableHead className="text-right">Monto USD</TableHead>
          <TableHead>Foto</TableHead>
          {canWrite && <TableHead>Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              {format(new Date(entry.date), "dd/MM/yyyy", { locale: es })}
            </TableCell>
            <TableCell>{entry.category?.name}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {entry.description}
            </TableCell>
            <TableCell className="text-right">
              {formatAmount(entry.amount, entry.currency)}
            </TableCell>
            <TableCell>{entry.currency}</TableCell>
            <TableCell className="text-right">
              {formatUsd(entry.amountUsd)}
            </TableCell>
            <TableCell>
              {entry.receiptUrl && (
                <a
                  href={entry.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </TableCell>
            {canWrite && (
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(entry)}
                    disabled={isPending}
                    aria-label="Editar costo"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                    disabled={isPending && deletingId === entry.id}
                    aria-label="Eliminar costo"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <MonthlyAccordionTable
      months={months}
      defaultMonthKey={defaultMonthKey}
      renderTable={renderTable}
      emptyMessage="No hay costos registrados"
    />
  );
}
