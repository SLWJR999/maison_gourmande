import Image from "next/image";
import { cn } from "@/lib/utils";

type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
};

export function MediaImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  fill = true,
  width = 1200,
  height = 900,
}: MediaImageProps) {
  const safeSrc = src || "/images/spread.jpg";
  const classes = cn("object-cover", imageClassName);

  if (safeSrc.startsWith("/")) {
    if (fill) {
      return (
        <span className={cn("relative block overflow-hidden", className)}>
          <Image
            src={safeSrc}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className={classes}
          />
        </span>
      );
    }
    return (
      <Image
        src={safeSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={cn(classes, className)}
      />
    );
  }

  return (
    <span className={cn("relative block overflow-hidden", className)}>
      {/* Les médias externes ajoutés depuis l'admin ne passent pas par next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={safeSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("absolute inset-0 h-full w-full", classes)}
      />
    </span>
  );
}
