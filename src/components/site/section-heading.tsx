import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "Tout voir",
  align = "left",
  light = false,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <p className={cn(light ? "eyebrow-light" : "eyebrow")}>
          <span className={cn("h-px w-6", light ? "bg-mauve-300" : "bg-mauve")} />
          {eyebrow}
        </p>
        <h2
          className={cn(
            "mt-3 text-[34px] leading-[1.04] sm:text-[42px] lg:text-[48px]",
            light ? "text-white" : "text-mauve-900",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-3 max-w-xl text-sm leading-7",
              light ? "text-mauve-200/80" : "text-brown-soft",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-4 py-2.5 text-xs font-extrabold transition sm:self-auto",
            light
              ? "border-white/20 text-white hover:border-white/40 hover:bg-white/10"
              : "border-mauve/20 text-mauve-800 hover:border-mauve/40 hover:bg-white",
          )}
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function TextLink({
  href,
  children,
  className,
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] transition",
        light
          ? "text-mauve-100 hover:text-white"
          : "text-mauve-800 hover:text-mauve-900",
        className,
      )}
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
