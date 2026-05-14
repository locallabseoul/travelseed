import Image from "next/image";
import { designTokensFor } from "@/lib/design-settings";
import type { Resort } from "@/types/resort";

type GallerySectionProps = {
  resort: Resort;
};

// Renders Supabase Storage or external image URLs as a simple responsive gallery.
export function GallerySection({ resort }: GallerySectionProps) {
  const design = designTokensFor(resort.design_settings);

  if (resort.gallery.length === 0) {
    return null;
  }

  return (
    <section id="gallery" className="px-5 py-16 sm:px-6 lg:py-24" style={{ backgroundColor: design.colors.section }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">
              Gallery
            </p>
            <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>
              Spaces for sunlit days and quiet nights.
            </h2>
          </div>
          <p className={`max-w-sm text-sm leading-6 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>
            A visual preview of the atmosphere guests can expect before they book direct.
          </p>
        </div>
        <div className="mt-10 grid auto-rows-[180px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resort.gallery.map((imageUrl, index) => (
            <div
              key={imageUrl}
              className={`relative overflow-hidden bg-[#e8ddc8] shadow-[0_24px_80px_rgba(52,43,31,0.08)] ${design.imageClassName} ${
                index === 0
                  ? "sm:col-span-2 sm:row-span-2"
                  : index === 3
                    ? "lg:col-span-2"
                    : ""
              }`}
            >
              <Image
                src={imageUrl}
                alt={`${resort.name} gallery ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
