import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { BusinessCategoryIcon } from "@/components/business/BusinessCategoryIcon";
import { LanguageToggle } from "@/components/i18n/LanguageProvider";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { TrackedWhatsAppLink } from "@/components/resort/TrackedWhatsAppLink";
import { businessCategoryFromType, type BusinessCategory, type BusinessCategoryId } from "@/lib/business-categories";
import { designTokensFor } from "@/lib/design-settings";
import { isSiteSectionEnabled, publicNavigationLinks } from "@/lib/site-structure";
import { createWhatsAppBookingUrl } from "@/lib/whatsapp";
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
  accommodation: { primary: "#16a34a", accent: "#22c55e", soft: "#f0fdf4", tint: "#dcfce7" },
  food: { primary: "#ea580c", accent: "#f97316", soft: "#fff7ed", tint: "#ffedd5" },
  tour: { primary: "#0891b2", accent: "#06b6d4", soft: "#ecfeff", tint: "#cffafe" },
  local_service: { primary: "#16a34a", accent: "#22c55e", soft: "#f7fee7", tint: "#dcfce7" },
  wellness: { primary: "#db2777", accent: "#ec4899", soft: "#fff1f2", tint: "#fce7f3" },
};

const templateCopy: Record<BusinessCategoryId, CategoryTemplateCopy> = {
  accommodation: {
    eyebrow: "Hospitality",
    heroBody: "Show rooms, packages, amenities, and direct WhatsApp booking in one focused site.",
    aboutTitle: "A stay guests can understand before they ask",
    detailTitle: "Curated guest experiences",
    detailBody: "Keep the property story practical: what guests can book, what is included, and how to confirm availability.",
    detailItems: [
      { title: "Rooms / Villas", body: "Present room types, private villas, suites, or family stays with direct availability CTAs." },
      { title: "Guest services", body: "Feature breakfast, pickup, tours, spa, rental, or concierge services as add-ons." },
      { title: "Direct booking flow", body: "Use WhatsApp to confirm dates, guests, airport pickup, and final reservation details." },
    ],
    locationTitle: "Plan the stay",
    proofTitle: "Guest reviews",
    proofBody: "Add guest reviews and practical highlights so visitors can decide before starting a booking conversation.",
    faq: [
      { question: "How do guests book?", answer: "They send dates, guests, and room preferences through WhatsApp for direct confirmation." },
      { question: "Can packages be shown?", answer: "Yes. Rooms, bundles, transfers, and guest services can all appear as offer cards." },
    ],
  },
  food: {
    eyebrow: "Cafe & Restaurant",
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
    proofTitle: "Customer reviews",
    proofBody: "Use reviews, menu photos, and opening details to help customers choose quickly.",
    faq: [
      { question: "Can customers reserve a table?", answer: "Yes. The WhatsApp flow asks for preferred time and party size." },
      { question: "Can catering be promoted?", answer: "Yes. Set menus and catering can be shown as packages with direct inquiry CTAs." },
    ],
  },
  tour: {
    eyebrow: "Tours",
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
    proofTitle: "Trip reviews",
    proofBody: "Reviews and practical route details help visitors ask the right question before booking.",
    faq: [
      { question: "Can customers ask about availability?", answer: "Yes. Each tour CTA opens a WhatsApp inquiry with date and group context." },
      { question: "Can pickup be explained?", answer: "Yes. Pickup, transport, tickets, guide, and inclusions can be shown on tour cards." },
    ],
  },
  local_service: {
    eyebrow: "Local business",
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
    eyebrow: "Wellness",
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
    proofTitle: "Appointment reviews",
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
    <main className="min-h-screen bg-[var(--category-page)] pb-20 text-[var(--category-text)] antialiased md:pb-0" style={templateStyle(resort, category.id)}>
      <CategoryHeader resort={resort} category={category} />
      <CategoryHero resort={resort} category={category} copy={copy} />
      <TrustRail resort={resort} category={category} />
      {showAbout ? <AboutBlock resort={resort} category={category} copy={copy} /> : null}
      {showOffers ? <OfferShowcase resort={resort} category={category} /> : null}
      {showDetails ? <CategoryDetails resort={resort} category={category} copy={copy} /> : null}
      {showGallery ? <GalleryBlock resort={resort} /> : null}
      <WhatsAppBlock resort={resort} category={category} copy={copy} />
      {showReviews ? <ReviewBlock resort={resort} category={category} copy={copy} /> : <ProofBlock resort={resort} category={category} copy={copy} />}
      <LocationBlock resort={resort} category={category} copy={copy} />
      <FaqBlock copy={copy} />
      <CategoryFooter resort={resort} category={category} />
      <MobileBottomBar resort={resort} category={category} />
    </main>
  );
}

export function CategoryBusinessSubPage({ resort, page }: { resort: Resort; page: ResortSitePage }) {
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const copy = templateCopy[category.id];
  const slug = page.slug.replace(/^\/+|\/+$/g, "").toLowerCase();

  return (
    <main className="min-h-screen bg-[var(--category-page)] pb-20 text-[var(--category-text)] antialiased md:pb-0" style={templateStyle(resort, category.id)}>
      <CategoryHeader resort={resort} category={category} />
      <PageHero resort={resort} page={page} category={category} />
      {slug === "rooms" ? <OfferShowcase resort={resort} category={category} title={category.landingNav.offers} /> : null}
      {slug === "experiences" ? <CategoryDetails resort={resort} category={category} copy={copy} /> : null}
      {slug === "gallery" ? <GalleryBlock resort={resort} forceEmptyState /> : null}
      {slug === "reviews" ? <ReviewBlock resort={resort} category={category} copy={copy} forceEmptyState /> : null}
      {slug === "about" ? <AboutBlock resort={resort} category={category} copy={copy} /> : null}
      {slug === "contact" ? <LocationBlock resort={resort} category={category} copy={copy} /> : null}
      {!["rooms", "experiences", "gallery", "reviews", "about", "contact"].includes(slug) ? (
        <GenericPageBlock resort={resort} page={page} category={category} />
      ) : null}
      {slug !== "contact" ? <WhatsAppBlock resort={resort} category={category} copy={copy} compact /> : null}
      <CategoryFooter resort={resort} category={category} />
      <MobileBottomBar resort={resort} category={category} />
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
    "--category-accent-soft": `${accent}24`,
    "--category-soft": theme.soft,
    "--category-tint": theme.tint,
    "--category-page": page,
    "--category-text": text,
  } as CSSProperties;
}

function CategoryHeader({ resort, category }: { resort: Resort; category: BusinessCategory }) {
  const design = designTokensFor(resort.design_settings);
  const links = publicNavigationLinks(resort).slice(0, 4);
  const message = resort.booking_message_template || category.defaultBookingMessage(resort.name);
  const whatsappHref = createWhatsAppBookingUrl(resort.whatsapp_number, message);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/40 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-10">
        <a href={`/${resort.slug}`} className="flex min-w-0 shrink-0 items-center gap-2.5">
          {design.logoUrl ? (
            <Image src={design.logoUrl} alt={`${resort.name} logo`} width={32} height={32} className="h-8 w-8 rounded-lg object-cover shadow-md" />
          ) : (
            <BusinessCategoryIcon
              categoryId={category.id}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--category-primary)] text-white shadow-md"
              iconClassName="h-4 w-4"
            />
          )}
          <span className="min-w-0">
            <span className="block truncate text-base font-bold tracking-tight text-[var(--category-text)]">{resort.name}</span>
            <span className="block truncate text-[9px] font-medium uppercase tracking-[0.15em] text-slate-400">{resort.location || "Indonesia"}</span>
          </span>
        </a>

        <nav aria-label={`${resort.name} navigation`} className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a key={`${link.href}-${link.label}`} href={link.href} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[var(--category-accent-soft)] hover:text-[var(--category-text)]">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--category-accent)]" />
            Reply within 1 hour
          </span>
          <TrackedWhatsAppLink
            href={whatsappHref}
            resortId={resort.id}
            source="category_header_cta"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--category-accent)] px-4 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:opacity-90 sm:px-5"
          >
            <WhatsAppMark />
            <span className="hidden sm:inline">{category.primaryCta}</span>
            <span className="sm:hidden">WhatsApp</span>
          </TrackedWhatsAppLink>
          <details className="group relative md:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
              <Icon name="menu" />
            </summary>
            <div className="absolute right-0 mt-3 w-[min(calc(100vw-2.5rem),320px)] rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
              <nav className="grid gap-1">
                {links.map((link) => (
                  <a key={`${link.href}-${link.label}-mobile`} href={link.href} className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    {link.label}
                  </a>
                ))}
              </nav>
              <LanguageToggle className="mt-3 w-full justify-center" />
            </div>
          </details>
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
    <section id="hero" className="relative pt-16">
      <div className="relative h-[88vh] min-h-[560px] max-h-[860px] w-full overflow-hidden bg-slate-900">
        {heroImage ? (
          <Image src={heroImage} alt={resort.name} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--category-primary),#0f172a_58%,var(--category-accent))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/82" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-6 sm:pb-16 lg:px-10">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-px w-6 bg-[var(--category-accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">{copy.eyebrow} · {resort.location || "Indonesia"}</span>
            </div>
            <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {resort.hero_title || category.heroPlaceholder}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              {resort.hero_subtitle || resort.description || copy.heroBody}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedWhatsAppLink
                href={whatsappHref}
                resortId={resort.id}
                source="category_hero_cta"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[var(--category-accent)] px-8 text-base font-bold text-white shadow-lg shadow-black/20 transition hover:opacity-90"
              >
                <WhatsAppMark />
                {category.primaryCta}
              </TrackedWhatsAppLink>
              <a href="#services" className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/25 bg-white/12 px-7 text-base font-semibold text-white backdrop-blur transition hover:bg-white/18">
                View {category.landingNav.offers}
              </a>
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
    <section className="relative bg-slate-900 pt-16">
      <div className="relative min-h-[420px] overflow-hidden">
        {heroImage ? <Image src={heroImage} alt={page.title} fill priority sizes="100vw" className="object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/80" />
        <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-end px-5 pb-12 sm:px-6 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{category.shortLabel}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">{page.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">
              {page.seo_description || `Explore ${page.title.toLowerCase()} from ${resort.name}, then continue directly on WhatsApp.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustRail({ resort, category }: { resort: Resort; category: BusinessCategory }) {
  const offers = displayOffers(resort, category);
  const values: Array<{ icon: IconName; label: string; value: string }> = [
    { icon: "star", label: "Customer ready", value: category.shortLabel },
    { icon: "award", label: "Business type", value: category.label },
    { icon: "home", label: "Location", value: resort.location || "Indonesia" },
    { icon: "spark", label: "Offers", value: `${offers.length} ready to ask` },
    { icon: "wa", label: "WhatsApp", value: "Direct inquiry" },
  ];

  return (
    <section className="w-full bg-slate-950 py-4">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {values.map((item, index) => (
            <div key={item.label} className={`flex shrink-0 items-center gap-2.5 ${index === 0 ? "pr-6" : "px-6"} ${index === values.length - 1 ? "" : "border-r border-slate-700"}`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-[var(--category-primary)]">
                <Icon name={item.icon} />
              </span>
              <div>
                <p className="text-xs font-bold leading-none text-white">{item.value}</p>
                <p className="mt-1 text-[10px] text-slate-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutBlock({ resort, category, copy }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy }) {
  const features = (resort.features.length ? resort.features : category.quickPresets).slice(0, 6);

  return (
    <section id="about" className="bg-white px-5 py-14 text-[var(--category-text)] sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <div>
          <SectionEyebrow>{category.shortLabel}</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--category-text)] sm:text-4xl">{copy.aboutTitle}</h2>
          <p className="mt-5 text-base leading-8 text-[color:var(--category-text)]/70">{resort.description || copy.heroBody}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <article key={feature} className="rounded-2xl border border-[var(--category-accent-soft)] bg-[var(--category-page)] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.03)]">
              <p className="text-sm font-bold text-[var(--category-text)]">{feature}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--category-text)]/65">Customers can ask about this directly through WhatsApp.</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferShowcase({ resort, category, title }: { resort: Resort; category: BusinessCategory; title?: string }) {
  const offers = displayOffers(resort, category);

  return (
    <section id="services" className="w-full bg-[var(--category-page)] px-5 py-16 text-[var(--category-text)] sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <SectionEyebrow centered>{category.landingNav.offers}</SectionEyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--category-text)]">
            {title || category.offerSectionTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--category-text)]/65">{category.offerSectionBody}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.slice(0, 3).map((offer, index) => (
            <OfferCard key={offer.id} offer={offer} category={category} imageFallback={resort.gallery[index] || resort.hero_image_url || null} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferCard({ offer, category, imageFallback, index }: { offer: DisplayOffer; category: BusinessCategory; imageFallback: string | null; index: number }) {
  const imageUrl = offer.imageUrl || imageFallback;
  const chips = [
    offer.duration,
    offer.maxGuests ? `${offer.maxGuests} guests` : null,
    offer.capacity ? `${offer.capacity} ${category.capacityLabel}` : null,
    ...offer.included.slice(0, 2),
  ].filter(Boolean) as string[];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_8px_24px_-6px_rgba(0,0,0,0.08)]">
      <div className="relative h-56 overflow-hidden bg-[var(--category-soft)]">
        {imageUrl ? (
          <Image src={imageUrl} alt={offer.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-[var(--category-primary)]">{category.landingNav.offers}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {offer.highlight ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--category-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            {offer.highlight}
          </span>
        ) : null}
        <span className="absolute right-3 top-3 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          {category.landingNav.offers} {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-[var(--category-text)]">{offer.title}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-700">
            <Icon name="star" className="h-3.5 w-3.5 text-amber-400" />
            4.9
          </span>
        </div>
        <p className="text-sm leading-6 text-[color:var(--category-text)]/65">{offer.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {chips.map((item) => (
            <Chip key={item}>{item}</Chip>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{offer.priceLabel ? "From" : "Price"}</p>
            <p className="text-lg font-extrabold text-[var(--category-text)]">{offer.priceLabel || category.pricingFallback}</p>
          </div>
          <a href="#booking" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--category-accent)] px-4 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition hover:opacity-90">
            <WhatsAppMark />
            {offer.ctaLabel}
          </a>
        </div>
      </div>
    </article>
  );
}

function CategoryDetails({ category, copy }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy }) {
  return (
    <section id="experiences" className="w-full bg-white px-5 py-16 text-[var(--category-text)] sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <SectionEyebrow centered>{category.landingNav.experiences}</SectionEyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--category-text)]">{copy.detailTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[color:var(--category-text)]/65">{copy.detailBody}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {copy.detailItems.map((item, index) => (
            <article key={item.title} className="overflow-hidden rounded-2xl bg-[var(--category-page)] shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_8px_24px_-6px_rgba(0,0,0,0.08)]">
              <div className="flex h-48 items-end bg-[linear-gradient(135deg,var(--category-accent-soft),#ffffff)] p-5">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--category-accent)] shadow-sm">0{index + 1}</span>
              </div>
              <div className="p-5">
                <p className="text-base font-bold text-[var(--category-text)]">{item.title}</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--category-text)]/65">{item.body}</p>
                <a href="#booking" className="mt-4 inline-flex text-sm font-semibold text-[var(--category-accent)]">
                  Enquire <span className="ml-1">→</span>
                </a>
              </div>
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
        <div className="mb-8 text-center">
          <SectionEyebrow centered>Gallery</SectionEyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--category-text)]">A closer look</h2>
        </div>
        {gallery.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-4">
            {gallery.slice(0, 5).map((imageUrl, index) => (
              <div key={`${imageUrl}-${index}`} className={`relative overflow-hidden rounded-2xl bg-slate-200 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_8px_24px_-6px_rgba(0,0,0,0.08)] ${index === 0 ? "min-h-[380px] md:col-span-2 md:row-span-2" : "min-h-[180px]"}`}>
                <Image src={imageUrl} alt={`${resort.name} gallery ${index + 1}`} fill sizes={index === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-[color:var(--category-text)]/65">Add photos from the dashboard to complete this gallery page.</p>
        )}
      </div>
    </section>
  );
}

function WhatsAppBlock({ resort, category, copy, compact = false }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy; compact?: boolean }) {
  const message = resort.booking_message_template || category.defaultBookingMessage(resort.name);
  const whatsappHref = createWhatsAppBookingUrl(resort.whatsapp_number, message);

  return (
    <section id="booking" className={`bg-white px-5 sm:px-6 ${compact ? "py-12" : "py-16 lg:py-20"}`}>
      <div className="mx-auto grid max-w-7xl gap-8 rounded-3xl bg-[var(--category-primary)] p-6 text-white md:grid-cols-[0.95fr_1.05fr] md:p-8 lg:p-10">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{copy.locationTitle}</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{category.inquiry.title}</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">{category.inquiry.body}</p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedWhatsAppLink href={whatsappHref} resortId={resort.id} source="category_contact_cta" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--category-accent)] px-6 text-sm font-bold text-white">
              <WhatsAppMark />
              {category.primaryCta}
            </TrackedWhatsAppLink>
            <BookingInquiryModal
              resort={resort}
              source="category_inquiry_form"
              buttonClassName="min-h-12 rounded-full border border-white/20 px-6 text-sm font-bold text-white"
              buttonStyle={{ backgroundColor: "transparent", color: "white", borderColor: "rgba(255,255,255,0.22)" }}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-slate-950 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--category-accent-soft)] text-[var(--category-accent)]">
              <WhatsAppMark />
            </span>
            <div>
              <p className="text-sm font-bold">{resort.name}</p>
              <p className="text-xs text-slate-500">Typically replies within 1 hour</p>
            </div>
          </div>
          <div className="space-y-3 py-5">
            <div className="max-w-[82%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
              Hello, how can we help with your request?
            </div>
            <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-[var(--category-accent-soft)] px-4 py-3 text-sm leading-6 text-[var(--category-text)]">
              I would like to ask about {category.landingNav.offers.toLowerCase()} at {resort.name}.
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-50 p-2">
            <span className="flex-1 px-3 text-sm text-slate-400">{category.inquiry.requestPlaceholder}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--category-accent)] text-white">→</span>
          </div>
        </div>
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
    <section id="reviews" className="bg-[var(--category-page)] px-5 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <SectionEyebrow centered>{copy.proofTitle}</SectionEyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--category-text)]">What customers say</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--category-text)]/65">{copy.proofBody}</p>
        </div>
        {reviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl bg-white p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_8px_24px_-6px_rgba(0,0,0,0.08)]">
                <p className="mb-3 text-sm font-semibold text-amber-500">{stars(review.rating)}</p>
                <p className="text-base font-semibold text-[var(--category-text)]">&ldquo;{review.review_text}&rdquo;</p>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm font-semibold text-slate-800">{review.guest_name}</p>
                  <p className="text-xs text-slate-400">{category.shortLabel} customer</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-[color:var(--category-text)]/65">Add customer reviews from the dashboard to publish social proof here.</p>
        )}
      </div>
    </section>
  );
}

function ProofBlock({ resort, category, copy }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy }) {
  return (
    <section className="bg-[var(--category-page)] px-5 py-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 rounded-2xl bg-white p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_8px_24px_-6px_rgba(0,0,0,0.08)] md:grid-cols-[0.85fr_1.15fr] md:p-8">
        <div>
          <SectionEyebrow>{copy.proofTitle}</SectionEyebrow>
          <h2 className="mt-4 text-2xl font-extrabold text-[var(--category-text)]">{resort.name} is ready for {category.primaryCta.toLowerCase()}</h2>
        </div>
        <p className="text-sm leading-7 text-[color:var(--category-text)]/65">{copy.proofBody}</p>
      </div>
    </section>
  );
}

function LocationBlock({ resort, category, copy }: { resort: Resort; category: BusinessCategory; copy: CategoryTemplateCopy }) {
  return (
    <section id="location" className="bg-white px-5 py-16 text-[var(--category-text)] sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <SectionEyebrow centered>Location</SectionEyebrow>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--category-text)]">{copy.locationTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[color:var(--category-text)]/65">{resort.location || "Indonesia"} · Continue directly through WhatsApp for details.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard title={resort.location || "Indonesia"} icon="location">
            {resort.description || copy.heroBody}
          </InfoCard>
          <InfoCard title="Contact and arrival" icon="home">
            Message {resort.name} on WhatsApp to ask about {category.landingNav.offers.toLowerCase()}, availability, pricing, and practical details.
          </InfoCard>
        </div>
      </div>
    </section>
  );
}

function FaqBlock({ copy }: { copy: CategoryTemplateCopy }) {
  return (
    <section className="bg-[var(--category-page)] px-5 py-14 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-extrabold text-[var(--category-text)]">Common questions</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {copy.faq.map((item) => (
            <article key={item.question} className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-bold text-[var(--category-text)]">{item.question}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--category-text)]/65">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GenericPageBlock({ resort, page, category }: { resort: Resort; page: ResortSitePage; category: BusinessCategory }) {
  return (
    <section className="bg-white px-5 py-16 text-[var(--category-text)] sm:px-6 lg:py-20">
      <div className="mx-auto max-w-4xl rounded-2xl bg-[var(--category-page)] p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.05)] md:p-8">
        <SectionEyebrow>{page.page_type}</SectionEyebrow>
        <h2 className="mt-4 text-3xl font-extrabold text-[var(--category-text)]">{page.title}</h2>
        <p className="mt-4 text-sm leading-7 text-[color:var(--category-text)]/65">
          This page is published for {resort.name}. Add dedicated copy, photos, and {category.landingNav.offers.toLowerCase()} from the dashboard to complete it.
        </p>
      </div>
    </section>
  );
}

function CategoryFooter({ resort, category }: { resort: Resort; category: BusinessCategory }) {
  const links = publicNavigationLinks(resort).slice(0, 4);

  return (
    <footer className="bg-[var(--category-primary)] px-5 py-10 text-white sm:px-6 lg:py-12">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <BusinessCategoryIcon
              categoryId={category.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--category-accent)] text-white"
              iconClassName="h-4 w-4"
            />
            <div>
              <p className="text-base font-bold tracking-tight">{resort.name}</p>
              <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-slate-500">{resort.location || "Indonesia"}</p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-7 text-slate-400">{resort.description || templateCopy[category.id].heroBody}</p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">Quick links</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}-footer`}>
                <a href={link.href} className="hover:text-white">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">Contact</h3>
          <ul className="space-y-2 text-sm leading-7 text-slate-400">
            <li>{resort.whatsapp_number || "WhatsApp number pending"}</li>
            <li>{resort.location || "Indonesia"}</li>
            <li>{category.primaryCta}</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
        WhatsApp-ready business website powered by Travelseed.
      </div>
    </footer>
  );
}

function MobileBottomBar({ resort, category }: { resort: Resort; category: BusinessCategory }) {
  const message = resort.booking_message_template || category.defaultBookingMessage(resort.name);
  const whatsappHref = createWhatsAppBookingUrl(resort.whatsapp_number, message);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/92 px-5 py-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--category-text)]">{resort.name}</p>
          <p className="truncate text-[11px] text-slate-500">{category.primaryCta} on WhatsApp</p>
        </div>
        <TrackedWhatsAppLink href={whatsappHref} resortId={resort.id} source="category_mobile_bottom_cta" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--category-accent)] px-5 text-sm font-bold text-white">
          <WhatsAppMark />
          WhatsApp
        </TrackedWhatsAppLink>
      </div>
    </div>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: IconName; children: ReactNode }) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_8px_24px_-6px_rgba(0,0,0,0.08)]">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--category-accent-soft)] text-[var(--category-accent)]">
        <Icon name={icon} />
      </span>
      <h3 className="text-xl font-bold text-[var(--category-text)]">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-[color:var(--category-text)]/65">{children}</p>
    </article>
  );
}

function SectionEyebrow({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${centered ? "justify-center" : ""}`}>
      <span className="h-px w-5 bg-[var(--category-accent)]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--category-accent)]">{children}</span>
      {centered ? <span className="h-px w-5 bg-[var(--category-accent)]" /> : null}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[var(--category-accent-soft)] bg-[var(--category-accent-soft)] px-2 py-1 text-[10px] font-medium text-[var(--category-accent)]">{children}</span>;
}

function WhatsAppMark() {
  return <span className="text-sm font-black leading-none">WA</span>;
}

type IconName = "award" | "home" | "location" | "menu" | "spark" | "star" | "wa";

function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    award: (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2v20" />
        <path d="m4.93 4.93 14.14 14.14" />
        <path d="M2 12h20" />
        <path d="m19.07 4.93-14.14 14.14" />
      </>
    ),
    star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2l-5-4.9 6.9-1L12 2Z" />,
    wa: (
      <>
        <path d="M3 21l1.65-3.8A8 8 0 1 1 7 19.35L3 21Z" />
        <path d="M9 9.5c.4 2 2 3.6 4 4l1.1-1.1a1 1 0 0 1 1-.24c.9.3 1.7.75 2.3 1.34a1 1 0 0 1 .14 1.18A2.7 2.7 0 0 1 15.2 16C10.6 16 7 12.4 7 7.8c0-.9.5-1.7 1.3-2.2a1 1 0 0 1 1.2.14c.6.6 1.04 1.4 1.34 2.3a1 1 0 0 1-.24 1L9 9.5Z" />
      </>
    ),
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
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
  return "★".repeat(Math.max(0, Math.min(5, Math.round(rating))));
}
