import Image from "next/image";
import type { CSSProperties } from "react";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { ArrowRightIcon, CarIcon, ChevronLeftIcon, ChevronRightIcon, CoffeeIcon, LeafIcon, LocationIcon, MailIcon, QuoteIcon, WaterIcon, WhatsAppIcon } from "@/components/templates/template-icons";
import { designTokensFor, templatePaletteFor } from "@/lib/design-settings";
import { isSiteSectionEnabled } from "@/lib/site-structure";
import type { Resort } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

// Seed landing template for tropical villas and premium private stays.
export function BoutiqueVillaTemplate({ resort }: TemplateProps) {
  const design = designTokensFor(resort.design_settings);
  const palette = templatePaletteFor("boutique-villa", resort.design_settings);
  const paletteStyle = templatePaletteStyle(palette);
  const heroImage = resort.hero_image_url || resort.gallery[0];
  const rooms = (resort.services ?? []).filter((service) => service.is_active && service.kind === "room").slice(0, 3);
  const gallery = [heroImage, ...resort.gallery].filter(Boolean).filter(unique).slice(0, 3) as string[];
  const showAbout = isSiteSectionEnabled(resort, "about");
  const showFacilities = isSiteSectionEnabled(resort, "facilities");
  const showRooms = isSiteSectionEnabled(resort, "rooms");
  const showGallery = isSiteSectionEnabled(resort, "gallery");
  const showContact = isSiteSectionEnabled(resort, "contact");

  return (
    <main className="overflow-hidden bg-[var(--ts-primary)] text-[var(--ts-inverse-text)] antialiased [font-family:Inter,sans-serif] selection:bg-[var(--ts-accent)] selection:text-[var(--ts-cta-text)]" style={paletteStyle}>
      <nav id="header" className="fixed top-0 z-50 w-full border-b border-[var(--ts-border)] px-6 py-5 backdrop-blur-xl transition-all duration-300 md:px-12" style={{ backgroundColor: `${palette.primary}cc` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href={`/${resort.slug}`} className="group flex items-center gap-3 text-2xl tracking-wide text-[var(--ts-inverse-text)] [font-family:'Playfair_Display',serif]">
            {resort.name}
          </a>
          <div className="hidden items-center space-x-10 text-sm font-light uppercase tracking-widest lg:flex">
            <a href="#rooms" className="transition-colors hover:text-[var(--ts-accent)]">Rooms</a>
            <a href="#highlights" className="transition-colors hover:text-[var(--ts-accent)]">Experiences</a>
            <a href="#gallery" className="transition-colors hover:text-[var(--ts-accent)]">Gallery</a>
            <a href="#reviews" className="transition-colors hover:text-[var(--ts-accent)]">Reviews</a>
          </div>
          <div className="flex items-center gap-6">
            <a href="#booking" className="hidden items-center gap-2 text-sm transition-colors hover:text-[var(--ts-accent)] md:flex">
              <WhatsAppIcon className="h-4 w-4" />
              <span>{resort.whatsapp_number}</span>
            </a>
            <a href="#booking" className="rounded-full border border-[var(--ts-border)] px-6 py-2.5 text-sm uppercase tracking-widest transition-all duration-300 hover:bg-[var(--ts-inverse-text)] hover:text-[var(--ts-primary)]">
              Book Direct
            </a>
          </div>
        </div>
      </nav>

      <section id="hero" className="relative flex h-screen w-full items-center justify-center overflow-hidden pt-20 text-center">
        <div className="absolute inset-0">
          {heroImage ? (
            <Image src={heroImage} alt={resort.name} fill priority sizes="100vw" className="object-cover opacity-60" />
          ) : (
            <div className="h-full w-full bg-[var(--ts-hero)]" />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${palette.hero}cc, transparent, ${palette.primary})` }} />
        </div>
        <div className="relative z-10 mx-auto mt-20 flex w-full max-w-7xl flex-col items-center px-6 text-center md:px-12">
          <p className="mx-auto inline-block border-b border-[var(--ts-accent)] pb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ts-accent)] sm:text-sm">
            {resort.location}
          </p>
          <h1 className="mb-8 mt-6 text-6xl font-semibold leading-none tracking-tight md:text-8xl lg:text-[140px] [font-family:'Playfair_Display',serif]">
            {splitHeroTitle(resort.hero_title).map((line, index) => (
              <span key={`${line}-${index}`} className={index % 2 === 1 ? "block italic opacity-90" : "block"}>
                {line}
              </span>
            ))}
          </h1>
          {resort.hero_subtitle ? (
            <p className={`mx-auto mb-12 max-w-2xl text-lg font-light leading-8 opacity-80 sm:text-xl ${design.bodyClassName}`}>
              {resort.hero_subtitle}
            </p>
          ) : null}
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <BookingInquiryModal
              resort={resort}
              source="hero_booking"
              triggerLabel={<><WhatsAppIcon className="h-5 w-5" /><span>WhatsApp Booking</span></>}
              buttonClassName="min-h-0 gap-3 rounded-full px-8 py-4 text-sm font-medium uppercase tracking-widest transition-colors hover:bg-[#128c7e]"
              buttonStyle={{ backgroundColor: "#25d366", color: "#ffffff" }}
            />
            <a href="#rooms" className="inline-flex items-center justify-center rounded-full border border-[var(--ts-border)] px-8 py-4 text-sm uppercase tracking-widest text-[var(--ts-inverse-text)] transition-colors hover:bg-white/10">
              View Villas
            </a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 opacity-60">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="h-16 w-px" style={{ background: `linear-gradient(to bottom, ${palette.inverseText}, transparent)` }} />
        </div>
      </section>

      {showAbout || showFacilities ? (
        <section id="highlights" className="bg-[var(--ts-section)] px-6 py-32 text-[var(--ts-text)] md:px-12">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 md:grid-cols-2">
            <div className="relative h-[600px] w-full">
              {gallery[0] ? (
                <Image src={gallery[0]} alt={`${resort.name} tropical detail`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover shadow-2xl" />
              ) : (
                <div className="absolute inset-0" style={{ backgroundColor: `${palette.accent}33` }} />
              )}
              <div className="absolute -bottom-10 -right-10 hidden w-72 bg-[var(--ts-primary)] p-10 text-[var(--ts-inverse-text)] shadow-2xl lg:block">
                <QuoteIcon className="mb-4 h-8 w-8 text-[var(--ts-accent)] opacity-50" />
                <p className="text-lg italic leading-relaxed [font-family:'Playfair_Display',serif]">{resort.description || "Every corner creates lasting memories, providing an opportunity to enjoy everything nature has to offer."}</p>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="mb-12 text-4xl leading-tight md:text-5xl [font-family:'Playfair_Display',serif]">
                The essence of <br /><span className="italic text-[var(--ts-accent-soft)]">tropical living</span>
              </h2>
              <div className="space-y-10">
                {(resort.features.length > 0 ? resort.features : fallbackVillaFeatures).slice(0, 3).map((feature) => (
                  <div key={feature} className="flex items-start gap-6 border-b border-[var(--ts-border)] pb-8 last:border-b-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--ts-border)] text-[var(--ts-accent-soft)]">{featureIcon(feature)}</div>
                    <div>
                    <h3 className="mb-2 text-xl [font-family:'Playfair_Display',serif]">{featureTitle(feature)}</h3>
                    <p className="mt-2 max-w-xl text-sm font-light leading-7 text-[var(--ts-muted)]">{featureDescription(feature)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {showRooms && rooms.length > 0 ? (
        <section id="rooms" className="relative overflow-hidden bg-[var(--ts-primary)] px-6 py-32 md:px-12">
          <div className="pointer-events-none absolute right-0 top-0 whitespace-nowrap text-[200px] text-transparent opacity-10 [font-family:'Playfair_Display',serif]" style={{ WebkitTextStroke: `1px ${palette.inverseText}4d` }}>Villas</div>
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mb-20 flex items-end justify-between">
              <div>
              <p className="mb-4 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ts-accent)]">Our Sanctuaries</p>
              <h2 className="text-4xl md:text-6xl [font-family:'Playfair_Display',serif]">
                Choose your <span className="italic">retreat</span>
              </h2>
              </div>
              <div className="hidden gap-4 md:flex">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ts-border)]">
                  <ChevronLeftIcon className="h-5 w-5" />
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ts-border)]">
                  <ChevronRightIcon className="h-5 w-5" />
                </span>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <article key={room.id} className="group cursor-pointer overflow-hidden bg-[var(--ts-hero)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                  <div className="relative h-[400px] overflow-hidden bg-[var(--ts-hero)]">
                    {room.image_url ? (
                      <Image src={room.image_url} alt={room.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    ) : null}
                    {room.price_label ? <div className="absolute right-4 top-4 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] backdrop-blur-sm" style={{ backgroundColor: `${palette.primary}cc` }}>{room.price_label}</div> : null}
                  </div>
                  <div className="p-7">
                    <h3 className="mb-4 text-2xl transition-colors group-hover:text-[var(--ts-accent)] [font-family:'Playfair_Display',serif]">{room.title}</h3>
                    <div className="mb-6 flex flex-wrap gap-3">
                      {roomPills(room).map((pill) => (
                        <span key={pill} className="rounded-full border border-[var(--ts-border)] px-3 py-1 text-xs opacity-70">{pill}</span>
                      ))}
                    </div>
                    <a href="#booking" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-[var(--ts-accent)] transition-colors hover:text-[var(--ts-inverse-text)]">
                      View Details <ArrowRightIcon className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showGallery && gallery.length > 0 ? (
        <section id="gallery" className="bg-[var(--ts-section)] px-6 py-32 text-[var(--ts-text)] md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-20 text-center">
              <h2 className="mb-6 text-4xl md:text-6xl [font-family:'Playfair_Display',serif]">Visual <span className="italic">Journey</span></h2>
              <p className="mx-auto max-w-xl font-light text-[var(--ts-muted)]">Explore the intricate details, natural textures, and expansive spaces that define our property.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:auto-rows-[300px]">
              {gallery.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className={`relative overflow-hidden ${index === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"}`} style={{ backgroundColor: `${palette.accent}33` }}>
                  <Image src={imageUrl} alt={`${resort.name} villa gallery ${index + 1}`} fill sizes={index === 0 ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 768px) 42vw, 100vw"} className="object-cover transition duration-1000 hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showContact ? (
        <footer id="booking" className="border-t border-[var(--ts-border)] bg-[var(--ts-hero)] px-6 pb-10 pt-32 md:px-12">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-20 lg:grid-cols-2">
            <div>
              <h2 className="mb-8 text-5xl leading-tight md:text-7xl [font-family:'Playfair_Display',serif]">
                Ready to step <br />into your <span className="italic text-[var(--ts-accent)]">sanctuary?</span>
              </h2>
              <p className="mb-12 max-w-md text-lg font-light leading-8 opacity-70">
                Book directly through WhatsApp for our best rate guarantee, complimentary airport transfer, and personalized concierge service.
              </p>
              <div>
                <BookingInquiryModal
                  resort={resort}
                  source="booking_cta"
                  triggerLabel="Book via WhatsApp"
                  buttonClassName="w-full rounded-full px-10 py-5 text-sm font-medium uppercase tracking-widest shadow-lg shadow-[#25d366]/20 sm:w-auto"
                  buttonStyle={{ backgroundColor: "#25d366", color: "#ffffff" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-10">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ts-accent)]">Contact</h3>
                <div className="mt-6 grid gap-4 text-sm font-light leading-7 opacity-70">
                  {resort.owner_email ? (
                    <p className="flex items-center gap-3">
                      <MailIcon className="h-4 w-4 text-[var(--ts-accent)]" />
                      {resort.owner_email}
                    </p>
                  ) : null}
                  <p className="flex items-center gap-3">
                    <WhatsAppIcon className="h-4 w-4 text-[#25d366]" />
                    {resort.whatsapp_number}
                  </p>
                  <p className="flex items-center gap-3">
                    <LocationIcon className="h-4 w-4 text-[var(--ts-accent)]" />
                    {resort.location}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ts-accent)]">Explore</h3>
                <div className="mt-6 grid gap-4 text-sm font-light opacity-70">
                  <a href="#rooms">Villas</a>
                  <a href="#gallery">Gallery</a>
                  <a href="#reviews">Reviews</a>
                  <a href="#booking">Booking</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-32 flex max-w-7xl flex-col justify-between gap-6 border-t border-[var(--ts-border)] pt-10 text-xs font-light opacity-50 md:flex-row md:items-center">
            <p className="text-xl tracking-wide [font-family:'Playfair_Display',serif]">{resort.name}</p>
            <p>&copy; 2026 {resort.name}. All rights reserved.</p>
            <p>Powered by Travelseed</p>
          </div>
        </footer>
      ) : null}

      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}

const fallbackVillaFeatures = ["Private pool", "Daily breakfast", "Airport transfer"];

function splitHeroTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) {
    return words;
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

function featureTitle(feature: string) {
  return feature.length > 34 ? feature.slice(0, 34) : feature;
}

function featureDescription(feature: string) {
  return `${feature} is part of the direct stay experience, prepared to make arrival, rest, and booking feel effortless.`;
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

function featureIcon(feature: string) {
  const normalized = feature.toLowerCase();
  if (normalized.includes("pool") || normalized.includes("water")) {
    return <WaterIcon className="h-5 w-5" />;
  }
  if (normalized.includes("breakfast") || normalized.includes("dining") || normalized.includes("food")) {
    return <CoffeeIcon className="h-5 w-5" />;
  }
  if (normalized.includes("airport") || normalized.includes("transfer") || normalized.includes("pickup")) {
    return <CarIcon className="h-5 w-5" />;
  }

  return <LeafIcon className="h-5 w-5" />;
}

function roomPills(room: NonNullable<Resort["services"]>[number]) {
  return [room.bed_type, room.max_guests ? `${room.max_guests} guests` : room.capacity ? `${room.capacity} guests` : null, room.view_type]
    .filter(Boolean) as string[];
}

function unique(value: string | null | undefined, index: number, list: Array<string | null | undefined>) {
  return Boolean(value) && list.indexOf(value) === index;
}
