"use client";

import {
  ALL_ICON_IDS,
  ANIMAL_ICON_IDS,
  ICON_ID_SET,
  SUGGESTED_ANIMAL_ICONS,
  SUGGESTED_BUSINESS_ICONS,
} from "@/lib/business-unit-icon-ids.generated";

export {
  ALL_ICON_IDS as iconIds,
  ANIMAL_ICON_IDS,
  SUGGESTED_ANIMAL_ICONS,
  SUGGESTED_BUSINESS_ICONS,
};

export const TOTAL_ICON_COUNT = ALL_ICON_IDS.length;
export const ANIMAL_ICON_COUNT = ANIMAL_ICON_IDS.length;

export function isValidIconId(iconId: string): boolean {
  return ICON_ID_SET.has(iconId);
}

export function searchIcons(query: string, limit = 240): string[] {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, "-");
  if (!normalized) return [];

  const results: string[] = [];
  for (const id of ALL_ICON_IDS) {
    if (id.includes(normalized)) {
      results.push(id);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function searchAnimalIcons(query: string, limit = 240): string[] {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, "-");
  if (!normalized) return SUGGESTED_ANIMAL_ICONS;

  const results: string[] = [];
  for (const id of ANIMAL_ICON_IDS) {
    if (id.includes(normalized)) {
      results.push(id);
      if (results.length >= limit) break;
    }
  }
  return results;
}
