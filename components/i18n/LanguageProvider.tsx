"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "id";

export type TranslationKey =
  | "nav.login"
  | "nav.build"
  | "nav.profile"
  | "nav.management"
  | "nav.newSite"
  | "nav.signOut"
  | "nav.language"
  | "auth.signInTitle"
  | "auth.signUpTitle"
  | "auth.signInBody"
  | "auth.signUpBody"
  | "auth.checking"
  | "auth.signedIn"
  | "auth.continue"
  | "auth.backToSignIn"
  | "home.hero.kicker"
  | "home.hero.title"
  | "home.hero.body"
  | "home.hero.cta"
  | "home.preview.brand"
  | "home.preview.cta"
  | "home.preview.kicker"
  | "home.preview.title"
  | "home.problem.label"
  | "home.problem.title"
  | "home.problem.text"
  | "home.solution.label"
  | "home.solution.title"
  | "home.solution.text"
  | "home.features.label"
  | "home.features.title"
  | "home.features.text"
  | "home.examples.label"
  | "home.examples.title"
  | "home.examples.text"
  | "home.how.label"
  | "home.how.title"
  | "home.how.text"
  | "home.cta.label"
  | "home.cta.title"
  | "home.footer.about"
  | "home.footer.contact"
  | "create.auth.kicker"
  | "create.auth.title"
  | "create.auth.body"
  | "create.loading.session"
  | "create.start.kicker"
  | "create.start.title"
  | "create.start.body"
  | "create.ai.title"
  | "create.ai.body"
  | "create.ai.url"
  | "create.ai.button"
  | "create.ai.loading"
  | "create.manual"
  | "create.preview.kicker"
  | "create.preview.title"
  | "create.preview.body"
  | "create.preview.scrollable"
  | "create.preview.full"
  | "create.back"
  | "create.next"
  | "create.account.ready"
  | "create.account.signOut"
  | "create.account.signInTitle"
  | "create.account.signUpTitle"
  | "create.account.signInBody"
  | "create.account.signUpBody"
  | "create.account.email"
  | "create.account.password"
  | "create.account.signIn"
  | "create.account.signUp"
  | "create.account.hasAccount"
  | "create.account.create"
  | "dashboard.sidebar.subtitle"
  | "dashboard.tab.dashboard"
  | "dashboard.tab.setup"
  | "dashboard.tab.import"
  | "dashboard.tab.aiCopy"
  | "dashboard.tab.content"
  | "dashboard.tab.offers"
  | "dashboard.tab.structure"
  | "dashboard.tab.design"
  | "dashboard.tab.whatsapp"
  | "dashboard.tab.inquiries"
  | "dashboard.tab.vouchers"
  | "dashboard.tab.domain"
  | "dashboard.tab.analytics"
  | "dashboard.tab.reviews"
  | "dashboard.tab.plan"
  | "dashboard.tab.settings"
  | "public.bookDirect";

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    "nav.login": "Log in",
    "nav.build": "Build My Site",
    "nav.profile": "Profile",
    "nav.management": "Site management",
    "nav.newSite": "Build new site",
    "nav.signOut": "Sign out",
    "nav.language": "Language",
    "auth.signInTitle": "Sign in",
    "auth.signUpTitle": "Create account",
    "auth.signInBody": "Sign in to build or manage your direct booking site.",
    "auth.signUpBody": "Create an account and verify your email before publishing.",
    "auth.checking": "Checking session...",
    "auth.signedIn": "Signed in",
    "auth.continue": "Continue",
    "auth.backToSignIn": "Back to sign in",
    "home.hero.kicker": "TRAVELSEED",
    "home.hero.title": "Turn OTA Listings Into Direct Booking Brands",
    "home.hero.body": "Build beautiful direct booking websites for resorts and villas with WhatsApp reservations, reusable templates, and AI-powered branding.",
    "home.hero.cta": "Build My Site",
    "home.preview.brand": "Your Brand",
    "home.preview.cta": "BOOK DIRECT",
    "home.preview.kicker": "Lombok boutique villa",
    "home.preview.title": "Private Tropical Escape in Selong Belanak",
    "home.problem.label": "The problem",
    "home.problem.title": "Boutique properties are building their business on rented demand.",
    "home.problem.text": "OTAs are useful for discovery, but they rarely help small hospitality operators build owned brands, customer relationships, or direct revenue systems.",
    "home.solution.label": "The solution",
    "home.solution.title": "From listing page to direct booking engine.",
    "home.solution.text": "Travelseed turns existing resort information into a branded website and WhatsApp-first booking flow that operators can own.",
    "home.features.label": "Platform features",
    "home.features.title": "Built for independent resorts that sell through conversation.",
    "home.features.text": "A focused toolkit for direct booking websites, brand copy, reusable templates, and guest-owned customer data.",
    "home.examples.label": "Business examples",
    "home.examples.title": "A visual system for stays, camps, and local businesses.",
    "home.examples.text": "Use photography-led templates to present the atmosphere, services, and direct inquiry path without sending guests to a broken demo.",
    "home.how.label": "How it works",
    "home.how.title": "Launch a direct booking brand without rebuilding your operations.",
    "home.how.text": "Travelseed starts from the data operators already have, then creates a stronger direct booking surface.",
    "home.cta.label": "Direct revenue starts here",
    "home.cta.title": "Start Growing Your Direct Bookings",
    "home.footer.about": "About",
    "home.footer.contact": "Contact",
    "create.auth.kicker": "Create your site",
    "create.auth.title": "Sign in before building your direct booking site.",
    "create.auth.body": "Create a verified account first, then import your listing or start manually.",
    "create.loading.session": "Checking account session...",
    "create.start.kicker": "Build your site",
    "create.start.title": "Start with AI from your OTA listing, or build manually.",
    "create.start.body": "Paste a public Booking, Airbnb, Agoda, or resort listing URL to generate a direct-booking draft. You can review and edit every field before launch.",
    "create.ai.title": "Create with AI",
    "create.ai.body": "Travelseed will read public listing text and turn it into a website draft with copy, amenities, experiences, and a recommended template.",
    "create.ai.url": "OTA listing URL",
    "create.ai.button": "Generate with AI",
    "create.ai.loading": "Generating Draft...",
    "create.manual": "Enter Details Manually",
    "create.preview.kicker": "Build your preview",
    "create.preview.title": "Try your direct booking website before you subscribe.",
    "create.preview.body": "Add your resort details step by step, switch templates, and preview how Travelseed can turn your listing into a direct booking brand.",
    "create.preview.scrollable": "Scrollable preview",
    "create.preview.full": "Open Full Preview",
    "create.back": "Back",
    "create.next": "Next",
    "create.account.ready": "Account ready",
    "create.account.signOut": "Sign out",
    "create.account.signInTitle": "Sign in to build",
    "create.account.signUpTitle": "Create your Travelseed account",
    "create.account.signInBody": "Use your verified account to create and manage your site.",
    "create.account.signUpBody": "Verify your email before publishing your direct booking site.",
    "create.account.email": "Email",
    "create.account.password": "Password",
    "create.account.signIn": "Sign In",
    "create.account.signUp": "Create Account",
    "create.account.hasAccount": "Already have an account?",
    "create.account.create": "Create an account",
    "dashboard.sidebar.subtitle": "Direct booking operations",
    "dashboard.tab.dashboard": "Dashboard",
    "dashboard.tab.setup": "Setup",
    "dashboard.tab.import": "Import",
    "dashboard.tab.aiCopy": "AI Copy",
    "dashboard.tab.content": "Content",
    "dashboard.tab.offers": "Offers",
    "dashboard.tab.structure": "Pages",
    "dashboard.tab.design": "Design",
    "dashboard.tab.whatsapp": "WhatsApp",
    "dashboard.tab.inquiries": "Inquiries",
    "dashboard.tab.vouchers": "Vouchers",
    "dashboard.tab.domain": "Domain",
    "dashboard.tab.analytics": "Analytics",
    "dashboard.tab.reviews": "Reviews",
    "dashboard.tab.plan": "Plan",
    "dashboard.tab.settings": "Settings",
    "public.bookDirect": "Book direct",
  },
  id: {
    "nav.login": "Masuk",
    "nav.build": "Buat Situs Saya",
    "nav.profile": "Profil",
    "nav.management": "Kelola situs",
    "nav.newSite": "Buat situs baru",
    "nav.signOut": "Keluar",
    "nav.language": "Bahasa",
    "auth.signInTitle": "Masuk",
    "auth.signUpTitle": "Buat akun",
    "auth.signInBody": "Masuk untuk membuat atau mengelola website direct booking Anda.",
    "auth.signUpBody": "Buat akun dan verifikasi email sebelum menerbitkan situs.",
    "auth.checking": "Memeriksa sesi...",
    "auth.signedIn": "Sudah masuk",
    "auth.continue": "Lanjut",
    "auth.backToSignIn": "Kembali ke masuk",
    "home.hero.kicker": "TRAVELSEED",
    "home.hero.title": "Ubah Listing OTA Menjadi Brand Pemesanan Langsung",
    "home.hero.body": "Bangun website direct booking yang menarik untuk resort dan villa dengan reservasi WhatsApp, template siap pakai, dan branding berbasis AI.",
    "home.hero.cta": "Buat Situs Saya",
    "home.preview.brand": "Brand Anda",
    "home.preview.cta": "PESAN LANGSUNG",
    "home.preview.kicker": "Villa butik Lombok",
    "home.preview.title": "Private Tropical Escape di Selong Belanak",
    "home.problem.label": "Masalah",
    "home.problem.title": "Properti butik terlalu bergantung pada permintaan dari platform lain.",
    "home.problem.text": "OTA membantu ditemukan tamu, tetapi jarang membantu operator kecil membangun brand sendiri, relasi pelanggan, dan sistem pendapatan langsung.",
    "home.solution.label": "Solusi",
    "home.solution.title": "Dari halaman listing menjadi mesin direct booking.",
    "home.solution.text": "Travelseed mengubah informasi resort yang sudah ada menjadi website brand dan alur booking WhatsApp-first yang dimiliki operator.",
    "home.features.label": "Fitur platform",
    "home.features.title": "Dibuat untuk resort independen yang menjual lewat percakapan.",
    "home.features.text": "Toolkit fokus untuk website direct booking, copy brand, template reusable, dan data tamu milik sendiri.",
    "home.examples.label": "Contoh bisnis",
    "home.examples.title": "Sistem visual untuk stay, camp, dan bisnis lokal.",
    "home.examples.text": "Gunakan template berbasis foto untuk menampilkan suasana, layanan, dan jalur inquiry langsung tanpa mengirim tamu ke demo yang rusak.",
    "home.how.label": "Cara kerja",
    "home.how.title": "Luncurkan brand direct booking tanpa membangun ulang operasional.",
    "home.how.text": "Travelseed memulai dari data yang sudah dimiliki operator, lalu membuat kanal direct booking yang lebih kuat.",
    "home.cta.label": "Pendapatan langsung dimulai di sini",
    "home.cta.title": "Mulai Tingkatkan Direct Booking Anda",
    "home.footer.about": "Tentang",
    "home.footer.contact": "Kontak",
    "create.auth.kicker": "Buat situs Anda",
    "create.auth.title": "Masuk sebelum membuat website direct booking.",
    "create.auth.body": "Buat akun terverifikasi terlebih dahulu, lalu impor listing atau mulai secara manual.",
    "create.loading.session": "Memeriksa sesi akun...",
    "create.start.kicker": "Buat situs Anda",
    "create.start.title": "Mulai dengan AI dari listing OTA, atau isi manual.",
    "create.start.body": "Tempel URL publik dari Booking, Airbnb, Agoda, atau listing resort untuk membuat draft direct booking. Semua field bisa ditinjau dan diedit sebelum launch.",
    "create.ai.title": "Buat dengan AI",
    "create.ai.body": "Travelseed membaca teks listing publik dan mengubahnya menjadi draft website berisi copy, fasilitas, pengalaman, dan rekomendasi template.",
    "create.ai.url": "URL listing OTA",
    "create.ai.button": "Generate dengan AI",
    "create.ai.loading": "Membuat draft...",
    "create.manual": "Isi Detail Manual",
    "create.preview.kicker": "Buat preview Anda",
    "create.preview.title": "Coba website direct booking sebelum berlangganan.",
    "create.preview.body": "Tambahkan detail resort bertahap, ganti template, dan lihat bagaimana Travelseed mengubah listing menjadi brand direct booking.",
    "create.preview.scrollable": "Preview dapat di-scroll",
    "create.preview.full": "Buka Preview Penuh",
    "create.back": "Kembali",
    "create.next": "Lanjut",
    "create.account.ready": "Akun siap",
    "create.account.signOut": "Keluar",
    "create.account.signInTitle": "Masuk untuk membuat",
    "create.account.signUpTitle": "Buat akun Travelseed",
    "create.account.signInBody": "Gunakan akun terverifikasi untuk membuat dan mengelola situs.",
    "create.account.signUpBody": "Verifikasi email sebelum menerbitkan website direct booking.",
    "create.account.email": "Email",
    "create.account.password": "Kata sandi",
    "create.account.signIn": "Masuk",
    "create.account.signUp": "Buat Akun",
    "create.account.hasAccount": "Sudah punya akun?",
    "create.account.create": "Buat akun",
    "dashboard.sidebar.subtitle": "Operasional direct booking",
    "dashboard.tab.dashboard": "Dasbor",
    "dashboard.tab.setup": "Setup",
    "dashboard.tab.import": "Impor",
    "dashboard.tab.aiCopy": "AI Copy",
    "dashboard.tab.content": "Konten",
    "dashboard.tab.offers": "Penawaran",
    "dashboard.tab.structure": "Halaman",
    "dashboard.tab.design": "Desain",
    "dashboard.tab.whatsapp": "WhatsApp",
    "dashboard.tab.inquiries": "Inquiry",
    "dashboard.tab.vouchers": "Voucher",
    "dashboard.tab.domain": "Domain",
    "dashboard.tab.analytics": "Analitik",
    "dashboard.tab.reviews": "Ulasan",
    "dashboard.tab.plan": "Paket",
    "dashboard.tab.settings": "Pengaturan",
    "public.bookDirect": "Pesan langsung",
  },
};

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("travelseed-language");
    if (stored === "id" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("travelseed-language", language);
    document.documentElement.lang = language === "id" ? "id" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key) => translations[language][key] ?? translations.en[key],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div aria-label={t("nav.language")} className={`inline-flex rounded-full border border-[#d8cebb] bg-white/80 p-1 text-xs font-semibold text-[#18352f] ${className}`}>
      {(["en", "id"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={`min-h-8 rounded-full px-3 transition ${language === option ? "bg-[#18352f] text-white" : "text-[#52615a] hover:bg-[#f8f5ef]"}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
