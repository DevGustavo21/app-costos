"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AVATAR_PRESETS } from "@/lib/avatar-presets";
import { updateUserProfile } from "@/lib/actions/profile";
import { uploadFileToStorage } from "@/lib/client-upload";
import type { User } from "@/types/database";
import { cn } from "@/lib/utils";

const profileFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  phone: z.string().max(30).optional(),
  avatarUrl: z.string().nullable().optional(),
  avatarPreset: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type ProfileFormProps = {
  user: User;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name ?? "",
      phone: user.phone ?? "",
      avatarUrl: user.avatarUrl,
      avatarPreset: user.avatarPreset,
    },
  });

  const avatarUrl = form.watch("avatarUrl");
  const avatarPreset = form.watch("avatarPreset");
  const displayName = form.watch("name") || user.name || "Usuario";

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen excede 5MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFileToStorage(file, "avatar");
      form.setValue("avatarUrl", url);
      form.setValue("avatarPreset", null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (values: ProfileFormValues) => {
    startTransition(async () => {
      try {
        await updateUserProfile({
          name: values.name,
          phone: values.phone || null,
          avatarUrl: values.avatarUrl ?? null,
          avatarPreset: values.avatarPreset ?? null,
        });
        toast.success("Perfil actualizado");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo actualizar el perfil");
      }
    });
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Mi perfil</CardTitle>
        <CardDescription>
          Actualice su nombre, teléfono y foto de perfil. También puede elegir un avatar predeterminado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <UserAvatar
                name={displayName}
                avatarUrl={avatarUrl}
                avatarPreset={avatarPreset}
                className="size-20 rounded-lg"
                fallbackClassName="rounded-lg text-lg"
              />
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatarUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading || isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Subir foto
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => form.setValue("avatarUrl", null)}
                  >
                    Quitar foto
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Avatar predeterminado</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((preset) => {
                  const selected = avatarPreset === preset.id && !avatarUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        form.setValue("avatarPreset", preset.id);
                        form.setValue("avatarUrl", null);
                      }}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-offset-2 transition-all",
                        preset.className,
                        selected ? "ring-primary" : "ring-transparent opacity-80 hover:opacity-100"
                      )}
                      title={preset.label}
                    >
                      {displayName.slice(0, 1).toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} placeholder="+505 8888 8888" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-sm text-muted-foreground">Correo: {user.email}</p>

            <Button type="submit" disabled={isPending || uploading} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
