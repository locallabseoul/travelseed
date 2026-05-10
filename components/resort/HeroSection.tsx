import Image from "next/image";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import type { Resort } from "@/types/resort";

type HeroSectionProps = {
  resort: Resort;
  accentClassName?: string;
};

// Displays the first visual impression for a resort website.
export function HeroSection({ resort, accentClassName = "bg-forest" }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-neutral-900 text-white">
      {resort.hero_image_url ? (
        <Image
          src={resort.hero_image_url}
          alt={resort.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className={`absolute inset-0 ${accentClassName}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(24,53,47,0.96),rgba(95,115,77,0.88)_46%,rgba(198,172,127,0.85))]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/60" />
      <div className="absolute left-0 right-0 top-0 z-10">
        <ResortNavigation resort={resort} variant="light" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pb-14 pt-28 sm:px-6 lg:pb-20">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
          {resort.location}
        </p>
        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-7xl">
          {resort.hero_title}
        </h1>
        {resort.hero_subtitle ? (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl">
            {resort.hero_subtitle}
          </p>
        ) : null}
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="#booking"
            className="inline-flex min-h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#18352f]"
          >
            Book Direct & Save
          </a>
          <a
            href="#experiences"
            className="inline-flex min-h-12 items-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white backdrop-blur"
          >
            Explore the stay
          </a>
        </div>
      </div>
    </section>
  );
}
