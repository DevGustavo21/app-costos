"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, ImageIcon, Loader2, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFileToStorage } from "@/lib/client-upload";
import { toast } from "sonner";

const MAX_FILES = 10;

type ReceiptUploadProps = {
  value?: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

function isPdfUrl(url: string) {
  return url.toLowerCase().includes(".pdf");
}

export function ReceiptUpload({ value = [], onChange, disabled }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    setPreviews((current) => {
      const next: Record<string, string> = {};
      for (const url of value) {
        next[url] = current[url] ?? url;
      }
      return next;
    });
  }, [value]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      const remaining = MAX_FILES - value.length;
      if (remaining <= 0) {
        toast.error(`Máximo ${MAX_FILES} archivos por costo`);
        return;
      }

      const toUpload = list.slice(0, remaining);
      if (list.length > remaining) {
        toast.message(`Solo se agregarán ${remaining} archivo(s) más`);
      }

      setUploading(true);
      const uploaded: string[] = [];

      try {
        for (const file of toUpload) {
          const url = await uploadFileToStorage(file, "receipt");
          uploaded.push(url);

          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setPreviews((current) => ({
                ...current,
                [url]: (e.target?.result as string) ?? url,
              }));
            };
            reader.readAsDataURL(file);
          } else {
            setPreviews((current) => ({ ...current, [url]: url }));
          }
        }

        if (uploaded.length > 0) {
          onChange([...value, ...uploaded]);
          toast.success(
            uploaded.length === 1 ? "Archivo agregado" : `${uploaded.length} archivos agregados`
          );
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al subir archivo");
      } finally {
        setUploading(false);
      }
    },
    [onChange, value]
  );

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || value.length >= MAX_FILES}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*,.pdf";
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files?.length) void handleFiles(files);
            };
            input.click();
          }}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : value.length > 0 ? (
            <Plus className="mr-2 h-4 w-4" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {value.length > 0 ? "Agregar factura" : "Subir factura"}
        </Button>
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {value.length}/{MAX_FILES} archivo(s)
          </span>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {value.map((url, index) => {
            const preview = previews[url] ?? url;
            const pdf = isPdfUrl(url);

            return (
              <div
                key={`${url}-${index}`}
                className="relative rounded-md border bg-muted/20 p-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 size-7"
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                  aria-label="Quitar archivo"
                >
                  <X className="h-4 w-4" />
                </Button>

                {pdf ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-24 items-center gap-2 pr-8 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-8 w-8 shrink-0" />
                    <span>Ver PDF {index + 1}</span>
                  </a>
                ) : (
                  <div className="flex min-h-24 items-center gap-2 pr-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`Factura ${index + 1}`}
                      className="max-h-24 rounded object-contain"
                    />
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
