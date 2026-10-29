"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: string | null;
}) {
  const safeImages = useMemo(
    () => (images.length ? Array.from(new Set(images.filter(Boolean))) : ["/images/spread.jpg"]),
    [images],
  );
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (index > safeImages.length - 1) setIndex(0);
  }, [safeImages.length, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % safeImages.length);
      if (event.key === "ArrowLeft")
        setIndex((value) => (value - 1 + safeImages.length) % safeImages.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, safeImages.length]);

  const go = (direction: number) => {
    setIndex((value) => (value + direction + safeImages.length) % safeImages.length);
  };

  return (
    <>
      <div className="space-y-3">
        <div
          ref={frame}
          className="group relative aspect-[4/3.5] overflow-hidden rounded-[2rem] bg-mauve-100 shadow-card"
        >
          <MediaImage
            src={safeImages[index]}
            alt={`${name} — photo ${index + 1}`}
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="absolute inset-0 h-full w-full"
            imageClassName="transition duration-700 group-hover:scale-[1.02]"
            priority
          />
          {badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-mauve-800 shadow-sm backdrop-blur">
              {badge}
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-mauve-800 shadow-soft backdrop-blur transition hover:bg-white"
            aria-label="Agrandir la photo"
          >
            <Expand className="h-4 w-4" />
          </button>

          {safeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brown shadow-soft backdrop-blur transition hover:bg-white"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brown shadow-soft backdrop-blur transition hover:bg-white"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 right-4 rounded-full bg-mauve-900/55 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                {index + 1} / {safeImages.length}
              </div>
            </>
          ) : null}
        </div>

        {safeImages.length > 1 ? (
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            {safeImages.map((image, imageIndex) => (
              <button
                key={`${image}-${imageIndex}`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`Voir la photo ${imageIndex + 1}`}
                aria-current={index === imageIndex}
                className={cn(
                  "relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 bg-mauve-100 transition",
                  index === imageIndex
                    ? "border-mauve shadow-soft"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <MediaImage
                  src={image}
                  alt=""
                  sizes="96px"
                  className="absolute inset-0 h-full w-full"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-mauve-900/90 p-4 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={`Photos de ${name}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Fermer la galerie"
          >
            <X className="h-5 w-5" />
          </button>
          {safeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:left-6"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-6"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
          <div className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeImages[index]}
              alt={`${name} — photo ${index + 1}`}
              className="max-h-[88vh] w-full object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/70 to-transparent p-4">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                {index + 1} / {safeImages.length}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
