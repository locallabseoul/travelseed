import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { BoutiqueResortFooter, BoutiqueResortNav, GlassCard, SectionHeading } from "@/components/templates/BoutiqueResortTemplate";
import { ArrowRightIcon, CoffeeIcon, LocationIcon, MailIcon, MapIcon, WhatsAppIcon } from "@/components/templates/template-icons";
import { templatePaletteFor } from "@/lib/design-settings";
import { presetForSlug, presetSettingsFrom } from "@/lib/section-presets";
import { publicNavigationLinks } from "@/lib/site-structure";
import type { SitePageContentCard } from "@/types/dashboard";
import type { Resort, ResortOffer, ResortSitePage } from "@/types/resort";

type ResortSubPageProps = {
  resort: Resort;
  page: ResortSitePage;
};

export function BoutiqueResortSubPage({ resort, page }: ResortSubPageProps) {
  const palette = templatePaletteFor("boutique-resort", resort.design_settings);
  const slug = slugKeyFor(page);
  const navLinks = publicNavigationLinks(resort).filter((link) => link.href !== `/${resort.slug}`);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--br-page)] text-[var(--br-text)] antialiased [font-family:Inter,sans-serif]" style={paletteStyle(palette)}>
      <BoutiqueResortNav resort={resort} links={navLinks} activeHref={`/${resort.slug}/${slug}`} />
      <SubPageHero resort={resort} page={page} />
      {slug === "rooms" ? <RoomsPage resort={resort} /> : null}
      {slug === "experiences" ? <ExperiencesPage resort={resort} /> : null}
      {slug === "gallery" ? <GalleryPage resort={resort} /> : null}
      {slug === "reviews" ? <ReviewsPage resort={resort} /> : null}
      {slug === "about" ? <AboutPage resort={resort} /> : null}
      {slug === "contact" ? <ContactPage resort={resort} /> : null}
      {["promotions", "dining", "activities", "nearby-attractions"].includes(slug) ? <PresetPage resort={resort} page={page} /> : null}
      {slug === "blog" ? <EditorialPage resort={resort} page={page} /> : null}
      {!["rooms", "experiences", "gallery", "reviews", "about", "contact", "promotions", "dining", "activities", "nearby-attractions", "blog"].includes(slug) ? <EditorialPage resort={resort} page={page} /> : null}
      <BoutiqueResortFooter resort={resort} title={footerTitleFor(slug)} description="Connect with our concierge team for direct booking support, local guidance, and the best available stay options." />
      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}

function SubPageHero({ resort, page }: ResortSubPageProps) {
  const image = page.hero_image_url || resort.hero_image_url || resort.gallery[0] || null;

  return (
    <section className="relative mt-20 flex h-[600px] items-center justify-center overflow-hidden px-6 text-center">
      <div className="absolute inset-0">
        {image ? <Image src={image} alt={`${page.title} at ${resort.name}`} fill priority sizes="100vw" className="object-cover opacity-50" /> : <div className="h-full w-full bg-slate-800" />}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-transparent to-[var(--br-page)]" />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl">
        <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
          <LocationIcon className="h-4 w-4 text-[var(--br-accent)]" />
          {resort.location}
        </p>
        <h1 className="text-5xl font-medium leading-tight tracking-tight text-white md:text-6xl [font-family:'Playfair_Display',serif]">{page.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-8 text-stone-200">
          {page.seo_description || `Explore ${page.title.toLowerCase()} at ${resort.name}, then continue your booking directly with the host.`}
        </p>
      </div>
    </section>
  );
}

function RoomsPage({ resort }: { resort: Resort }) {
  const rooms = (resort.services ?? []).filter((service) => service.is_active && service.kind === "room");
  const items = rooms.length > 0 ? rooms : fallbackRooms(resort);

  return (
    <>
      <FilterBar labels={["Price Range", "Bed Type", "Occupancy", "View & Pool", "Breakfast Included"]} />
      <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {items.map((room) => <RoomCard key={room.id} resort={resort} room={room} />)}
        </div>
      </section>
    </>
  );
}

function RoomCard({ resort, room }: { resort: Resort; room: ResortOffer }) {
  return (
    <GlassCard className="group overflow-hidden rounded-2xl transition hover:border-[var(--br-accent)]/40">
      <div className="relative h-[320px] overflow-hidden bg-slate-800">
        {room.image_url ? <Image src={room.image_url} alt={room.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" /> : null}
        {room.highlight ? <span className="absolute right-4 top-4 rounded-full bg-[var(--br-accent)] px-3 py-1 text-xs font-semibold text-[var(--br-cta-text)]">{room.highlight}</span> : null}
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-2xl text-white [font-family:'Playfair_Display',serif]">{room.title}</h3>
            <p className="mt-3 flex flex-wrap gap-4 text-sm text-stone-300">
              {room.bed_type ? <span>{room.bed_type}</span> : null}
              {room.room_size ? <span>{room.room_size}</span> : null}
              {room.max_guests || room.capacity ? <span>Up to {room.max_guests ?? room.capacity} guests</span> : null}
            </p>
          </div>
          {room.price_label ? (
            <div className="text-left sm:text-right">
              <p className="text-xs text-stone-400">Starting from</p>
              <p className="text-3xl text-white [font-family:'Playfair_Display',serif]">{room.price_label}</p>
            </div>
          ) : null}
        </div>
        <p className="mt-5 text-sm leading-7 text-stone-300">{room.description || "A calm private space prepared for direct booking guests."}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(room.room_amenities?.length ? room.room_amenities : room.included ?? []).slice(0, 5).map((amenity) => <Pill key={amenity}>{amenity}</Pill>)}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <BookingInquiryModal
            resort={resort}
            source="room_card"
            triggerLabel="Book Direct"
            buttonClassName="flex-1 rounded-full py-3 text-sm font-medium"
            buttonStyle={{ backgroundColor: "var(--br-cta)", color: "var(--br-cta-text)" }}
          />
          <a href={`/${resort.slug}#booking`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-slate-800/40 px-6 text-sm font-medium text-white">View Details</a>
        </div>
      </div>
    </GlassCard>
  );
}

function ExperiencesPage({ resort }: { resort: Resort }) {
  const items = resort.experiences.length > 0 ? resort.experiences : ["Private arrival coordination", "Local beach days", "Dining and sunset plans"];
  const cards = items.map((item, index) => ({
    id: `experience-${index}`,
    title: item,
    description: "",
    imageUrl: "",
    sortOrder: index,
  }));

  return <CardGrid eyebrow="Guest experiences" cards={cards} images={resort.gallery} />;
}

function GalleryPage({ resort }: { resort: Resort }) {
  const images = [resort.hero_image_url, ...resort.gallery].filter(Boolean).filter(unique) as string[];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:auto-rows-[260px]">
        {images.slice(0, 8).map((image, index) => (
          <div key={`${image}-${index}`} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-800 ${index === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"}`}>
            <Image src={image} alt={`${resort.name} gallery ${index + 1}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 hover:scale-105" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsPage({ resort }: { resort: Resort }) {
  const reviews = (resort.reviews ?? []).filter((review) => review.show_on_website && review.status === "published");
  const items = reviews.length > 0 ? reviews : [
    { id: "fallback-review-1", guest_name: "Direct booking guest", rating: 5, review_text: "A refined stay with thoughtful details and calm hospitality.", source_label: "Manual" as const },
    { id: "fallback-review-2", guest_name: "Returning guest", rating: 5, review_text: "The booking flow was easy and the property felt exactly as promised.", source_label: "Manual" as const },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((review) => (
          <GlassCard key={review.id} className="rounded-2xl p-8">
            <p className="mb-6 text-[var(--br-accent)]">{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</p>
            <p className="text-2xl leading-9 text-white [font-family:'Playfair_Display',serif]">&ldquo;{review.review_text}&rdquo;</p>
            <p className="mt-8 text-sm font-semibold text-stone-200">{review.guest_name}</p>
            <p className="mt-1 text-xs text-stone-400">{review.source_label}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function AboutPage({ resort }: { resort: Resort }) {
  const image = resort.gallery[0] || resort.hero_image_url;

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 md:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-slate-800">
        {image ? <Image src={image} alt={`${resort.name} story`} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover opacity-80" /> : null}
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--br-accent)]">Our Story</p>
        <h2 className="mt-5 text-4xl leading-tight text-white md:text-6xl [font-family:'Playfair_Display',serif]">{resort.name}</h2>
        <p className="mt-7 text-lg font-light leading-9 text-stone-300">{resort.description || resort.hero_subtitle || "A boutique resort experience built around direct hospitality, local context, and calm design."}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[resort.location, resort.type || "Boutique stay", `${(resort.services ?? []).length} offers`].map((item) => <GlassCard key={item} className="rounded-2xl p-5 text-sm text-stone-200">{item}</GlassCard>)}
        </div>
      </div>
    </section>
  );
}

function ContactPage({ resort }: { resort: Resort }) {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 md:px-12 lg:grid-cols-[0.85fr_1.15fr]">
      <GlassCard className="rounded-3xl p-8">
        <h2 className="text-4xl text-white [font-family:'Playfair_Display',serif]">Contact Concierge</h2>
        <div className="mt-8 grid gap-5 text-stone-300">
          <ContactLine icon={<WhatsAppIcon className="h-5 w-5 text-[#25d366]" />} label="WhatsApp" value={resort.whatsapp_number} />
          {resort.owner_email ? <ContactLine icon={<MailIcon className="h-5 w-5 text-[var(--br-accent)]" />} label="Email" value={resort.owner_email} /> : null}
          <ContactLine icon={<LocationIcon className="h-5 w-5 text-[var(--br-accent)]" />} label="Location" value={resort.location} />
        </div>
      </GlassCard>
      <GlassCard className="rounded-3xl p-8">
        <h3 className="text-3xl text-white [font-family:'Playfair_Display',serif]">Plan your stay directly</h3>
        <p className="mt-4 text-stone-300">Ask about dates, rooms, airport pickup, dining, or special requests. The message will open in WhatsApp with the stay context included.</p>
        <div className="mt-8">
          <BookingInquiryModal resort={resort} source="contact_page" triggerLabel="Open WhatsApp Booking" buttonClassName="rounded-full px-8 py-3.5 text-base font-medium" buttonStyle={{ backgroundColor: "var(--br-cta)", color: "var(--br-cta-text)" }} />
        </div>
      </GlassCard>
    </section>
  );
}

function PresetPage({ resort, page }: ResortSubPageProps) {
  const preset = presetForSlug(page.slug);
  if (!preset) return null;
  const settings = presetSettingsFrom(page.settings, preset);

  if (preset.layout === "promotions") {
    const offers = (resort.services ?? []).filter((service) => service.is_active && (service.kind === "package" || service.kind === "service") && Boolean(service.highlight));
    return <PromotionCards resort={resort} offers={offers} fallback={settings.items} note={settings.campaignNote} ctaLabel={settings.ctaLabel} />;
  }

  if (preset.layout === "dining") {
    return <DiningPage settings={settings} images={resort.gallery} />;
  }

  if (page.slug.includes("nearby")) {
    return <NearbyPage cards={settings.cards} images={resort.gallery} />;
  }

  return <CardGrid eyebrow={preset.card.eyebrow} cards={settings.cards} images={resort.gallery} />;
}

function PromotionCards({ resort, offers, fallback, note, ctaLabel }: { resort: Resort; offers: ResortOffer[]; fallback: string[]; note?: string; ctaLabel: string }) {
  const cards = offers.length > 0 ? offers : fallback.map((item, index) => ({
    id: `fallback-promo-${index}`,
    title: item,
    description: "Direct booking campaign highlight for guests planning their stay.",
    price_label: null,
    highlight: "Direct booking",
    image_url: resort.gallery[index] || resort.hero_image_url,
  } as ResortOffer));

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
      <div className="grid gap-8 md:grid-cols-3">
        {cards.slice(0, 3).map((offer) => (
          <GlassCard key={offer.id} className="overflow-hidden rounded-2xl">
            <div className="relative h-56 bg-slate-800">
              {offer.image_url ? <Image src={offer.image_url} alt={offer.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" /> : null}
              <span className="absolute left-4 top-4 rounded-full bg-[var(--br-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--br-cta-text)]">{offer.highlight}</span>
            </div>
            <div className="p-6">
              <h3 className="text-2xl text-white [font-family:'Playfair_Display',serif]">{offer.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-300">{offer.description}</p>
              {offer.price_label ? <p className="mt-5 text-xl text-white [font-family:'Playfair_Display',serif]">{offer.price_label}</p> : null}
              <a href={`/${resort.slug}#booking`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--br-cta)] px-5 py-3 text-sm font-medium text-[var(--br-cta-text)]">{offer.cta_label || ctaLabel} <ArrowRightIcon className="h-4 w-4" /></a>
            </div>
          </GlassCard>
        ))}
      </div>
      {note ? <p className="mt-8 rounded-2xl border border-white/10 bg-slate-800/40 p-5 text-sm leading-7 text-stone-300">{note}</p> : null}
    </section>
  );
}

function DiningPage({ settings, images }: { settings: ReturnType<typeof presetSettingsFrom>; images: string[] }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
      <SectionHeading eyebrow="Dining" title={settings.title} description={settings.intro} />
      <div className="grid gap-8 md:grid-cols-3">
        {settings.cards.map((card, index) => (
          <GlassCard key={card.id} className="overflow-hidden rounded-2xl">
            <div className="relative h-56 bg-slate-800">
              {imageForCard(card, images, index) ? <Image src={imageForCard(card, images, index)} alt={card.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" /> : null}
              <span className="absolute left-4 top-4 rounded-full bg-slate-900/80 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md"><CoffeeIcon className="mr-1 inline h-3 w-3 text-[var(--br-accent)]" /> Dining</span>
            </div>
            <div className="p-6">
              <h3 className="text-2xl text-white [font-family:'Playfair_Display',serif]">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-300">{card.description || "Presented as part of the guest dining experience."}</p>
            </div>
          </GlassCard>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[["Opening hours", settings.openingHours], ["Breakfast", settings.breakfastInfo], ["Private dining", settings.privateDiningNote]].filter((item) => item[1]).map(([label, value]) => (
          <GlassCard key={label} className="rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--br-accent)]">{label}</p>
            <p className="mt-3 text-sm leading-7 text-stone-300">{value}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function NearbyPage({ cards, images }: { cards: SitePageContentCard[]; images: string[] }) {
  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12">
        <GlassCard className="flex h-[360px] items-center justify-center rounded-3xl">
          <div className="text-center">
            <MapIcon className="mx-auto h-16 w-16 text-[var(--br-accent)]" />
            <p className="mt-5 text-2xl text-white [font-family:'Playfair_Display',serif]">Interactive Map</p>
            <p className="mt-2 text-sm text-stone-400">Map metadata can be added in a later structured content phase.</p>
          </div>
        </GlassCard>
      </section>
      <CardGrid eyebrow="Nearby place" cards={cards} images={images} />
    </>
  );
}

function CardGrid({ eyebrow, cards, images }: { eyebrow: string; cards: SitePageContentCard[]; images: string[] }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
      <div className="grid gap-8 md:grid-cols-3">
        {cards.map((card, index) => (
          <GlassCard key={card.id} className="overflow-hidden rounded-2xl">
            <div className="relative h-56 bg-slate-800">
              {imageForCard(card, images, index) ? <Image src={imageForCard(card, images, index)} alt={card.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" /> : null}
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--br-accent)]">{eyebrow}</p>
              <h3 className="mt-4 text-2xl text-white [font-family:'Playfair_Display',serif]">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-300">{card.description || "A curated highlight guests can plan around during the stay."}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}

function imageForCard(card: SitePageContentCard, images: string[], index: number) {
  return card.imageUrl || images[index] || "";
}

function EditorialPage({ resort, page }: ResortSubPageProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 md:px-12">
      <GlassCard className="rounded-3xl p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--br-accent)]">{page.page_type}</p>
        <h2 className="mt-5 text-4xl text-white [font-family:'Playfair_Display',serif]">{page.title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-stone-300">This page is ready in the site structure. Add content in Pages when the resort is ready to publish a dedicated story.</p>
        <a href={`/${resort.slug}#booking`} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[var(--br-cta)] px-6 text-sm font-medium text-[var(--br-cta-text)]">Start a direct inquiry</a>
      </GlassCard>
    </section>
  );
}

function FilterBar({ labels }: { labels: string[] }) {
  return (
    <section className="mx-auto w-full max-w-7xl border-b border-white/10 px-6 py-8 md:px-12">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-stone-300">Filter by:</span>
        {labels.map((label) => <button key={label} type="button" className="rounded-full border border-white/10 bg-slate-800/40 px-4 py-2 text-sm text-stone-200 backdrop-blur-md">{label}</button>)}
      </div>
    </section>
  );
}

function ContactLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      {icon}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <p className="mt-1 text-white">{value}</p>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-slate-800/40 px-3 py-1.5 text-xs text-stone-200">{children}</span>;
}

function fallbackRooms(resort: Resort): ResortOffer[] {
  return [0, 1].map((index) => ({
    id: `fallback-sub-room-${index}`,
    resort_id: resort.id,
    kind: "room",
    title: index === 0 ? "Ocean Villa Suite" : "Sanctuary Pool Suite",
    description: resort.description || "A refined private suite for direct booking guests.",
    price_label: null,
    capacity: index === 0 ? 2 : 3,
    image_url: resort.gallery[index] || resort.hero_image_url,
    sort_order: index,
    is_active: true,
  }));
}

function slugKeyFor(page: ResortSitePage) {
  return page.slug.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function footerTitleFor(slug: string) {
  if (slug === "dining") return "Savor Every Moment";
  if (slug === "promotions") return "Claim Your Direct Stay";
  if (slug === "contact") return "Speak With Concierge";
  return "Begin Your Journey";
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

function unique(value: string | null | undefined, index: number, list: Array<string | null | undefined>) {
  return Boolean(value) && list.indexOf(value) === index;
}
