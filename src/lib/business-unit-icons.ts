/** Compatibilidad con ids del selector anterior (solo Lucide, sin prefijo) */
const LEGACY_ICON_IDS: Record<string, string> = {
  building: "lucide:building-2",
  utensils: "lucide:utensils-crossed",
};

export const DEFAULT_BUSINESS_UNIT_ICON = "lucide:building-2";

export function resolveIconId(iconId: string | null | undefined): string {
  if (!iconId) return DEFAULT_BUSINESS_UNIT_ICON;

  const legacy = LEGACY_ICON_IDS[iconId];
  if (legacy) return legacy;

  if (iconId.includes(":")) return iconId;

  return `lucide:${iconId}`;
}

export function formatIconLabel(iconId: string): string {
  const name = iconId.includes(":") ? iconId.split(":")[1]! : iconId;
  return name.replace(/-/g, " ");
}

export function formatIconCollection(iconId: string): string {
  const prefix = iconId.includes(":") ? iconId.split(":")[0]! : "lucide";
  const labels: Record<string, string> = {
    lucide: "Lucide",
    mdi: "Material",
    "fa6-solid": "Font Awesome",
    "game-icons": "Game Icons",
  };
  return labels[prefix] ?? prefix;
}
