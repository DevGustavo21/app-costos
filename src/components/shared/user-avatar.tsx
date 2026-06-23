"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarPresetClass } from "@/lib/avatar-presets";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  avatarPreset?: string | null;
  className?: string;
  fallbackClassName?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({
  name,
  avatarUrl,
  avatarPreset,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = getInitials(name || "?");

  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          !avatarUrl && getAvatarPresetClass(avatarPreset),
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
