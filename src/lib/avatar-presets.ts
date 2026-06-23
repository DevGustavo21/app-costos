export const AVATAR_PRESETS = [
  { id: "teal", label: "Verde", className: "bg-teal-600 text-white" },
  { id: "blue", label: "Azul", className: "bg-blue-600 text-white" },
  { id: "violet", label: "Violeta", className: "bg-violet-600 text-white" },
  { id: "amber", label: "Ámbar", className: "bg-amber-500 text-white" },
  { id: "rose", label: "Rosa", className: "bg-rose-500 text-white" },
  { id: "slate", label: "Gris", className: "bg-slate-600 text-white" },
  { id: "emerald", label: "Esmeralda", className: "bg-emerald-600 text-white" },
  { id: "orange", label: "Naranja", className: "bg-orange-500 text-white" },
] as const;

export function getAvatarPresetClass(presetId: string | null | undefined): string {
  return (
    AVATAR_PRESETS.find((preset) => preset.id === presetId)?.className ??
    "bg-primary text-primary-foreground"
  );
}
