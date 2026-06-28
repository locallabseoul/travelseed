"use client";

import Link from "next/link";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const pricingContent = {
  en: {
    title: "Simple, transparent pricing built for your business size.",
    body: "Start for free. Upgrade when your business grows. No hidden commissions or sneaky fees.",
    toggleA: "Local Business",
    toggleB: "Hospitality",
    compare: "Compare plan features",
    faqTitle: "Frequently asked questions",
    ctaTitle: "Ready to grow your direct business?",
    ctaBody: "Join independent Indonesian businesses taking control of their online presence.",
    plans: [
      {
        name: "Starter",
        internal: "Seed Trial",
        price: "Rp 0",
        cadence: "/ forever",
        summary: "Perfect for establishing your online presence.",
        cta: "Start Free",
        features: ["AI website generation draft credit", "Up to 5 core pages", "Mobile-optimized template", "WhatsApp inquiry buttons", "Travelseed subdomain"],
      },
      {
        name: "Business Pro",
        internal: "Seed / Tree",
        price: "Rp 149k",
        cadence: "/ month",
        summary: "For serious operators driving direct customer action.",
        cta: "Upgrade to Pro",
        recommended: true,
        features: ["Everything in Starter", "Custom domain connection", "Advanced analytics", "Review management", "Voucher system", "Remove Travelseed branding"],
      },
      {
        name: "Growth",
        internal: "Forest",
        price: "Rp 399k+",
        cadence: "/ month",
        summary: "For multi-location or high-volume businesses.",
        cta: "Contact Sales",
        features: ["Multiple locations", "Team access", "Custom pages", "Navigation builder", "API-ready structure", "Dedicated support"],
      },
    ],
    faqs: [
      ["Can I use my own domain name?", "Yes. Custom domains are available on paid plans and can be connected from the dashboard."],
      ["Do you take a commission on bookings or sales?", "No. Travelseed is a website and operations tool, not a marketplace commission layer."],
      ["What are AI draft credits?", "A draft credit lets Travelseed read a public link and prepare editable business website content."],
      ["Can I change plan later?", "Yes. Content is preserved when plans change, and higher-plan features are locked rather than deleted."],
    ],
  },
  id: {
    title: "Harga sederhana dan transparan untuk ukuran bisnis Anda.",
    body: "Mulai gratis. Upgrade saat bisnis tumbuh. Tanpa komisi tersembunyi atau biaya mengejutkan.",
    toggleA: "Bisnis Lokal",
    toggleB: "Hospitality",
    compare: "Bandingkan fitur paket",
    faqTitle: "Pertanyaan umum",
    ctaTitle: "Siap menumbuhkan bisnis langsung Anda?",
    ctaBody: "Bergabung dengan bisnis independen Indonesia yang mengontrol online presence mereka sendiri.",
    plans: [
      {
        name: "Starter",
        internal: "Seed Trial",
        price: "Rp 0",
        cadence: "/ selamanya",
        summary: "Cocok untuk membangun presence online pertama.",
        cta: "Mulai Gratis",
        features: ["Kredit draft website AI", "Hingga 5 halaman inti", "Template mobile-optimized", "Tombol inquiry WhatsApp", "Subdomain Travelseed"],
      },
      {
        name: "Business Pro",
        internal: "Seed / Tree",
        price: "Rp 149k",
        cadence: "/ bulan",
        summary: "Untuk operator yang serius mendorong aksi pelanggan langsung.",
        cta: "Upgrade ke Pro",
        recommended: true,
        features: ["Semua fitur Starter", "Custom domain", "Analytics lanjutan", "Manajemen review", "Sistem voucher", "Hapus branding Travelseed"],
      },
      {
        name: "Growth",
        internal: "Forest",
        price: "Rp 399k+",
        cadence: "/ bulan",
        summary: "Untuk bisnis multi-lokasi atau volume tinggi.",
        cta: "Hubungi Sales",
        features: ["Multi lokasi", "Akses tim", "Halaman custom", "Navigation builder", "Struktur API-ready", "Dedicated support"],
      },
    ],
    faqs: [
      ["Bisa pakai domain sendiri?", "Bisa. Custom domain tersedia di paket berbayar dan bisa dihubungkan dari dashboard."],
      ["Apakah Travelseed mengambil komisi booking atau penjualan?", "Tidak. Travelseed adalah website dan operations tool, bukan marketplace berbasis komisi."],
      ["Apa itu kredit draft AI?", "Kredit draft membuat Travelseed membaca link publik dan menyiapkan konten website bisnis yang bisa diedit."],
      ["Bisa ganti paket nanti?", "Bisa. Konten tetap tersimpan saat paket berubah, dan fitur paket tinggi dikunci, bukan dihapus."],
    ],
  },
};

export default function PricingPage() {
  const { language, t } = useLanguage();
  const content = pricingContent[language];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="px-5 pb-16 pt-6 sm:px-6 lg:pb-20">
        <AppHeader />
        <div className="mx-auto max-w-4xl pt-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Pricing</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">{content.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">{content.body}</p>
          <div className="mx-auto mt-8 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm font-semibold shadow-sm">
            <span className="rounded-md bg-neutral-900 px-4 py-2 text-white">{content.toggleA}</span>
            <span className="px-4 py-2 text-slate-500">{content.toggleB}</span>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 lg:pb-24">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {content.plans.map((plan) => (
            <article key={plan.name} className={`relative rounded-lg border p-6 shadow-sm ${plan.recommended ? "border-neutral-800 bg-neutral-900 text-white" : "border-slate-200 bg-white text-slate-950"}`}>
              {plan.recommended ? <span className="absolute right-4 top-4 rounded-md bg-emerald-500 px-3 py-1 text-xs font-bold text-white">RECOMMENDED</span> : null}
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${plan.recommended ? "text-emerald-300" : "text-emerald-700"}`}>{plan.internal}</p>
              <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
              <p className={`mt-2 text-sm leading-6 ${plan.recommended ? "text-slate-300" : "text-slate-600"}`}>{plan.summary}</p>
              <div className="mt-6 flex items-end gap-2">
                <p className="text-4xl font-semibold">{plan.price}</p>
                <p className={`pb-1 text-sm ${plan.recommended ? "text-slate-400" : "text-slate-500"}`}>{plan.cadence}</p>
              </div>
              <ul className={`mt-6 grid gap-3 text-sm ${plan.recommended ? "text-slate-200" : "text-slate-600"}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/create" className={`mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-md px-5 text-sm font-semibold ${plan.recommended ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-neutral-900 text-white hover:bg-neutral-800"}`}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{content.compare}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">No commissions. No deleted content on downgrade.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["AI website generation", "WhatsApp inquiry flow", "Custom domain", "Analytics", "Reviews", "Vouchers"].map((feature) => (
              <div key={feature} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold tracking-tight">{content.faqTitle}</h2>
          <div className="mt-8 grid gap-4">
            {content.faqs.map(([question, answer]) => (
              <article key={question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-50 px-5 py-20 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-semibold tracking-tight">{content.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">{content.ctaBody}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/create" className="inline-flex min-h-12 items-center justify-center rounded-md bg-neutral-900 px-6 text-sm font-semibold text-white hover:bg-neutral-800">
              {t("home.hero.cta")}
            </Link>
            <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-950">
              Travelseed
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
