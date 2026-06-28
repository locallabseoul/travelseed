import Image from "next/image";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import { businessCategoryFromType } from "@/lib/business-categories";
import { designTokensFor } from "@/lib/design-settings";
import type { Resort } from "@/types/resort";

type HeroSectionProps = {
  resort: Resort;
  accentClassName?: string;
};

// Displays the first visual impression for a public business website.
export function HeroSection({ resort, accentClassName = "bg-forest" }: HeroSectionProps) {
  const design = designTokensFor(resort.design_settings);
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const accommodation = category.id === "accommodation";

  return (
    <section className="relative min-h-screen overflow-hidden bg-neutral-900 text-white" style={{ backgroundColor: design.colors.primary }}>
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
        <div
          className={`absolute inset-0 ${accentClassName}`}
          style={{
            background: `radial-gradient(circle at 30% 15%, rgba(255,255,255,0.22), transparent 28%), linear-gradient(135deg, ${design.colors.primary}, ${design.colors.accent})`,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/60" />
      <div className="absolute left-0 right-0 top-0 z-10">
        <ResortNavigation resort={resort} variant="light" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pb-14 pt-28 sm:px-6 lg:pb-20">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
          {resort.location}
        </p>
        <h1 className={`max-w-4xl text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-7xl ${design.headingClassName}`}>
          {resort.hero_title}
        </h1>
        {resort.hero_subtitle ? (
          <p className={`mt-6 max-w-2xl text-lg leading-8 text-white/85 sm:text-xl ${design.bodyClassName}`}>
            {resort.hero_subtitle}
          </p>
        ) : null}
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="#booking"
            className={`inline-flex min-h-12 items-center border px-6 text-sm font-semibold ${design.buttonClassName}`}
            style={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.accent, borderColor: design.colors.accent, color: design.buttonStyle === "Soft Outline" ? design.colors.accent : design.colors.buttonText }}
          >
            {accommodation ? "Book Direct & Save" : category.primaryCta}
          </a>
          <a
            href={accommodation ? "#experiences" : "#services"}
            className={`inline-flex min-h-12 items-center border border-white/35 px-6 text-sm font-semibold text-white backdrop-blur ${design.buttonClassName}`}
          >
            {accommodation ? "Explore the stay" : `Explore ${category.landingNav.offers.toLowerCase()}`}
          </a>
        </div>
      </div>
    </section>
  );
}
