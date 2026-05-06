"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

type CartLineThumbnailProps = {
  productId: number;
  name: string;
  imageUrl?: string | null;
  /** Tailwind size classes for the frame (default ~ thumbnail). */
  frameClassName?: string;
};

function resolvedSrc(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s.length > 0 ? s : null;
}

/** Square product preview for cart / checkout lines. */
export function CartLineThumbnail({
  productId,
  name,
  imageUrl,
  frameClassName = "h-20 w-20 sm:h-[5.5rem] sm:w-[5.5rem]",
}: CartLineThumbnailProps) {
  const src = resolvedSrc(imageUrl);
  const useNextImage = Boolean(
    src &&
      (src.startsWith("https://") ||
        src.startsWith("http://") ||
        src.startsWith("/")),
  );

  const inner = useNextImage ? (
    <Image
      src={src!}
      alt=""
      fill
      className="object-cover"
      sizes="(max-width: 640px) 80px, 96px"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <ImageIcon
        className="h-7 w-7 text-textMain/30 sm:h-8 sm:w-8"
        strokeWidth={1.25}
        aria-hidden
      />
    </div>
  );

  return (
    <Link
      href={`/products/${productId}`}
      className={`relative shrink-0 overflow-hidden rounded-xl border border-primary/10 bg-background shadow-sm outline-none transition hover:border-primary/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/35 ${frameClassName}`}
      aria-label={`View ${name}`}
    >
      {inner}
    </Link>
  );
}
