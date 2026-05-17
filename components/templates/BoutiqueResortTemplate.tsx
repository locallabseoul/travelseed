import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { ArrowRightIcon, LocationIcon, StarIcon, WhatsAppIcon } from "@/components/templates/template-icons";
import { templatePaletteFor } from "@/lib/design-settings";
import { publicNavigationLinks } from "@/lib/site-structure";
import type { Resort, ResortOffer } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

export function BoutiqueResortTemplate({ resort }: TemplateProps) {
  const palette = templatePaletteFor("boutique-resort", resort.design_settings);
  const rooms = activeRooms(resort).slice(0, 2);
  const heroImage = resort.hero_image_url || resort.gallery[0] || rooms[0]?.image_url || null;
  const navLinks = publicNavigationLinks(resort).filter((link) => link.href !== `/${resort.slug}`);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--br-page)] text-[var(--br-text)] antialiased [font-family:Inter,sans-serif]" style={paletteStyle(palette)}>
      <BoutiqueResortNav resort={resort} links={navLinks} activeHref={`/${resort.slug}`} />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-28 text-center">
        <div className="absolute inset-0">
          {heroImage ? <Image src={heroImage} alt={resort.name} fill priority sizes="100vw" className="object-cover opacity-60" /> : <div className="h-full w-full bg-[var(--br-primary)]" />}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(15,23,42,0.45)] via-transparent to-[var(--br-page)]" />
        </div>
        <div className="relative z-10 mx-auto mt-20 max-w-4xl">
          <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-stone-200 backdrop-blur-md">
            <LocationIcon className="h-3.5 w-3.5 text-[var(--br-accent)]" />
            {resort.location}
          </p>
          <h1 className="text-5xl font-medium leading-tight tracking-tight text-white md:text-7xl [font-family:'Playfair_Display',serif]">
            {resort.hero_title || resort.name}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-8 text-stone-200 md:text-xl">
            {resort.hero_subtitle || resort.description || "Discover uncompromised comfort where warm hospitality meets a refined boutique resort experience."}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <BookingInquiryModal
              resort={resort}
              source="hero_booking"
              triggerLabel={<><span>Reserve Your Stay</span><ArrowRightIcon className="h-4 w-4" /></>}
              buttonClassName="gap-2 rounded-full px-8 py-3.5 text-base font-medium shadow-[0_0_20px_rgba(249,115,22,0.38)]"
              buttonStyle={{ backgroundColor: palette.cta, color: palette.ctaText }}
            />
            <a href={`/${resort.slug}/rooms`} className="inline-flex min-h-12 items-center rounded-full border border-white/20 bg-white/10 px-8 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15">
              View suites
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 z-20 hidden max-w-xs items-center gap-4 rounded-[14px] border border-white/10 bg-slate-800/40 p-4 backdrop-blur-md transition hover:bg-slate-800/60 lg:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-[var(--br-accent)]">
            <StarIcon className="h-4 w-4" />
          </span>
          <span className="text-left">
            <span className="block text-xs font-medium text-stone-300">Direct Booking Benefits</span>
            <span className="block text-sm font-semibold text-white">Exclusive rates & perks</span>
          </span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-28 md:px-12">
        <SectionHeading eyebrow="Accommodations" title="Curated Spaces" />
        <div className="grid gap-8 md:grid-cols-2">
          {(rooms.length > 0 ? rooms : fallbackRooms(resort)).map((room) => (
            <RoomFeatureCard key={room.id} resort={resort} room={room} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 pb-28 md:grid-cols-3 md:px-12">
        {[
          ["Experiences", resort.experiences[0] || "Local experiences, curated activities, and stay-enhancing moments."],
          ["Dining", "Breakfast, dining highlights, and direct requests shaped around your stay."],
          ["Promotions", "Seasonal packages and direct booking benefits managed through offers."],
        ].map(([title, description]) => (
          <a key={title} href={`/${resort.slug}/${slugForTitle(title)}`} className="rounded-2xl border border-white/10 bg-slate-800/40 p-7 backdrop-blur-md transition hover:border-[var(--br-accent)]/40 hover:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--br-accent)]">{title}</p>
            <p className="mt-5 text-xl leading-8 text-white [font-family:'Playfair_Display',serif]">{description}</p>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-stone-200">Explore <ArrowRightIcon className="h-4 w-4" /></span>
          </a>
        ))}
      </section>

      <BoutiqueResortFooter resort={resort} title="Begin Your Journey" description="Connect with our concierge team to design your perfect stay, or book directly for exclusive privileges." />
      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}

export function BoutiqueResortNav({ resort, links, activeHref }: { resort: Resort; links: Array<{ href: string; label: string }>; activeHref?: string }) {
  const displayLinks = links.length > 0 ? links : [
    { href: `/${resort.slug}/rooms`, label: "Rooms" },
    { href: `/${resort.slug}/experiences`, label: "Experiences" },
    { href: `/${resort.slug}/gallery`, label: "Gallery" },
    { href: `/${resort.slug}/reviews`, label: "Reviews" },
    { href: `/${resort.slug}/about`, label: "About" },
    { href: `/${resort.slug}/contact`, label: "Contact" },
  ];
  const primarySlugs = ["/rooms", "/experiences", "/gallery", "/reviews"];
  const primaryLinks = primarySlugs
    .map((slug) => displayLinks.find((link) => link.href.endsWith(slug)))
    .filter((link): link is { href: string; label: string } => Boolean(link));
  const primaryHrefs = new Set(primaryLinks.map((link) => link.href));
  const secondaryLinks = displayLinks.filter((link) => !primaryHrefs.has(link.href));
  const moreIsActive = secondaryLinks.some((link) => link.href === activeHref);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-7xl flex-col items-center justify-between gap-4 rounded-full border border-white/10 bg-slate-900/80 px-6 py-4 text-stone-200 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:flex-row lg:px-8">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium sm:text-sm lg:max-w-[42%] lg:justify-start">
        <a href={`/${resort.slug}`} className={activeHref === `/${resort.slug}` ? "text-[var(--br-accent)]" : "transition hover:text-white"}>Home</a>
        {primaryLinks.map((link) => (
          <a key={link.href} href={link.href} className={activeHref === link.href ? "text-[var(--br-accent)]" : "transition hover:text-white"}>{link.label}</a>
        ))}
      </div>
      <a href={`/${resort.slug}`} className="text-center text-xl font-semibold tracking-wide text-white [font-family:'Playfair_Display',serif] lg:absolute lg:left-1/2 lg:-translate-x-1/2">
        {resort.name}
      </a>
      <div className="flex items-center gap-4 lg:min-w-[260px] lg:justify-end">
        {secondaryLinks.length > 0 ? (
          <details className="group relative">
            <summary className={`flex cursor-pointer list-none items-center gap-1 text-sm font-medium transition marker:hidden [&::-webkit-details-marker]:hidden ${moreIsActive ? "text-[var(--br-accent)]" : "text-stone-200 hover:text-white"}`}>
              More
              <span className="text-[10px] transition group-open:rotate-180">⌄</span>
            </summary>
            <div className="absolute right-0 top-8 z-50 grid min-w-56 gap-1 rounded-2xl border border-white/10 bg-slate-900/95 p-2 text-sm shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              {secondaryLinks.map((link) => (
                <a key={link.href} href={link.href} className={`rounded-xl px-4 py-2.5 transition ${activeHref === link.href ? "bg-[var(--br-accent)] text-[var(--br-cta-text)]" : "text-stone-200 hover:bg-white/10 hover:text-white"}`}>
                  {link.label}
                </a>
              ))}
            </div>
          </details>
        ) : null}
        <a href={`/${resort.slug}/contact`} className="hidden text-sm font-medium transition hover:text-white lg:inline">Guest Portal</a>
        <a href={`/${resort.slug}#booking`} className="rounded-full bg-[var(--br-cta)] px-5 py-2 text-sm font-medium text-[var(--br-cta-text)] shadow-[0_0_15px_rgba(249,115,22,0.32)] transition hover:brightness-110">Book Direct</a>
      </div>
    </nav>
  );
}

export function BoutiqueResortFooter({ resort, title, description }: { resort: Resort; title: string; description: string }) {
  const palette = templatePaletteFor("boutique-resort", resort.design_settings);

  return (
    <footer id="booking" className="relative overflow-hidden border-t border-white/10 bg-[var(--br-page)] px-6 py-24 text-center md:px-12" style={paletteStyle(palette)}>
      <div className="relative z-10 mx-auto max-w-4xl">
        <h2 className="text-4xl text-white md:text-5xl [font-family:'Playfair_Display',serif]">{title}</h2>
        <p className="mx-auto mt-6 max-w-xl text-stone-300">{description}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <BookingInquiryModal
            resort={resort}
            source="booking_cta"
            triggerLabel="Check Availability"
            buttonClassName="w-full rounded-full px-8 py-3.5 text-base font-medium shadow-[0_0_20px_rgba(249,115,22,0.35)] sm:w-auto"
            buttonStyle={{ backgroundColor: palette.cta, color: palette.ctaText }}
          />
          <a href={`/${resort.slug}#booking`} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-slate-800/40 px-8 text-base font-medium text-white backdrop-blur-md sm:w-auto">
            <WhatsAppIcon className="h-5 w-5 text-[#25d366]" /> WhatsApp Concierge
          </a>
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-stone-400 md:flex-row">
          <p>&copy; 2026 {resort.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href={`/${resort.slug}/about`} className="hover:text-white">Privacy</a>
            <a href={`/${resort.slug}/contact`} className="hover:text-white">Contact</a>
            <a href={`/${resort.slug}/gallery`} className="hover:text-white">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-14 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--br-accent)]">{eyebrow}</p>
      <h2 className="text-4xl text-white md:text-5xl [font-family:'Playfair_Display',serif]">{title}</h2>
      {description ? <p className="mx-auto mt-5 max-w-2xl text-stone-300">{description}</p> : null}
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-white/10 bg-slate-800/40 backdrop-blur-md ${className}`}>{children}</div>;
}

function RoomFeatureCard({ resort, room }: { resort: Resort; room: ResortOffer }) {
  return (
    <a href={`/${resort.slug}/rooms`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur-md">
      <div className="h-[400px] overflow-hidden bg-slate-800">
        {room.image_url ? <Image src={room.image_url} alt={room.title} width={900} height={700} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : null}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-8 pt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl text-white [font-family:'Playfair_Display',serif]">{room.title}</h3>
            <p className="mt-3 flex flex-wrap gap-4 text-sm text-stone-300">
              {room.room_size ? <span>{room.room_size}</span> : null}
              {room.max_guests || room.capacity ? <span>Up to {room.max_guests ?? room.capacity} guests</span> : null}
              {room.view_type ? <span>{room.view_type}</span> : null}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 transition group-hover:border-[var(--br-accent)] group-hover:bg-[var(--br-accent)]">
            <ArrowRightIcon className="h-4 w-4 text-white" />
          </span>
        </div>
      </div>
    </a>
  );
}

function activeRooms(resort: Resort) {
  return (resort.services ?? []).filter((service) => service.is_active && service.kind === "room");
}

function fallbackRooms(resort: Resort): ResortOffer[] {
  return [0, 1].map((index) => ({
    id: `fallback-room-${index}`,
    resort_id: resort.id,
    kind: "room",
    title: index === 0 ? "Signature Suite" : "Pool Villa",
    description: resort.description,
    price_label: null,
    capacity: index === 0 ? 2 : 3,
    image_url: resort.gallery[index] || resort.hero_image_url,
    sort_order: index,
    is_active: true,
  }));
}

function slugForTitle(title: string) {
  if (title === "Dining") return "dining";
  if (title === "Promotions") return "promotions";
  return "experiences";
}

function paletteStyle(palette: ReturnType<typeof templatePaletteFor>) {
  return {
    "--br-page": palette.page,
    "--br-section": palette.section,
    "--br-primary": palette.primary,
    "--br-accent": palette.accent,
    "--br-text": palette.text,
    "--br-muted": palette.muted,
    "--br-border": palette.border,
    "--br-cta": palette.cta,
    "--br-cta-text": palette.ctaText,
  } as CSSProperties;
}
