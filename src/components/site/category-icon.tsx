import {
  Beef,
  CakeSlice,
  Cookie,
  CupSoda,
  Flame,
  Pizza,
  Sandwich,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Flame,
  Sandwich,
  Beef,
  Pizza,
  CakeSlice,
  CupSoda,
  Cookie,
  Sparkles,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
