"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { TravelseedWordmark } from "@/components/brand/TravelseedWordmark";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const localizedHomeContent = {
  en: {
    trust: "Trusted by independent businesses across Indonesia",
    linkPlaceholder: "Paste your current website, Instagram, OTA, or social link",
    linkHelper: "AI extracts public info, photos, services, and offers into an editable draft.",
    categories: [
      {
        title: "Resorts & Villas",
        text: "Showcase amenities, galleries, rooms, packages, and direct WhatsApp inquiries.",
        tags: ["Galleries", "Inquiries"],
        image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
      },
      {
        title: "Cafes & Restaurants",
        text: "Publish menus, opening hours, location details, and table reservation links.",
        tags: ["Menus", "Locations"],
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85",
      },
      {
        title: "Tour Operators",
        text: "Highlight itineraries, pricing packages, customer reviews, and trip inquiries.",
        tags: ["Packages", "Reviews"],
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
      },
      {
        title: "Salons & Wellness",
        text: "Display treatments, pricing, staff profiles, and direct appointment requests.",
        tags: ["Services", "Booking"],
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
      },
    ],
    valueProps: [
      {
        title: "WhatsApp-first design",
        text: "Every template guides customers from browsing to direct WhatsApp conversations without a complex booking engine.",
        icon: "WA",
      },
      {
        title: "Own your web presence",
        text: "Turn scattered social, marketplace, and OTA information into one polished business website you control.",
        icon: "OWN",
      },
      {
        title: "Instant management",
        text: "Update services, offers, photos, and pages from a simple operator console without a developer.",
        icon: "CMS",
      },
    ],
    dashboardStats: [
      ["Page Views", "1,248", "+12%"],
      ["WhatsApp Clicks", "312", "+42%"],
      ["Inquiries", "24", "3 new"],
    ],
    recent: ["Sarah Jenkins", "Asking about availability...", "Budi Pratama", "Voucher redemption..."],
    plans: [
      ["Starter", "Rp 0", "AI draft credit, mobile template, WhatsApp CTA, Travelseed subdomain"],
      ["Business Pro", "Rp 149k", "Custom domain, advanced analytics, review tools, vouchers"],
    ],
  },
  id: {
    trust: "Dipercaya bisnis independen di seluruh Indonesia",
    linkPlaceholder: "Tempel website, Instagram, OTA, atau link sosial Anda",
    linkHelper: "AI mengekstrak info publik, foto, layanan, dan offer menjadi draft yang bisa diedit.",
    categories: [
      {
        title: "Resort & Villa",
        text: "Tampilkan fasilitas, galeri, kamar, paket, dan inquiry WhatsApp langsung.",
        tags: ["Galeri", "Inquiry"],
        image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
      },
      {
        title: "Kafe & Restoran",
        text: "Publish menu, jam buka, lokasi, dan link reservasi meja.",
        tags: ["Menu", "Lokasi"],
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85",
      },
      {
        title: "Operator Tur",
        text: "Sorot itinerary, paket harga, review pelanggan, dan inquiry trip.",
        tags: ["Paket", "Review"],
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
      },
      {
        title: "Salon & Wellness",
        text: "Tampilkan treatment, harga, profil staff, dan permintaan appointment langsung.",
        tags: ["Layanan", "Booking"],
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
      },
    ],
    valueProps: [
      {
        title: "Desain WhatsApp-first",
        text: "Setiap template membawa pelanggan dari browsing ke percakapan WhatsApp tanpa booking engine rumit.",
        icon: "WA",
      },
      {
        title: "Presence web milik sendiri",
        text: "Ubah informasi sosial, marketplace, dan OTA yang tersebar menjadi satu website bisnis yang rapi.",
        icon: "OWN",
      },
      {
        title: "Manajemen instan",
        text: "Update layanan, offer, foto, dan halaman dari console operator sederhana tanpa developer.",
        icon: "CMS",
      },
    ],
    dashboardStats: [
      ["Page Views", "1.248", "+12%"],
      ["Klik WhatsApp", "312", "+42%"],
      ["Inquiry", "24", "3 baru"],
    ],
    recent: ["Sarah Jenkins", "Menanyakan ketersediaan...", "Budi Pratama", "Redeem voucher..."],
    plans: [
      ["Starter", "Rp 0", "Kredit draft AI, template mobile, CTA WhatsApp, subdomain Travelseed"],
      ["Business Pro", "Rp 149k", "Custom domain, analytics lanjutan, review tools, voucher"],
    ],
  },
};

export default function HomePage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState("");
  const content = localizedHomeContent[language];

  function handleHeroSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(sourceUrl.trim() ? `/create?source=${encodeURIComponent(sourceUrl.trim())}` : "/create");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <HeroSection sourceUrl={sourceUrl} onSourceUrlChange={setSourceUrl} onSubmit={handleHeroSubmit} helper={content.linkHelper} placeholder={content.linkPlaceholder} />
      <TrustSection label={content.trust} />
      <ValuePropsSection items={content.valueProps} />
      <CategoriesSection categories={content.categories} />
      <ProductPreviewSection stats={content.dashboardStats} recent={content.recent} />
      <PricingPreviewSection plans={content.plans} />
      <FinalCtaSection />
      <Footer />
    </main>
  );
}

function HeroSection({
  sourceUrl,
  onSourceUrlChange,
  onSubmit,
  helper,
  placeholder,
}: {
  sourceUrl: string;
  onSourceUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  helper: string;
  placeholder: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[88svh] overflow-hidden px-5 pb-16 pt-6 text-white sm:px-6">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=2400&q=85"
          alt="Small business owner managing customer messages"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-neutral-900/70" />
      </div>
      <div className="relative z-10">
        <AppHeader brandTone="light" />
        <div className="mx-auto flex min-h-[calc(88svh-96px)] max-w-5xl flex-col items-center justify-center py-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            WhatsApp-first Website Builder
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
            {t("home.hero.body")}
          </p>
          <form onSubmit={onSubmit} className="mt-9 w-full max-w-3xl">
            <div className="grid gap-2 rounded-lg border border-white/15 bg-white p-2 shadow-2xl shadow-neutral-900/30 sm:grid-cols-[1fr_auto]">
              <input
                type="url"
                value={sourceUrl}
                onChange={(event) => onSourceUrlChange(event.target.value)}
                placeholder={placeholder}
                className="min-h-14 rounded-md border-0 px-4 text-base text-slate-950 outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="min-h-14 rounded-md bg-emerald-600 px-7 text-sm font-semibold text-white transition hover:bg-emerald-500">
                {t("create.ai.button")}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-200">{helper}</p>
          </form>
        </div>
      </div>
    </section>
  );
}

function TrustSection({ label }: { label: string }) {
  return (
    <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <div className="mt-6 grid gap-3 text-center text-sm font-bold text-slate-700 sm:grid-cols-4">
          <p>Bali Retreat</p>
          <p>Jakarta Local</p>
          <p>Ubud Wellness</p>
          <p>Lombok Tours</p>
        </div>
      </div>
    </section>
  );
}

function ValuePropsSection({ items }: { items: Array<{ title: string; text: string; icon: string }> }) {
  const { t } = useLanguage();

  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading label={t("home.problem.label")} title={t("home.problem.title")} text={t("home.problem.text")} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                {item.icon}
              </div>
              <h3 className="mt-7 text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesSection({ categories }: { categories: Array<{ title: string; text: string; tags: string[]; image: string }> }) {
  const { t } = useLanguage();

  return (
    <section className="bg-neutral-900 px-5 py-20 text-white sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <SectionHeading label={t("home.examples.label")} title={t("home.examples.title")} text={t("home.examples.text")} inverted />
          <div className="lg:text-right">
            <Link href="/create" className="inline-flex min-h-11 items-center rounded-md border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
              {t("home.hero.cta")}
            </Link>
          </div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <article key={category.title} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-slate-800">
                <Image src={category.image} alt={category.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{category.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{category.text}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreviewSection({ stats, recent }: { stats: string[][]; recent: string[] }) {
  const { t } = useLanguage();

  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <SectionHeading label={t("home.solution.label")} title={t("home.solution.title")} text={t("home.solution.text")} />
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-white shadow-2xl shadow-slate-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <p className="text-sm font-semibold">Operator Dashboard</p>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">Live</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {stats.map(([label, value, change]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-300">{change}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Recent Inquiries</p>
              <p className="text-xs text-slate-400">WhatsApp</p>
            </div>
            <div className="mt-4 grid gap-3">
              {[0, 2].map((index) => (
                <div key={recent[index]} className="flex items-center justify-between gap-4 rounded-md bg-slate-900 p-3">
                  <div>
                    <p className="text-sm font-semibold">{recent[index]}</p>
                    <p className="mt-1 text-xs text-slate-400">{recent[index + 1]}</p>
                  </div>
                  <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">New</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingPreviewSection({ plans }: { plans: string[][] }) {
  const { t } = useLanguage();

  return (
    <section className="border-y border-slate-200 bg-slate-50 px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading label={t("home.features.label")} title={t("home.features.title")} text={t("home.features.text")} />
          <Link href="/pricing" className="inline-flex min-h-11 w-fit items-center rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800">
            {t("nav.pricing")}
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {plans.map(([name, price, details], index) => (
            <article key={name} className={`rounded-lg border p-6 shadow-sm ${index === 1 ? "border-neutral-800 bg-neutral-900 text-white" : "border-slate-200 bg-white text-slate-950"}`}>
              <h3 className="text-2xl font-semibold">{name}</h3>
              <p className="mt-4 text-4xl font-semibold">{price}</p>
              <p className={`mt-4 text-sm leading-6 ${index === 1 ? "text-slate-300" : "text-slate-600"}`}>{details}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-emerald-50 px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{t("home.cta.label")}</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{t("home.cta.title")}</h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/create" className="inline-flex min-h-12 items-center justify-center rounded-md bg-neutral-900 px-6 text-sm font-semibold text-white hover:bg-neutral-800">
            {t("home.hero.cta")}
          </Link>
          <Link href="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-950">
            {t("nav.pricing")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white px-5 py-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 text-sm text-slate-500 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <TravelseedWordmark className="text-[1.2rem]" />
          <p className="mt-2 max-w-lg">The WhatsApp-first website builder empowering independent hospitality and local commerce in Indonesia.</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/pricing">{t("nav.pricing")}</Link>
          <Link href="/create">{t("home.hero.cta")}</Link>
          <Link href="mailto:hello@travelseed.app">{t("home.footer.contact")}</Link>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  label,
  title,
  text,
  inverted,
}: {
  label: string;
  title: string;
  text: string;
  inverted?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${inverted ? "text-emerald-300" : "text-emerald-700"}`}>{label}</p>
      <h2 className={`mt-4 text-3xl font-semibold tracking-tight sm:text-5xl ${inverted ? "text-white" : "text-slate-950"}`}>{title}</h2>
      <p className={`mt-5 text-base leading-7 ${inverted ? "text-slate-300" : "text-slate-600"}`}>{text}</p>
    </div>
  );
}
