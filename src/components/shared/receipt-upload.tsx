"use client";

import { useCallback, useState } from "react";
import { FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReceiptUploadProps = {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

export function ReceiptUpload({ value, onChange, disabled }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo excede el límite de 5MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? "Error al subir");

        onChange(data.url);
        setPreview(data.url);

        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => setPreview(e.target?.result as string);
          reader.readAsDataURL(file);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al subir archivo");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const isPdf = value?.endsWith(".pdf") || preview?.includes("application/pdf");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*,.pdf";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFile(file);
            };
            input.click();
          }}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {value ? "Cambiar archivo" : "Subir factura"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
              setPreview(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {preview && (
        <div className="rounded-md border p-2">
          {isPdf ? (
            <a
              href={value ?? preview}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileText className="h-8 w-8" />
              Ver PDF
            </a>
          ) : (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Vista previa"
                className="max-h-32 rounded object-contain"
              />
              {value && (
                <a href={value} target="_blank" rel="noopener noreferrer">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
