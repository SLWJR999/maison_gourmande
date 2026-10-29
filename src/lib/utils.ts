type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

function flattenClasses(value: ClassValue, output: string[]) {
  if (!value) return;
  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) flattenClasses(item, output);
    return;
  }
  if (typeof value === "object") {
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) output.push(key);
    }
  }
}

export function cn(...inputs: ClassValue[]) {
  const output: string[] = [];
  for (const input of inputs) flattenClasses(input, output);
  return output.join(" ");
}

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return `${Math.round(amount).toLocaleString("fr-FR").replace(/\u202f/g, " ")} FCFA`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("fr-FR").replace(/\u202f/g, " ");
}

export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  },
): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", options).format(value);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(date: Date | string | null | undefined): string {
  return formatDate(date, { day: "2-digit", month: "short" });
}

export function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 10);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

export function normalizeWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("221")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return `221${digits.slice(1)}`;
  if (digits.length === 9) return `221${digits}`;
  return digits;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("221") && digits.length === 12) {
    const local = digits.slice(3);
    return `+221 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 9)}`;
  }
  return value;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function parseInteger(value: FormDataEntryValue | null, fallback = 0): number {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formString(
  data: FormData,
  key: string,
  fallback = "",
): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : fallback;
}

export function formBoolean(data: FormData, key: string): boolean {
  const value = data.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function percent(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count > 1 ? (plural ?? `${singular}s`) : singular;
}

export function safeInternalPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
