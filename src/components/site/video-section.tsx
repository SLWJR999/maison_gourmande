"use client";

import { useEffect, useState } from "react";
import { Play, Sparkles, X } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";

export function VideoSection({
  videoUrl,
  poster,
  title,
  text,
}: {
  videoUrl: string;
  poster: string;
  title: string;
  text: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!videoUrl) return null;

  return (
    <>
      <div className="grid overflow-hidden rounded-[2.25rem] border border-brown/10 bg-white shadow-card lg:grid-cols-[1.18fr_0.82fr]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative aspect-[16/10] w-full overflow-hidden bg-mauve-900 text-left lg:aspect-auto lg:min-h-[430px]"
          aria-label="Lire la vidéo de présentation"
        >
          <MediaImage
            src={poster}
            alt="Dans les coulisses de Maison Gourmande"
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="absolute inset-0 h-full w-full"
            imageClassName="transition duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-mauve-900/80 via-mauve-900/10 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-mauve-800">
              <span className="absolute inset-0 animate-ping rounded-full border border-white/30 [animation-duration:2.8s]" />
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            </span>
          </span>
          <span className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-mauve-900 backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Notre cuisine en mouvement
          </span>
        </button>

        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <p className="eyebrow">
            <span className="h-px w-6 bg-mauve" />
            Les coulisses
          </p>
          <h2 className="mt-3 text-[34px] leading-[1.06] text-mauve-900 lg:text-[40px]">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-brown-soft">{text}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-secondary mt-7 self-start"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Regarder la vidéo
          </button>
          <div className="mt-8 flex items-center gap-3 border-t border-brown/10 pt-5">
            <span className="flex -space-x-2">
              {["/images/chef.jpg", "/images/fataya.jpg", "/images/crepe-nutella.jpg"].map(
                (src) => (
                  <MediaImage
                    key={src}
                    src={src}
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-white"
                    sizes="32px"
                  />
                ),
              )}
            </span>
            <p className="text-[11px] font-semibold leading-snug text-brown-soft">
              Préparé à la commande,
              <br />
              avec des produits choisis chaque jour.
            </p>
          </div>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-mauve-900/80 p-4 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-black shadow-float">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
              aria-label="Fermer la vidéo"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={videoUrl}
              poster={poster}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full"
            >
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          </div>
        </div>
      ) : null}
    </>
  );
}
