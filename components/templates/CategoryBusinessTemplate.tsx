import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { LanguageToggle } from "@/components/i18n/LanguageProvider";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { TrackedWhatsAppLink } from "@/components/resort/TrackedWhatsAppLink";
import { businessCategoryFromType, type BusinessCategory, type BusinessCategoryId } from "@/lib/business-categories";
import { designTokensFor } from "@/lib/design-settings";
import { createWhatsAppBookingUrl } from "@/lib/whatsapp";
import { isSiteSectionEnabled, publicNavigationLinks } from "@/lib/site-structure";
import type { Resort, ResortOffer, ResortSitePage } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

type CategoryTemplateCopy = {
  eyebrow: string;
  heroBody: string;
  aboutTitle: string;
  detailTitle: string;
  detailBody: string;
  detailItems: Array<{ title: string; body: string }>;
  locationTitle: string;
  proofTitle: string;
  proofBody: string;
  faq: Array<{ question: string; answer: string }>;
};

type TemplateTheme = {
  primary: string;
  accent: string;
  soft: string;
  tint: string;
};

type DisplayOffer = {
  id: string;
  title: string;
  description: string;
  kind: ResortOffer["kind"];
  priceLabel: string | null;
  ctaLabel: string;
  imageUrl: string | null;
  highlight: string | null;
  duration: string | null;
  included: string[];
  capacity: number | null;
  maxGuests: number | null;
};

const templateThemes: Record<BusinessCategoryId, TemplateTheme> = {
  accommodation: { primary: "#0f513f", accent: "#16a34a", soft: "#dcfce7", tint: "#f0fdf4" },
  food: { primary: "#7c2d12", accent: "#ea580c", soft: "#ffedd5", tint: "#fff7ed" },
  tour: { primary: "#164e63", accent: "#0891b2", soft: "#cffafe", tint: "#ecfeff" },
  local_service: { primary: "#14532d", accent: "#22c55e", soft: "#dcfce7", tint: "#f7fee7" },
  wellness: { primary: "#6d283f", accent: "#db2777", soft: "#fce7f3", tint: "#fff1f2" },
};

const templateCopy: Record<BusinessCategoryId, CategoryTemplateCopy> = {
  accommodation: {
    eyebrow: "Hospitality website",
    heroBody: "Show rooms, packages, amenities, and direct WhatsApp booking in one focused site.",
    aboutTitle: "A stay guests can understand before they ask",
    detailTitle: "Rooms, services, and arrival details",
    detailBody: "Keep the property story practical: what guests can book, what is included, and how to confirm availability.",
    detailItems: [
      { title: "Rooms / Villas", body: "Present room types, private villas, suites, or family stays with direct availability CTAs." },
      { title: "Guest services", body: "Feature breakfast, pickup, tours, spa, rental, or concierge services as add-ons." },
      { title: "Direct booking flow", body: "Use WhatsApp to confirm dates, guests, airport pickup, and final reservation details." },
    ],
    locationTitle: "Plan the stay",
    proofTitle: "Guest confidence",
    proofBody: "Add guest reviews and practical highlights so visitors can decide before starting a booking conversation.",
    faq: [
      { question: "How do guests book?", answer: "They send dates, guests, and room preferences through WhatsApp for direct confirmation." },
      { question: "Can packages be shown?", answer: "Yes. Rooms, bundles, transfers, and guest services can all appear as offer cards." },
    ],
  },
  food: {
    eyebrow: "Cafe and restaurant website",
    heroBody: "Turn menu highlights, table requests, catering, and WhatsApp orders into a clear customer flow.",
    aboutTitle: "Menu-first, reservation-ready",
    detailTitle: "Menu, reservations, and catering",
    detailBody: "Help customers understand what to order, when to visit, and how to ask about group or catering needs.",
    detailItems: [
      { title: "Menu highlights", body: "Feature signature dishes, coffee, brunch, takeaway, or seasonal specials." },
      { title: "Set menus", body: "Show group dining, private events, catering, and weekend packages as bookable bundles." },
      { title: "Reservations", body: "Ask for date, time, party size, and special requests through WhatsApp." },
    ],
    locationTitle: "Visit or reserve",
    proofTitle: "Customer proof",
    proofBody: "Use reviews, menu photos, and opening details to help customers choose quickly.",
    faq: [
      { question: "Can customers reserve a table?", answer: "Yes. The WhatsApp flow asks for preferred time and party size." },
      { question: "Can catering be promoted?", answer: "Yes. Set menus and catering can be shown as packages with direct inquiry CTAs." },
    ],
  },
  tour: {
    eyebrow: "Tour operator website",
    heroBody: "Show tour packages, itinerary highlights, pickup details, and group availability without a booking engine.",
    aboutTitle: "Tours customers can plan on WhatsApp",
    detailTitle: "Packages, pickup, and itinerary details",
    detailBody: "Make trip decisions easier with package cards, included items, pickup notes, and clear availability prompts.",
    detailItems: [
      { title: "Tour packages", body: "Feature half-day trips, full-day tours, private routes, and group packages." },
      { title: "Itinerary highlights", body: "Explain route, stops, pickup, timing, guide, tickets, and what is included." },
      { title: "Group planning", body: "Collect preferred date, group size, pickup area, and custom requests through WhatsApp." },
    ],
    locationTitle: "Pickup and trip base",
    proofTitle: "Trip confidence",
    proofBody: "Reviews and practical route details help visitors ask the right question before booking.",
    faq: [
      { question: "Can customers ask about availability?", answer: "Yes. Each tour CTA opens a WhatsApp inquiry with date and group context." },
      { question: "Can pickup be explained?", answer: "Yes. Pickup, transport, tickets, guide, and inclusions can be shown on tour cards." },
    ],
  },
  local_service: {
    eyebrow: "Local business website",
    heroBody: "Present products, services, delivery, pickup, consultation, and quote requests in a simple WhatsApp-first site.",
    aboutTitle: "A practical storefront for local customers",
    detailTitle: "Products, services, and quote flow",
    detailBody: "Give customers enough detail to ask for the right product, service, quantity, pickup, delivery, or consultation.",
    detailItems: [
      { title: "Products and services", body: "Show your most requested products, services, rentals, consultations, or support options." },
      { title: "Delivery / pickup", body: "Explain how customers can collect, receive, or schedule the service." },
      { title: "Quote requests", body: "Use WhatsApp to collect request details, quantities, dates, and contact information." },
    ],
    locationTitle: "Contact the business",
    proofTitle: "Customer confidence",
    proofBody: "Business highlights and reviews make the offer easier to trust before customers request a quote.",
    faq: [
      { question: "Can customers request pricing?", answer: "Yes. Offer cards can use request quote, order, or ask details CTAs." },
      { question: "Can products and services appear together?", answer: "Yes. Both can be grouped as customer-ready offer cards." },
    ],
  },
  wellness: {
    eyebrow: "Wellness and salon website",
    heroBody: "Show treatments, packages, appointment requests, duration, staff notes, and WhatsApp booking in one calm flow.",
    aboutTitle: "Treatment details before the appointment",
    detailTitle: "Treatments, packages, and appointments",
    detailBody: "Make it easy for customers to choose a treatment, ask about timing, and book directly.",
    detailItems: [
      { title: "Treatments", body: "Feature massage, salon services, beauty treatments, yoga, clinic, or wellness consultations." },
      { title: "Packages", body: "Show treatment bundles, seasonal promos, memberships, or wellness programs." },
      { title: "Appointments", body: "Collect preferred date, time, treatment, and staff notes through WhatsApp." },
    ],
    locationTitle: "Book a visit",
    proofTitle: "Appointment confidence",
    proofBody: "Reviews, treatment notes, and clear duration details help customers book without back-and-forth.",
    faq: [
      { question: "Can customers book appointments?", answer: "Yes. The WhatsApp flow asks for treatment and preferred date or time." },
      { question: "Can treatment duration be shown?", answer: "Yes. Offer cards support duration, inclusions, package notes, and prices." },
    ],
  },
};

export function CategoryBusinessTemplate({ resort }: TemplateProps) {
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const copy = templateCopy[category.id];
  const showAbout = isSiteSectionEnabled(resort, "about");
  const showOffers = isSiteSectionEnabled(resort, "rooms");
  const showDetails = isSiteSectionEnabled(resort, "experiences");
  const showGallery = isSiteSectionEnabled(resort, "gallery") && publicGallery(resort).length > 0;
  const showReviews = isSiteSectionEnabled(resort, "reviews") && publicReviews(resort).length > 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 antialiased" style={templateStyle(resort, category.id)}>
      <CategoryHeader resort={resort} category={category} />
      <CategoryHero resort={resort} category={category} copy={copy} />
      <TrustBar resort={resort} category={category} />
      {showAbout ? <AboutBlock resort={resort} category={category} copy={copy} /> : null}
      {showOffers ? <OfferShowcase resort={resort} category={category} /> : null}
      {showDetails ? <CategoryDetails resort={resort} category={category} copy={copy} /> : null}
      {showGallery ? <GalleryBlock resort={resort} /> : null}
      {showReviews ? <ReviewBlock resort={resort} category={category} copy={copy} /> : <ProofBlock resort={resort} copy={copy} />}
      <ContactBlock resort={resort} category={category} copy={copy} />
      <FaqBlock copy={copy} />
      <CategoryFooter resort={resort} />
    </main>
  );
}

export function CategoryBusinessSubPage({ resort, page }: { resort: Resort; page: ResortSitePage }) {
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const copy = templateCopy[category.id];
  const slug = page.slug.replace(/^\/+|\/+$/g, "").toLowerCase();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 antialiased" style={templateStyle(resort, category.id)}>
      <CategoryHeader resort={resort} category={category} />
      <PageHero resort={resort} page={page} category={category} />
      {slug === "rooms" ? <OfferShowcase resort={resort} category={category} title={category.landingNav.offers} /> : null}
      {slug === "experiences" ? <CategoryDetails resort={resort} category={category} copy={copy} /> : null}
      {slug === "gallery" ? <GalleryBlock resort={resort} forceEmptyState /> : null}
      {slug === "reviews" ? <ReviewBlock resort={resort} category={category} copy={copy} forceEmptyState /> : null}
      {slug === "about" ? <AboutBlock resort={resort} category={category} copy={copy} /> : null}
      {slug === "contact" ? <ContactBlock resort={resort} category={category} copy={copy} /> : null}
      {!["rooms", "experiences", "gallery", "reviews", "about", "contact"].includes(slug) ? (
        <GenericPageBlock resort={resort} page={page} category={category} />
      ) : null}
      {slug !== "contact" ? <ContactBlock resort={resort} category={category} copy={copy} compact /> : null}
      <CategoryFooter resort={resort} />
    </main>
  );
}

function templateStyle(resort: Resort, categoryId: BusinessCategoryId): CSSProperties {
  const settings = resort.design_settings;
  const theme = templateThemes[categoryId];
  const primary = settings?.customColors?.primary || theme.primary;
  const accent = settings?.customColors?.accent || theme.accent;
  const text = settings?.customColors?.text || "#0f172a";
  const page = settings?.customColors?.page || "#f8fafc";

  return {
    "--category-primary": primary,
    "--category-accent": accent,
    "--category-soft": theme.soft,
    "--category-tint": theme.tint,
    "--category-page": page,
    "--category-text": text,
  } as CSSProperties;
}

function CategoryHeader({ resort, category }: { resort: Resort; category: BusinessCategory }) {
  const design = designTokensFor(resort.design_settings);
  const links = publicNavigationLinks(resort).slice(0, 5);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <a href={`/${resort.slug}`} className="flex min-w-0 items-center gap-3">
          {design.logoUrl ? (
            <Image src={design.logoUrl} alt={`${resort.name} logo`} width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--category-primary)] text-xs font-bold text-white">
              {category.icon}
            </span>
          )}
          <span className="truncate text-sm font-semibold tracking-tight text-slate-950">{resort.name}</span>
        </a>
        <nav aria-label={`${resort.name} navigation`} className="hidden items-center gap-5 lg:flex">
          {links.map((link) => (
            <a key={`${link.href}-${link.label}`} href={link.href} className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-950">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={`/${resort.slug}#booking`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--category-primary)] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:opacity-90"
          >
            {category.primaryCta}
          </a>
          <LanguageToggle className="hidden md:inline-flex" />
        </div>
      </div>
    </header>
  );
}

function CategoryHero({ resort, category, copy }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy }) {
  const heroImage = resort.hero_image_url || resort.gallery[0] || null;
  const message = resort.booking_message_template || category.defaultBookingMessage(resort.name);
  const whatsappHref = createWhatsAppBookingUrl(resort.whatsapp_number, message);

  return (
    <section id="hero" className="relative overflow-hidden bg-[var(--category-page)] px-5 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--category-primary)] shadow-sm">
            {copy.eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-[var(--category-text)] sm:text-5xl lg:text-6xl">
            {resort.hero_title || category.heroPlaceholder}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            {resort.hero_subtitle || resort.description || copy.heroBody}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedWhatsAppLink
              href={whatsappHref}
              resortId={resort.id}
              source="category_hero_cta"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--category-primary)] px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              {category.primaryCta}
            </TrackedWhatsAppLink>
            <a
              href="#services"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              View {category.landingNav.offers}
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-[var(--category-soft)]">
              {heroImage ? (
                <Image src={heroImage} alt={resort.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,var(--category-soft),#ffffff,var(--category-tint))] text-sm font-semibold text-[var(--category-primary)]">
                  {category.shortLabel}
                </div>
              )}
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <MiniFact label="Category" value={category.shortLabel} />
              <MiniFact label="Location" value={resort.location || "Indonesia"} />
              <MiniFact label="Contact" value="WhatsApp" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PageHero({ resort, page, category }: { resort: Resort; page: ResortSitePage; category: BusinessCategory }) {
  const heroImage = page.hero_image_url || resort.hero_image_url || resort.gallery[0] || null;

  return (
    <section className="relative overflow-hidden bg-[var(--category-page)] px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--category-primary)]">{category.shortLabel}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-[var(--category-text)] sm:text-5xl">{page.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            {page.seo_description || `Explore ${page.title.toLowerCase()} from ${resort.name}, then continue directly on WhatsApp.`}
          </p>
        </div>
        {heroImage ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Image src={heroImage} alt={page.title} fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TrustBar({ resort, category }: { resort: Resort; category: BusinessCategory }) {
  const offers = displayOffers(resort, category);
  const values = [
    { label: "Business type", value: category.label },
    { label: "Location", value: resort.location || "Indonesia" },
    { label: "Offers", value: `${offers.length} ready to ask about` },
    { label: "Primary action", value: category.primaryCta },
  ];

  return (
    <section className="border-y border-slate-200 bg-white px-5 py-4 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((item) => (
          <MiniFact key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </section>
  );
}

function AboutBlock({ resort, category, copy }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy }) {
  const features = (resort.features.length ? resort.features : category.quickPresets).slice(0, 8);

  return (
    <section id="about" className="bg-white px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--category-primary)]">{category.shortLabel}</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{copy.aboutTitle}</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {resort.description || copy.heroBody}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{feature}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Customers can ask about this directly through WhatsApp.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferShowcase({ resort, category, title }: { resort: Resort; category: BusinessCategory; title?: string }) {
  const offers = displayOffers(resort, category);

  return (
    <section id="services" className="bg-[var(--category-page)] px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--category-primary)]">{category.landingNav.offers}</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{title || category.offerSectionTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{category.offerSectionBody}</p>
          </div>
          <a href="#booking" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--category-primary)] px-5 text-sm font-semibold text-white">
            {category.primaryCta}
          </a>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer, index) => (
            <OfferCard key={offer.id} offer={offer} category={category} imageFallback={resort.gallery[index] || resort.hero_image_url || null} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferCard({ offer, category, imageFallback }: { offer: DisplayOffer; category: BusinessCategory; imageFallback: string | null }) {
  const imageUrl = offer.imageUrl || imageFallback;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] bg-[var(--category-soft)]">
        {imageUrl ? (
          <Image src={imageUrl} alt={offer.title} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-[var(--category-primary)]">{category.landingNav.offers}</div>
        )}
        {offer.highlight ? (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--category-primary)] shadow-sm">{offer.highlight}</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold leading-snug text-slate-950">{offer.title}</h3>
          {offer.priceLabel ? <span className="shrink-0 text-sm font-semibold text-[var(--category-primary)]">{offer.priceLabel}</span> : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{offer.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {offer.duration ? <Chip>{offer.duration}</Chip> : null}
          {offer.capacity ? <Chip>{offer.capacity} {category.capacityLabel}</Chip> : null}
          {offer.maxGuests ? <Chip>{offer.maxGuests} guests</Chip> : null}
          {offer.included.slice(0, 3).map((item) => <Chip key={item}>{item}</Chip>)}
        </div>
        <a href="#booking" className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-[var(--category-primary)]">
          {offer.ctaLabel}
        </a>
      </div>
    </article>
  );
}

function CategoryDetails({ category, copy }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy }) {
  return (
    <section id="experiences" className="bg-white px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--category-primary)]">{category.landingNav.experiences}</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{copy.detailTitle}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">{copy.detailBody}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {copy.detailItems.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryBlock({ resort, forceEmptyState = false }: { resort: Resort; forceEmptyState?: boolean }) {
  const gallery = publicGallery(resort);

  if (gallery.length === 0 && !forceEmptyState) {
    return null;
  }

  return (
    <section id="gallery" className="bg-[var(--category-page)] px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Gallery</h2>
        {gallery.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {gallery.slice(0, 5).map((imageUrl, index) => (
              <div key={`${imageUrl}-${index}`} className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${index === 0 ? "min-h-[360px] md:col-span-2 md:row-span-2" : "min-h-[170px]"}`}>
                <Image src={imageUrl} alt={`${resort.name} gallery ${index + 1}`} fill sizes={index === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">Add photos from the dashboard to complete this gallery page.</p>
        )}
      </div>
    </section>
  );
}

function ReviewBlock({ resort, category, copy, forceEmptyState = false }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy; forceEmptyState?: boolean }) {
  const reviews = publicReviews(resort);

  if (reviews.length === 0 && !forceEmptyState) {
    return null;
  }

  return (
    <section id="reviews" className="bg-white px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--category-primary)]">{category.shortLabel}</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">{copy.proofTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{copy.proofBody}</p>
        </div>
        {reviews.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-[var(--category-primary)]">{stars(review.rating)}</p>
                <p className="mt-4 text-sm leading-6 text-slate-700">{review.review_text}</p>
                <p className="mt-4 text-sm font-semibold text-slate-950">{review.guest_name}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">Add customer reviews from the dashboard to publish social proof here.</p>
        )}
      </div>
    </section>
  );
}

function ProofBlock({ resort, copy }: { resort: Resort; copy: CategoryTemplateCopy }) {
  return (
    <section className="bg-white px-5 py-14 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-[0.85fr_1.15fr] md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--category-primary)]">{copy.proofTitle}</p>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">{resort.name} is ready for WhatsApp inquiries</h2>
        </div>
        <p className="text-sm leading-7 text-slate-600">{copy.proofBody}</p>
      </div>
    </section>
  );
}

function ContactBlock({ resort, category, copy, compact = false }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy; compact?: boolean }) {
  const message = resort.booking_message_template || category.defaultBookingMessage(resort.name);
  const whatsappHref = createWhatsAppBookingUrl(resort.whatsapp_number, message);

  return (
    <section id="booking" className={`bg-[var(--category-page)] px-5 sm:px-6 ${compact ? "py-12" : "py-16 lg:py-20"}`}>
      <div className="mx-auto grid max-w-7xl gap-6 rounded-2xl bg-[var(--category-primary)] p-6 text-white shadow-sm md:grid-cols-[1fr_0.82fr] md:p-8 lg:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{copy.locationTitle}</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{category.inquiry.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">{category.inquiry.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedWhatsAppLink
              href={whatsappHref}
              resortId={resort.id}
              source="category_contact_cta"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[var(--category-primary)]"
            >
              {category.primaryCta}
            </TrackedWhatsAppLink>
            <BookingInquiryModal
              resort={resort}
              source="category_inquiry_form"
              buttonClassName="min-h-11 rounded-lg border border-white/30 px-5 text-sm font-semibold text-white"
              buttonStyle={{ backgroundColor: "transparent", color: "white", borderColor: "rgba(255,255,255,0.35)" }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/10 p-5">
          <MiniFact label="Location" value={resort.location || "Indonesia"} inverse />
          <div className="mt-4">
            <MiniFact label="WhatsApp" value={resort.whatsapp_number || "Add number"} inverse />
          </div>
          <div className="mt-4">
            <MiniFact label="Request type" value={category.primaryCta} inverse />
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqBlock({ copy }: { copy: CategoryTemplateCopy }) {
  return (
    <section className="bg-white px-5 py-14 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-semibold text-slate-950">Common questions</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {copy.faq.map((item) => (
            <article key={item.question} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">{item.question}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GenericPageBlock({ resort, page, category }: { resort: Resort; page: ResortSitePage; category: BusinessCategory }) {
  return (
    <section className="bg-white px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--category-primary)]">{page.page_type}</p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-950">{page.title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This page is published for {resort.name}. Add dedicated copy, photos, and {category.landingNav.offers.toLowerCase()} from the dashboard to complete it.
        </p>
      </div>
    </section>
  );
}

function CategoryFooter({ resort }: { resort: Resort }) {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-slate-950">{resort.name}</p>
          <p>{resort.location}</p>
        </div>
        <p>WhatsApp-ready business website powered by Travelseed</p>
      </div>
    </footer>
  );
}

function MiniFact({ label, value, inverse = false }: { label: string; value: string; inverse?: boolean }) {
  return (
    <div className={inverse ? "text-white" : "rounded-xl border border-slate-200 bg-white p-4"}>
      <p className={inverse ? "text-xs font-semibold uppercase tracking-[0.16em] text-white/58" : "text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"}>{label}</p>
      <p className={inverse ? "mt-1 text-sm font-semibold text-white" : "mt-1 text-sm font-semibold text-slate-950"}>{value}</p>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[var(--category-soft)] px-3 py-1 text-xs font-semibold text-[var(--category-primary)]">{children}</span>;
}

function displayOffers(resort: Resort, category: BusinessCategory): DisplayOffer[] {
  const activeOffers = (resort.services ?? [])
    .filter((offer) => offer.is_active)
    .filter((offer) => category.offerOrder.includes(offer.kind) || (category.id === "accommodation" && offer.kind === "room"))
    .sort((left, right) => {
      const leftOrder = category.offerOrder.indexOf(left.kind);
      const rightOrder = category.offerOrder.indexOf(right.kind);
      return leftOrder - rightOrder || left.sort_order - right.sort_order;
    })
    .slice(0, 6)
    .map((offer): DisplayOffer => ({
      id: offer.id,
      kind: offer.kind,
      title: offer.title,
      description: offer.description || offer.highlight || category.emptyOfferDescription,
      priceLabel: offer.price_label,
      ctaLabel: offer.cta_label || category.ctaOptions[offer.kind]?.[0] || category.primaryCta,
      imageUrl: offer.image_url,
      highlight: offer.highlight || null,
      duration: offer.duration || null,
      included: offer.included ?? [],
      capacity: offer.capacity,
      maxGuests: offer.max_guests ?? null,
    }));

  if (activeOffers.length > 0) {
    return activeOffers;
  }

  const fallbackTitles = (resort.experiences.length ? resort.experiences : category.quickPresets).slice(0, 3);

  return fallbackTitles.map((title, index) => ({
    id: `fallback-${index}-${title}`,
    kind: index === 1 ? "package" : "service",
    title,
    description: resort.description || category.emptyOfferDescription,
    priceLabel: index === 0 ? category.pricingFallback : null,
    ctaLabel: category.primaryCta,
    imageUrl: resort.gallery[index] || null,
    highlight: index === 0 ? "Featured" : null,
    duration: null,
    included: [],
    capacity: null,
    maxGuests: null,
  }));
}

function publicGallery(resort: Resort) {
  return [resort.hero_image_url, ...resort.gallery].filter(Boolean).filter((item, index, items) => items.indexOf(item) === index) as string[];
}

function publicReviews(resort: Resort) {
  return (resort.reviews ?? [])
    .filter((review) => review.status === "published" && review.show_on_website)
    .sort((first, second) => Number(second.featured) - Number(first.featured) || first.sort_order - second.sort_order)
    .slice(0, 3);
}

function stars(rating: number) {
  return `${Math.max(0, Math.min(5, Math.round(rating)))} / 5`;
}
