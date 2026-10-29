import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-brown/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-mauve">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-display text-[30px] leading-tight text-mauve-900 sm:text-[36px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[12px] leading-6 text-brown-soft">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminNotice({
  tone = "success",
  children,
}: {
  tone?: "success" | "error" | "info" | "warning";
  children: ReactNode;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-mauve-200 bg-mauve-100/50 text-mauve-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-[12px] leading-5 ${styles[tone]}`}>
      {children}
    </div>
  );
}

export function AdminStat({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "mauve" | "emerald" | "amber";
}) {
  const styles = {
    default: "bg-white",
    mauve: "bg-mauve-900 text-white",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
  };
  return (
    <div
      className={`rounded-2xl border border-brown/10 p-4 shadow-[0_10px_35px_-26px_rgba(66,43,82,0.4)] ${styles[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-[9px] font-extrabold uppercase tracking-[0.15em] ${
            tone === "mauve" ? "text-mauve-200" : "text-brown-light"
          }`}
        >
          {label}
        </p>
        {icon ? (
          <span
            className={
              tone === "mauve" ? "text-ochre-light" : "text-mauve"
            }
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 font-display text-[25px] leading-none ${
          tone === "mauve" ? "text-white" : "text-mauve-900"
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={`mt-2 text-[10px] leading-4 ${
            tone === "mauve" ? "text-mauve-200/80" : "text-brown-light"
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brown/15 bg-white/50 px-6 py-12 text-center">
      <p className="font-display text-xl text-mauve-900">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-[11px] leading-5 text-brown-light">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AdminBreadcrumb({
  items,
}: {
  items: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brown-light">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="transition hover:text-mauve-800">
              {item.label}
            </Link>
          ) : (
            <span className="text-mauve-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AdminLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-mauve-700 hover:text-mauve-900">
      {children}
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}
