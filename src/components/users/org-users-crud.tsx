"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  createOrgUser,
  removeOrgUser,
  updateOrgUser,
} from "@/lib/actions/users";
import {
  ASSIGNABLE_MEMBER_ROLES,
  getRoleLabel,
} from "@/lib/permissions";
import type { OrgUserRow } from "@/lib/queries/users";
import {
  getOrgUserFormSchema,
  toMembershipAssignments,
  type OrgUserFormValues,
  type UnitAccessFormValue,
} from "@/lib/validations/user";
import { Role } from "@/types/database";
import type { BusinessUnit } from "@/types/database";

function buildUnitAccess(
  businessUnits: BusinessUnit[],
  editingUser: OrgUserRow | null
): UnitAccessFormValue[] {
  return businessUnits.map((unit) => {
    const membership = editingUser?.memberships.find(
      (m) => m.businessUnitId === unit.id
    );

    return {
      businessUnitId: unit.id,
      enabled: Boolean(membership),
      role:
        membership?.role === Role.ACCOUNTANT ? Role.ACCOUNTANT : Role.VIEWER,
    };
  });
}

type OrgUsersCrudProps = {
  users: OrgUserRow[];
  businessUnits: BusinessUnit[];
  currentUserId: string;
};

type OrgUserFormProps = {
  editingId: string | null;
  editingUser: OrgUserRow | null;
  businessUnits: BusinessUnit[];
  isPending: boolean;
  onSubmitForm: (values: OrgUserFormValues) => void;
  onCancelEdit: () => void;
};

function OrgUserForm({
  editingId,
  editingUser,
  businessUnits,
  isPending,
  onSubmitForm,
  onCancelEdit,
}: OrgUserFormProps) {
  const form = useForm<OrgUserFormValues>({
    resolver: zodResolver(getOrgUserFormSchema(Boolean(editingId))),
    defaultValues: editingUser
      ? {
          name: editingUser.name ?? "",
          email: editingUser.email,
          password: "",
          unitAccess: buildUnitAccess(businessUnits, editingUser),
        }
      : {
          name: "",
          email: "",
          password: "",
          unitAccess: buildUnitAccess(businessUnits, null),
        },
  });

  const unitAccess = form.watch("unitAccess");

  const updateUnitAccess = (
    businessUnitId: string,
    patch: Partial<Pick<UnitAccessFormValue, "enabled" | "role">>
  ) => {
    const current = form.getValues("unitAccess");
    form.setValue(
      "unitAccess",
      current.map((unit) =>
        unit.businessUnitId === businessUnitId ? { ...unit, ...patch } : unit
      ),
      { shouldValidate: true }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="usuario@empresa.com"
                  disabled={Boolean(editingId)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={
                    editingId ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitAccess"
          render={() => (
            <FormItem>
              <FormLabel>Acceso por unidad de negocio</FormLabel>
              <p className="text-xs text-muted-foreground">
                Seleccione las unidades y asigne un rol específico en cada una.
              </p>
              <div className="space-y-2 rounded-lg border p-3">
                {businessUnits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tiene unidades que pueda administrar.
                  </p>
                ) : (
                  businessUnits.map((unit) => {
                    const access = unitAccess.find(
                      (item) => item.businessUnitId === unit.id
                    );
                    if (!access) return null;

                    return (
                      <div
                        key={unit.id}
                        className="flex flex-col gap-2 rounded-md border border-border/50 bg-muted/20 p-3"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Checkbox
                            id={`unit-${unit.id}`}
                            checked={access.enabled}
                            onCheckedChange={(value) =>
                              updateUnitAccess(unit.id, { enabled: value === true })
                            }
                          />
                          <Label
                            htmlFor={`unit-${unit.id}`}
                            className="truncate font-normal"
                          >
                            {unit.name}
                          </Label>
                        </div>
                        <Select
                          value={access.role}
                          disabled={!access.enabled}
                          onValueChange={(role) =>
                            updateUnitAccess(unit.id, {
                              role: role as UnitAccessFormValue["role"],
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSIGNABLE_MEMBER_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {getRoleLabel(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending
              ? "Guardando..."
              : editingId
                ? "Actualizar usuario"
                : "Crear usuario"}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              className="w-fit self-start"
              onClick={onCancelEdit}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

export function OrgUsersCrud({
  users,
  businessUnits,
  currentUserId,
}: OrgUsersCrudProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const editingUser = useMemo(
    () => users.find((u) => u.id === editingId) ?? null,
    [users, editingId]
  );

  const resetForm = useCallback(() => {
    setEditingId(null);
  }, []);

  const onSubmitForm = (values: OrgUserFormValues) => {
    const memberships = toMembershipAssignments(values.unitAccess);
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      memberships,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateOrgUser(editingId, payload);
          toast.success("Usuario actualizado");
        } else {
          await createOrgUser(payload);
          toast.success("Usuario creado");
          setCreateFormKey((key) => key + 1);
        }
        resetForm();
        router.refresh();
      } catch (err) {
        if (err instanceof ZodError) {
          toast.error(err.issues[0]?.message ?? "Datos inválidos");
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Error al guardar usuario"
        );
      }
    });
  };

  const handleEdit = useCallback(
    (row: OrgUserRow) => {
      if (row.id === currentUserId) {
        toast.error("No puede editar su propio acceso desde esta pantalla");
        return;
      }

      setEditingId(row.id);
    },
    [currentUserId]
  );

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    startTransition(async () => {
      try {
        await removeOrgUser(id);
        toast.success("Usuario eliminado");
        setConfirmDeleteId(null);
        if (editingId === id) resetForm();
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error al eliminar usuario"
        );
      }
    });
  };

  const columns = useMemo<ColumnDef<OrgUserRow>[]>(
    () => [
      {
        id: "user",
        header: "Usuario",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name ?? "Sin nombre"}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: "access",
        header: "Accesos",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.memberships.map((m) => (
              <Badge key={m.membershipId} variant="secondary">
                {m.businessUnitName} · {getRoleLabel(m.role)}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const isSelf = row.original.id === currentUserId;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={isSelf}
                onClick={() => handleEdit(row.original)}
                aria-label="Editar usuario"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={isSelf}
                onClick={() => setConfirmDeleteId(row.original.id)}
                aria-label="Eliminar usuario"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
      },
    ],
    [currentUserId, handleEdit]
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
      <div className="min-w-0 xl:max-w-md">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{editingId ? "Editar usuario" : "Invitar usuario"}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgUserForm
              key={editingId ?? `create-${createFormKey}`}
              editingId={editingId}
              editingUser={editingUser}
              businessUnits={businessUnits}
              isPending={isPending}
              onSubmitForm={onSubmitForm}
              onCancelEdit={resetForm}
            />
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={users}
              getRowId={(row) => row.id}
              emptyMessage="No hay usuarios en sus unidades"
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDeleteId != null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title="Eliminar usuario"
        description="Se quitará el acceso a las unidades que administra. Si el usuario no pertenece a otras unidades, su cuenta se eliminará por completo."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
