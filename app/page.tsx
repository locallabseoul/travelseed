"use client";

import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const localizedHomeContent = {
  en: {
    problems: ["OTA dependency", "High commission fees", "No customer ownership", "Manual WhatsApp booking"],
    features: [
      {
        icon: "DB",
        title: "Direct Booking Websites",
        text: "Launch branded resort websites that feel independent from OTA listing pages.",
      },
      {
        icon: "WA",
        title: "WhatsApp Reservation Flow",
        text: "Route guest intent into a familiar WhatsApp conversation with prefilled booking details.",
      },
      {
        icon: "MR",
        title: "Multi Resort Dashboard",
        text: "Manage multiple villas, camps, and boutique stays from one tenant-aware platform.",
      },
      {
        icon: "AI",
        title: "AI-generated Branding Copy",
        text: "Turn raw listing details into polished hospitality positioning and guest-facing copy.",
      },
      {
        icon: "TP",
        title: "Reusable Resort Templates",
        text: "Switch between villa, surf camp, and minimal stay layouts without rebuilding from scratch.",
      },
      {
        icon: "CRM",
        title: "CRM & Customer Data",
        text: "Prepare for owned guest profiles, repeat stays, and direct revenue tracking.",
      },
    ],
    flowSteps: ["OTA Listing", "AI Branding", "Direct Booking Website", "WhatsApp Reservation", "Revenue Growth"],
    howItWorks: ["Import OTA Data", "Generate Resort Brand", "Launch Website", "Get Direct Bookings"],
  },
  id: {
    problems: ["Ketergantungan OTA", "Komisi tinggi", "Tidak memiliki pelanggan", "Booking WhatsApp manual"],
    features: [
      {
        icon: "DB",
        title: "Website Direct Booking",
        text: "Luncurkan website resort bermerek yang terasa independen dari halaman listing OTA.",
      },
      {
        icon: "WA",
        title: "Alur Reservasi WhatsApp",
        text: "Arahkan niat tamu ke percakapan WhatsApp dengan detail booking yang sudah terisi.",
      },
      {
        icon: "MR",
        title: "Dashboard Multi Resort",
        text: "Kelola beberapa villa, camp, dan boutique stay dari satu platform tenant-aware.",
      },
      {
        icon: "AI",
        title: "Brand Copy Berbasis AI",
        text: "Ubah detail listing mentah menjadi positioning hospitality dan copy tamu yang rapi.",
      },
      {
        icon: "TP",
        title: "Template Resort Reusable",
        text: "Ganti layout villa, surf camp, dan minimal stay tanpa membangun ulang dari awal.",
      },
      {
        icon: "CRM",
        title: "CRM & Data Pelanggan",
        text: "Siapkan profil tamu milik sendiri, repeat stay, dan tracking pendapatan langsung.",
      },
    ],
    flowSteps: ["Listing OTA", "Branding AI", "Website Direct Booking", "Reservasi WhatsApp", "Pertumbuhan Revenue"],
    howItWorks: ["Impor Data OTA", "Generate Brand Resort", "Luncurkan Website", "Dapatkan Direct Booking"],
  },
};

const businessExamples = [
  {
    name: "Boutique Villa",
    location: "Lombok stays and private villas",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Surf Camp",
    location: "Activities, packages, and lessons",
    image:
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Local Resort",
    location: "Multi-page hospitality brands",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=85",
  },
];

// Public SaaS landing page for boutique resorts and villa operators.
export default function HomePage() {
  const { language } = useLanguage();
  const content = localizedHomeContent[language];

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#18352f]">
      <HeroSection />
      <ProblemSection problems={content.problems} />
      <SolutionSection flowSteps={content.flowSteps} />
      <FeaturesSection features={content.features} />
      <BusinessExamplesSection />
      <HowItWorksSection steps={content.howItWorks} />
      <FinalCtaSection />
      <Footer />
    </main>
  );
}

function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="overflow-hidden px-5 pb-20 pt-6 sm:px-6 lg:pb-28">
      <AppHeader />

      <div className="mx-auto grid max-w-7xl gap-12 pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pt-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#72815e]">{t("home.hero.kicker")}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.01em] sm:text-6xl lg:text-7xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#51635b] sm:text-xl">
            {t("home.hero.body")}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/create" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#dbc895] px-7 text-sm font-semibold text-[#18352f] shadow-[0_18px_50px_rgba(176,142,86,0.2)]">
              {t("home.hero.cta")}
            </Link>
          </div>
        </div>

        <BrowserPreview />
      </div>
    </section>
  );
}

function BrowserPreview() {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <div className="absolute -inset-8 bg-[radial-gradient(circle_at_30%_20%,rgba(137,155,111,0.28),transparent_34%),radial-gradient(circle_at_90%_70%,rgba(219,194,151,0.34),transparent_30%)]" />
      <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/80 p-3 shadow-[0_34px_110px_rgba(54,43,29,0.18)] backdrop-blur">
        <div className="flex items-center gap-2 border-b border-[#eee7da] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#d8a87a]" />
          <span className="h-3 w-3 rounded-full bg-[#dbc895]" />
          <span className="h-3 w-3 rounded-full bg-[#78906b]" />
          <span className="ml-3 rounded-full bg-[#f4efe7] px-4 py-1 text-xs text-[#6a675c]">
            your-site.travelseed.app
          </span>
        </div>
        <div className="relative min-h-[520px] overflow-hidden rounded-b-[18px] bg-[#18352f]">
          <Image
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1500&q=85"
            alt="Direct booking website preview"
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/70" />
          <div className="absolute left-6 right-6 top-6 flex items-center justify-between text-white">
            <p className="text-sm font-semibold tracking-[0.18em]">{t("home.preview.brand")}</p>
            <span className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold">{t("home.preview.cta")}</span>
          </div>
          <div className="absolute bottom-7 left-6 right-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">{t("home.preview.kicker")}</p>
            <h2 className="mt-3 max-w-lg text-4xl font-semibold leading-tight">
              {t("home.preview.title")}
            </h2>
            <div className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#18352f]">
              {t("home.hero.cta")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection({ problems }: { problems: string[] }) {
  const { t } = useLanguage();

  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label={t("home.problem.label")}
          title={t("home.problem.title")}
          text={t("home.problem.text")}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((problem) => (
            <div key={problem} className="rounded-md border border-[#eadfce] bg-[#fbf8f1] p-6 shadow-[0_18px_55px_rgba(54,43,29,0.06)]">
              <div className="mb-12 h-1.5 w-10 rounded-full bg-[#9e7d4d]" />
              <h3 className="text-xl font-semibold">{problem}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection({ flowSteps }: { flowSteps: string[] }) {
  const { t } = useLanguage();

  return (
    <section className="px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label={t("home.solution.label")}
          title={t("home.solution.title")}
          text={t("home.solution.text")}
        />
        <div className="mt-12 grid gap-3 lg:grid-cols-5">
          {flowSteps.map((step, index) => (
            <div key={step} className="relative rounded-md bg-white p-6 shadow-[0_24px_80px_rgba(54,43,29,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#72815e]">
                Step {index + 1}
              </p>
              <h3 className="mt-8 text-xl font-semibold">{step}</h3>
              {index < flowSteps.length - 1 ? (
                <div className="absolute -right-2 top-1/2 hidden h-4 w-4 rotate-45 border-r border-t border-[#b7a78c] lg:block" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ features }: { features: Array<{ icon: string; title: string; text: string }> }) {
  const { t } = useLanguage();

  return (
    <section className="bg-[#18352f] px-5 py-20 text-white sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label={t("home.features.label")}
          title={t("home.features.title")}
          text={t("home.features.text")}
          inverted
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-md border border-white/12 bg-white/8 p-6 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dbc895] text-xs font-black text-[#18352f]">
                {feature.icon}
              </div>
              <h3 className="mt-8 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-4 leading-7 text-white/70">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessExamplesSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label={t("home.examples.label")}
          title={t("home.examples.title")}
          text={t("home.examples.text")}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {businessExamples.map((business) => (
            <article key={business.name} className="overflow-hidden rounded-md bg-[#fbf8f1] shadow-[0_24px_80px_rgba(54,43,29,0.1)]">
              <div className="relative h-72 overflow-hidden">
                <Image src={business.image} alt={business.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#72815e]">{business.location}</p>
                <h3 className="mt-3 text-2xl font-semibold">{business.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({ steps }: { steps: string[] }) {
  const { t } = useLanguage();

  return (
    <section className="px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label={t("home.how.label")}
          title={t("home.how.title")}
          text={t("home.how.text")}
        />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-md border border-[#dfd3bf] bg-white/70 p-6">
              <p className="text-4xl font-semibold text-[#b49a70]">{index + 1}</p>
              <h3 className="mt-8 text-xl font-semibold">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  const { t } = useLanguage();

  return (
    <section className="px-5 pb-20 sm:px-6 lg:pb-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#18352f] px-6 py-16 text-white shadow-[0_30px_100px_rgba(24,53,47,0.25)] sm:px-10 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#dbc895]">{t("home.cta.label")}</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              {t("home.cta.title")}
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link href="/create" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#18352f]">
              {t("home.hero.cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#ddd2c0] px-5 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-[#51635b] sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold tracking-[0.18em] text-[#18352f]">TRAVELSEED</p>
        <div className="flex flex-wrap gap-5">
          <Link href="/">{t("home.footer.about")}</Link>
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
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${inverted ? "text-[#dbc895]" : "text-[#72815e]"}`}>
        {label}
      </p>
      <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-5xl ${inverted ? "text-white" : "text-[#18352f]"}`}>
        {title}
      </h2>
      <p className={`mt-5 text-lg leading-8 ${inverted ? "text-white/70" : "text-[#51635b]"}`}>{text}</p>
    </div>
  );
}
