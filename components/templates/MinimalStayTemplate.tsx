import Image from "next/image";
import type { CSSProperties } from "react";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { ArrowRightIcon, FacebookIcon, InstagramIcon, LocationIcon, MailIcon, MapIcon, StarIcon, WhatsAppIcon } from "@/components/templates/template-icons";
import { businessCategoryFromType } from "@/lib/business-categories";
import { designTokensFor, templatePaletteFor } from "@/lib/design-settings";
import { isSiteSectionEnabled } from "@/lib/site-structure";
import type { Resort } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

// Seed landing template for local businesses, services, menus, tours, and simple hospitality sites.
export function MinimalStayTemplate({ resort }: TemplateProps) {
  const design = designTokensFor(resort.design_settings);
  const palette = templatePaletteFor("minimal-stay", resort.design_settings);
  const paletteStyle = templatePaletteStyle(palette);
  const heroImage = resort.hero_image_url || resort.gallery[0];
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const accommodation = category.id === "accommodation";
  const offers = (resort.services ?? []).filter((service) => service.is_active).slice(0, 6);
  const gallery = [heroImage, ...resort.gallery].filter(Boolean).filter(unique).slice(0, 5) as string[];
  const showOffers = isSiteSectionEnabled(resort, "rooms");
  const showReviews = isSiteSectionEnabled(resort, "reviews");
  const showGallery = isSiteSectionEnabled(resort, "gallery");
  const showContact = isSiteSectionEnabled(resort, "contact");

  const reviews = (resort.reviews ?? [])
    .filter((review) => review.status === "published" && review.show_on_website)
    .sort((first, second) => Number(second.featured) - Number(first.featured) || first.sort_order - second.sort_order)
    .slice(0, 3);

  return (
    <main className="bg-[var(--ts-page)] text-[var(--ts-text)] antialiased [font-family:Inter,sans-serif] selection:bg-[var(--ts-accent-soft)] selection:text-[var(--ts-inverse-text)]" style={paletteStyle}>
      <nav id="header" className="fixed z-50 w-full bg-white/95 backdrop-blur-sm transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <a href={`/${resort.slug}`} className="flex items-center gap-2 text-[var(--ts-text)]">
            <span className="text-xl font-semibold [font-family:'Playfair_Display',serif]">{resort.name}</span>
          </a>
          <a href="#booking" className="flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1ebe5d]">
            <WhatsAppIcon className="h-4 w-4" />
            <span>{category.secondaryCta}</span>
          </a>
        </div>
      </nav>

      <section id="hero" className="relative flex h-[680px] items-center overflow-hidden pt-20 text-white">
        <div className="absolute inset-0">
          {heroImage ? (
            <Image src={heroImage} alt={resort.name} fill priority sizes="100vw" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-[var(--ts-hero)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-6xl text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
            <LocationIcon className="h-3.5 w-3.5 text-[var(--ts-accent-soft)]" />
            {resort.location}
          </p>
          <h1 className="mx-auto mb-5 mt-5 max-w-4xl text-5xl font-semibold leading-tight md:text-6xl lg:text-7xl [font-family:'Playfair_Display',serif]">
            {resort.hero_title}
          </h1>
          {resort.hero_subtitle ? (
            <p className={`mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl ${design.bodyClassName}`}>
              {resort.hero_subtitle}
            </p>
          ) : null}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BookingInquiryModal
              resort={resort}
              source="hero_booking"
              triggerLabel={<span className="inline-flex items-center gap-2">{category.primaryCta} <ArrowRightIcon className="h-4 w-4" /></span>}
              buttonClassName="rounded-full px-8 py-4 text-lg font-medium shadow-xl"
              buttonStyle={{ backgroundColor: palette.cta, color: palette.ctaText }}
            />
          </div>
        </div>
      </section>

      {showOffers && offers.length > 0 ? (
        <section id="services" className="bg-[var(--ts-page)] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <h2 className="mb-3 text-4xl font-semibold text-[var(--ts-text)] md:text-5xl [font-family:'Playfair_Display',serif]">{category.offerSectionTitle}</h2>
              <p className="text-[var(--ts-muted)]">{category.offerSectionBody}</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <article key={offer.id} className="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-lg">
                  <div className="relative h-56 bg-[var(--ts-section)]">
                    {offer.image_url ? (
                      <Image src={offer.image_url} alt={offer.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-2xl font-semibold [font-family:'Playfair_Display',serif]">{offer.title}</h3>
                    <p className="mb-5 text-sm text-[var(--ts-muted)]">{offerDetailText(offer, category)}</p>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      {offer.price_label ? (
                        <p className="flex items-baseline gap-1 text-[var(--ts-accent)]">
                          <span className="text-2xl font-bold leading-none">{offer.price_label}</span>
                          {accommodation && offer.kind === "room" && !hasNightSuffix(offer.price_label) ? <span className="text-base font-normal text-[var(--ts-muted)]">/night</span> : null}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-[var(--ts-accent)]">{category.pricingFallback}</p>
                      )}
                      <a href="#booking" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ts-accent)]">
                        {offer.cta_label || category.primaryCta} <ArrowRightIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showGallery && gallery.length > 0 ? (
        <section id="gallery" className="bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {gallery.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className={`relative overflow-hidden rounded-lg bg-[var(--ts-section)] ${index === 0 ? "col-span-2 row-span-2 min-h-[400px]" : "h-48"}`}>
                  <Image src={imageUrl} alt={`${resort.name} gallery ${index + 1}`} fill sizes={index === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showReviews && reviews.length > 0 ? (
        <section id="reviews" className="bg-[var(--ts-section)] px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-xl bg-white p-8">
                  <RatingStars rating={review.rating} />
                  <p className="mb-4 italic text-[var(--ts-muted)]">{`"${review.review_text}"`}</p>
                  <p className="text-sm font-medium">- {review.guest_name}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showContact ? (
        <>
          <section id="booking" className="bg-[var(--ts-page)] px-6 py-20">
            <div className="mx-auto max-w-4xl rounded-2xl p-12 text-center text-[var(--ts-cta-text)] md:p-16" style={{ background: `linear-gradient(135deg, ${palette.cta}, ${palette.accentSoft})` }}>
              <h2 className="mb-4 text-3xl font-semibold md:text-4xl [font-family:'Playfair_Display',serif]">{accommodation ? "Book direct & save" : "Contact us directly"}</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-white/90">
                {accommodation ? "Skip the fees. Get the best rate and personal service when you book directly with us via WhatsApp." : "Ask questions, request pricing, make a reservation, or book an appointment through a direct WhatsApp conversation."}
              </p>
              <div className="mt-8">
                <BookingInquiryModal
                  resort={resort}
                  source="booking_cta"
                  triggerLabel={category.secondaryCta}
                  buttonClassName="rounded-full px-8 py-4 text-lg font-semibold"
                  buttonStyle={{ backgroundColor: palette.ctaText, color: palette.cta }}
                />
              </div>
            </div>
          </section>
          <SunsetContactSection resort={resort} />
        </>
      ) : null}

      <SunsetFooter resort={resort} />
      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}

function SunsetContactSection({ resort }: { resort: Resort }) {
  return (
    <section id="contact" className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-3xl font-semibold [font-family:'Playfair_Display',serif]">Visit Us</h2>
          <div className="space-y-4 text-[var(--ts-muted)]">
            <div className="flex gap-3">
              <LocationIcon className="mt-1 h-5 w-5 shrink-0 text-[var(--ts-accent)]" />
              <div>
                <span className="font-semibold text-[var(--ts-text)]">{resort.name}</span>
                <br />
                {resort.location}
              </div>
            </div>
            {resort.owner_email ? (
              <p className="flex items-center gap-3">
                <MailIcon className="h-5 w-5 text-[var(--ts-accent)]" />
                {resort.owner_email}
              </p>
            ) : null}
            <p className="flex items-center gap-3">
              <WhatsAppIcon className="h-5 w-5 text-[#25d366]" />
              {resort.whatsapp_number}
            </p>
          </div>
        </div>
        <div className="flex h-80 items-center justify-center rounded-xl bg-[var(--ts-section)] text-[var(--ts-muted)]">
          <MapIcon className="h-20 w-20" />
        </div>
      </div>
    </section>
  );
}

function SunsetFooter({ resort }: { resort: Resort }) {
  return (
    <footer className="bg-[var(--ts-primary)] px-6 py-12" style={{ color: "var(--ts-inverse-text)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-6 border-b pb-8 md:flex-row" style={{ borderColor: "color-mix(in srgb, var(--ts-inverse-text) 14%, transparent)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold [font-family:'Playfair_Display',serif]">{resort.name}</span>
          </div>
          <div className="flex gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: "color-mix(in srgb, var(--ts-inverse-text) 22%, transparent)" }}>
              <InstagramIcon className="h-4 w-4" />
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: "color-mix(in srgb, var(--ts-inverse-text) 22%, transparent)" }}>
              <FacebookIcon className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between text-xs opacity-60 md:flex-row">
          <p>&copy; 2026 {resort.name}. All rights reserved.</p>
          <p className="mt-4 md:mt-0">Powered by <span className="font-semibold">Travelseed</span></p>
        </div>
      </div>
    </footer>
  );
}

function offerDetailText(offer: NonNullable<Resort["services"]>[number], category: ReturnType<typeof businessCategoryFromType>) {
  const capacityLabel = offer.kind === "room"
    ? offer.max_guests ? `${offer.max_guests} guests` : offer.capacity ? `${offer.capacity} guests` : null
    : offer.capacity ? `${offer.capacity} ${category.capacityLabel}` : null;

  return [offer.bed_type, offer.view_type, offer.duration, capacityLabel]
    .filter(Boolean)
    .join(" - ") || offer.description || "Available for direct WhatsApp inquiry";
}

function templatePaletteStyle(palette: ReturnType<typeof templatePaletteFor>) {
  return {
    "--ts-page": palette.page,
    "--ts-section": palette.section,
    "--ts-hero": palette.hero,
    "--ts-primary": palette.primary,
    "--ts-accent": palette.accent,
    "--ts-accent-soft": palette.accentSoft,
    "--ts-text": palette.text,
    "--ts-muted": palette.muted,
    "--ts-border": palette.border,
    "--ts-inverse-text": palette.inverseText,
    "--ts-cta-text": palette.ctaText,
  } as CSSProperties;
}

function hasNightSuffix(priceLabel: string) {
  return /night|박|per\s*night/i.test(priceLabel);
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="mb-4 flex gap-1 text-[var(--ts-accent)]" aria-label={`${rating} star rating`}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} className={`h-4 w-4 ${index < rating ? "opacity-100" : "opacity-25"}`} />
      ))}
    </div>
  );
}

function unique(value: string | null | undefined, index: number, list: Array<string | null | undefined>) {
  return Boolean(value) && list.indexOf(value) === index;
}
