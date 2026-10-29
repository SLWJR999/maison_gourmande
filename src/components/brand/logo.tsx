import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "dark",
  compact = false,
}: {
  className?: string;
  variant?: "dark" | "light";
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mauve shadow-soft">
        <svg
          viewBox="0 0 64 64"
          className="h-full w-full"
          aria-hidden="true"
          fill="none"
        >
          <circle cx="32" cy="32" r="32" fill="#76518F" />
          <path
            d="M15 43V24.5L32 37l17-12.5V43"
            stroke="#FAF6F0"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="47" cy="18" r="2.8" fill="#F4E4CC" />
          <circle cx="17" cy="18" r="1.5" fill="#F4E4CC" opacity="0.8" />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[21px] font-semibold tracking-[-0.04em]",
              variant === "light" ? "text-white" : "text-brown",
            )}
          >
            Maison Gourmande
          </span>
          <span
            className={cn(
              "mt-1 text-[8px] font-extrabold uppercase tracking-[0.3em]",
              variant === "light" ? "text-mauve-200" : "text-mauve",
            )}
          >
            Fait maison · Dakar
          </span>
        </span>
      ) : null}
    </span>
  );
}
