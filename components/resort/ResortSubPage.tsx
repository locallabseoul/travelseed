import { AboutSection } from "@/components/resort/AboutSection";
import { BookingSection } from "@/components/resort/BookingSection";
import { ExperienceSection } from "@/components/resort/ExperienceSection";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { FooterSection } from "@/components/resort/FooterSection";
import { GallerySection } from "@/components/resort/GallerySection";
import { ReviewSection } from "@/components/resort/ReviewSection";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import { ServiceSection } from "@/components/resort/ServiceSection";
import { designTokensFor } from "@/lib/design-settings";
import { presetForSlug, presetSettingsFrom } from "@/lib/section-presets";
import Image from "next/image";
import type { Resort, ResortSitePage } from "@/types/resort";

type ResortSubPageProps = {
  resort: Resort;
  page: ResortSitePage;
};

function slugKeyFor(page: ResortSitePage) {
  return page.slug.replace(/^\/+|\/+$/g, "").toLowerCase();
}

export function ResortSubPage({ resort, page }: ResortSubPageProps) {
  const design = designTokensFor(resort.design_settings);
  const slugKey = slugKeyFor(page);
  const preset = presetForSlug(page.slug);

  return (
    <main className="min-h-screen" style={{ backgroundColor: design.colors.page, color: design.colors.text }}>
      <ResortNavigation resort={resort} variant="minimal" />
      <SubPageHero resort={resort} page={page} />
      {slugKey === "rooms" ? <ServiceSection resort={resort} variant="boutique" /> : null}
      {slugKey === "experiences" ? <ExperienceSection resort={resort} /> : null}
      {slugKey === "gallery" ? <GallerySection resort={resort} /> : null}
      {slugKey === "reviews" ? <ReviewSection resort={resort} variant="boutique" /> : null}
      {slugKey === "about" ? <AboutSection resort={resort} /> : null}
      {slugKey === "contact" ? <BookingSection resort={resort} /> : null}
      {preset ? <PresetPageSection resort={resort} page={page} /> : null}
      {slugKey === "blog" ? <EditorialPlaceholder resort={resort} page={page} /> : null}
      {!preset && !["rooms", "experiences", "gallery", "reviews", "about", "contact", "blog"].includes(slugKey) ? <EditorialPlaceholder resort={resort} page={page} /> : null}
      {slugKey !== "contact" ? <BookingSection resort={resort} /> : null}
      <FooterSection resort={resort} />
      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}

function PresetPageSection({ resort, page }: ResortSubPageProps) {
  const design = designTokensFor(resort.design_settings);
  const preset = presetForSlug(page.slug);

  if (!preset) {
    return null;
  }

  const settings = presetSettingsFrom(page.settings, preset);
  const promotionOffers = preset.layout === "promotions"
    ? (resort.services ?? []).filter((service) => service.is_active && (service.kind === "package" || service.kind === "service") && Boolean(service.highlight))
    : [];
  const cards = promotionOffers.length > 0
    ? promotionOffers.slice(0, 3).map((offer) => ({
      title: offer.title,
      description: offer.description || offer.highlight || preset.card.offerDescription || preset.card.fallbackDescription,
      eyebrow: offer.highlight || preset.card.eyebrow,
      priceLabel: offer.price_label,
      ctaLabel: offer.cta_label,
      isOffer: true,
    }))
    : settings.items.map((item) => ({
      title: item,
      description: preset.card.fallbackDescription,
      eyebrow: preset.card.eyebrow,
      priceLabel: null,
      ctaLabel: null,
      isOffer: false,
    }));
  const detailCards = preset.layout === "dining"
    ? [
      { label: "Opening hours", value: settings.openingHours },
      { label: "Breakfast", value: settings.breakfastInfo },
      { label: "Private dining", value: settings.privateDiningNote },
    ].filter((item) => item.value)
    : [];

  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>{preset.label}</p>
            <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>
              {settings.title}
            </h2>
            <p className={`mt-5 text-base leading-8 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>{settings.intro}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card, index) => (
              <article key={`${card.title}-${index}`} className="rounded-2xl border p-5 shadow-[0_18px_50px_rgba(52,43,31,0.06)]" style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: design.colors.accent }}>{card.eyebrow}</p>
                <h3 className={`mt-4 text-xl font-semibold ${design.headingClassName}`} style={{ color: design.colors.text }}>{card.title}</h3>
                <p className={`mt-3 text-sm leading-6 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>
                  {card.description}
                </p>
                {card.priceLabel || card.ctaLabel ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: design.colors.text }}>
                    {card.priceLabel ? <span className="rounded-full px-3 py-2" style={{ backgroundColor: design.colors.page }}>{card.priceLabel}</span> : null}
                    {card.ctaLabel ? <span className="rounded-full px-3 py-2" style={{ backgroundColor: design.colors.page }}>{card.ctaLabel}</span> : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
        {detailCards.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {detailCards.map((detail) => (
              <article key={detail.label} className="rounded-2xl border p-5" style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: design.colors.accent }}>{detail.label}</p>
                <p className={`mt-3 text-sm leading-6 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>{detail.value}</p>
              </article>
            ))}
          </div>
        ) : null}
        {preset.layout === "promotions" && settings.campaignNote ? (
          <p className={`mt-6 max-w-2xl rounded-2xl border px-4 py-3 text-sm leading-6 ${design.bodyClassName}`} style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent, color: design.colors.muted }}>
            {settings.campaignNote}
          </p>
        ) : null}
        <a
          href={`/${resort.slug}#booking`}
          className={`mt-8 inline-flex min-h-11 items-center px-5 text-sm font-semibold ${design.buttonClassName}`}
          style={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.primary, borderColor: design.colors.primary, color: design.buttonStyle === "Soft Outline" ? design.colors.primary : design.colors.buttonText }}
        >
          {settings.ctaLabel}
        </a>
      </div>
    </section>
  );
}

function SubPageHero({ resort, page }: ResortSubPageProps) {
  const design = designTokensFor(resort.design_settings);
  const heroImageUrl = page.hero_image_url || resort.hero_image_url || resort.gallery[0] || null;

  return (
    <section className={`relative overflow-hidden px-5 py-16 sm:px-6 lg:py-24 ${heroImageUrl ? "text-white" : ""}`} style={{ backgroundColor: design.colors.section }}>
      {heroImageUrl ? (
        <>
          <Image src={heroImageUrl} alt={`${page.title} at ${resort.name}`} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#18352f]/62" />
        </>
      ) : null}
      <div className="relative mx-auto max-w-6xl">
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${heroImageUrl ? "text-white/72" : ""}`} style={heroImageUrl ? undefined : { color: design.colors.accent }}>{resort.name}</p>
        <h1 className={`mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl ${design.headingClassName}`} style={{ color: heroImageUrl ? "white" : design.colors.text }}>
          {page.title}
        </h1>
        <p className={`mt-5 max-w-2xl text-base leading-8 ${design.bodyClassName}`} style={{ color: heroImageUrl ? "rgba(255,255,255,0.78)" : design.colors.muted }}>
          {page.seo_description || `Explore ${page.title.toLowerCase()} at ${resort.name}, then continue your reservation directly with the host.`}
        </p>
      </div>
    </section>
  );
}

function EditorialPlaceholder({ resort, page }: ResortSubPageProps) {
  const design = designTokensFor(resort.design_settings);

  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>{page.page_type}</p>
          <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>
            {page.title} content is ready for your next update.
          </h2>
        </div>
        <div className="rounded-2xl border p-6 shadow-[0_18px_50px_rgba(52,43,31,0.06)]" style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent }}>
          <p className={`text-base leading-8 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>
            This page is published in the site structure. Add dedicated content from the Travelseed dashboard to turn it into a complete direct-booking page for {resort.name}.
          </p>
          <a
            href={`/${resort.slug}#booking`}
            className={`mt-6 inline-flex min-h-11 items-center px-5 text-sm font-semibold ${design.buttonClassName}`}
            style={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.primary, borderColor: design.colors.primary, color: design.buttonStyle === "Soft Outline" ? design.colors.primary : design.colors.buttonText }}
          >
            Start a direct inquiry
          </a>
        </div>
      </div>
    </section>
  );
}
