"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "id";

export type TranslationKey =
  | "nav.login"
  | "nav.build"
  | "nav.pricing"
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
  | "create.announcement"
  | "create.announcement.cta"
  | "create.nav.marketing"
  | "create.start.kicker"
  | "create.start.title"
  | "create.start.titleLead"
  | "create.start.titleAccent"
  | "create.start.titleTail"
  | "create.start.body"
  | "create.ai.title"
  | "create.ai.body"
  | "create.ai.url"
  | "create.ai.button"
  | "create.ai.loading"
  | "create.manual.title"
  | "create.manual.body"
  | "create.manual"
  | "create.process.title"
  | "create.process.body"
  | "create.process.scan.title"
  | "create.process.scan.body"
  | "create.process.extract.title"
  | "create.process.extract.body"
  | "create.process.draft.title"
  | "create.process.draft.body"
  | "create.footer.description"
  | "create.preview.kicker"
  | "create.preview.title"
  | "create.preview.body"
  | "create.preview.scrollable"
  | "create.preview.full"
  | "create.back"
  | "create.next"
  | "create.builder.search"
  | "create.builder.workspace"
  | "create.builder.progress"
  | "create.builder.complete"
  | "create.builder.completed"
  | "create.builder.current"
  | "create.builder.upcoming"
  | "create.builder.help"
  | "create.builder.userGuide"
  | "create.builder.support"
  | "create.builder.saveContinue"
  | "create.builder.continueTemplate"
  | "create.builder.continuePreview"
  | "create.builder.editBeforePublish"
  | "create.builder.publishNow"
  | "create.builder.openFull"
  | "create.step.business.title"
  | "create.step.business.body"
  | "create.step.services.title"
  | "create.step.services.body"
  | "create.step.template.title"
  | "create.step.template.body"
  | "create.step.publish.title"
  | "create.step.publish.body"
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
    "nav.build": "Create New Site",
    "nav.pricing": "Pricing",
    "nav.profile": "Profile",
    "nav.management": "Site management",
    "nav.newSite": "Build new site",
    "nav.signOut": "Sign out",
    "nav.language": "Language",
    "auth.signInTitle": "Sign in",
    "auth.signUpTitle": "Create account",
    "auth.signInBody": "Sign in to build or manage your business website.",
    "auth.signUpBody": "Create an account and verify your email before publishing.",
    "auth.checking": "Checking session...",
    "auth.signedIn": "Signed in",
    "auth.continue": "Continue",
    "auth.backToSignIn": "Back to sign in",
    "home.hero.kicker": "TRAVELSEED",
    "home.hero.title": "Your business, online in seconds with AI.",
    "home.hero.body": "Paste your existing website, Instagram profile, OTA listing, or social link. Travelseed turns public business information into a polished WhatsApp-ready website.",
    "home.hero.cta": "Create New Site",
    "home.preview.brand": "Your Brand",
    "home.preview.cta": "WHATSAPP",
    "home.preview.kicker": "Local business website",
    "home.preview.title": "A mobile-ready site built around direct customer inquiries",
    "home.problem.label": "The problem",
    "home.problem.title": "Independent businesses are spread across rented channels.",
    "home.problem.text": "Marketplaces and social feeds help people discover you, but they rarely give small operators a clear website, owned customer journey, or direct WhatsApp action path.",
    "home.solution.label": "The solution",
    "home.solution.title": "From any public link to a WhatsApp-first business site.",
    "home.solution.text": "Travelseed reads the information you already have online, drafts your business profile, services, offers, and customer inquiry flow, then lets you refine it before publishing.",
    "home.features.label": "Platform features",
    "home.features.title": "Built for local businesses that sell through conversation.",
    "home.features.text": "A focused toolkit for AI website generation, reusable templates, WhatsApp inquiries, offer pages, and simple business analytics.",
    "home.examples.label": "Business examples",
    "home.examples.title": "Templates for Indonesian hospitality and local commerce.",
    "home.examples.text": "Present menus, packages, services, galleries, reviews, and direct WhatsApp inquiry paths without sending customers through scattered links.",
    "home.how.label": "How it works",
    "home.how.title": "Launch a business website without rebuilding your operations.",
    "home.how.text": "Travelseed starts from the information operators already have, then creates a stronger owned web presence and inquiry flow.",
    "home.cta.label": "Direct customer action starts here",
    "home.cta.title": "Start growing your direct business",
    "home.footer.about": "About",
    "home.footer.contact": "Contact",
    "create.auth.kicker": "Create your site",
    "create.auth.title": "Sign in before building your business website.",
    "create.auth.body": "Create a verified account first, then import an existing link or start manually.",
    "create.loading.session": "Checking account session...",
    "create.announcement": "New: AI Website Generation is now live in Indonesia",
    "create.announcement.cta": "Try it now",
    "create.nav.marketing": "Marketing Homepage",
    "create.start.kicker": "Build your site",
    "create.start.title": "Start building your business website",
    "create.start.titleLead": "Start building your",
    "create.start.titleAccent": "business",
    "create.start.titleTail": "website",
    "create.start.body": "Choose how you want to start. Let our AI extract your details from an existing link, or start fresh.",
    "create.ai.title": "Import from URL",
    "create.ai.body": "Paste your existing website, Instagram profile, or OTA listing. Our AI will instantly draft your new Travelseed site.",
    "create.ai.url": "Website, Instagram, OTA, or social link",
    "create.ai.button": "Generate AI Draft",
    "create.ai.loading": "Generating Draft...",
    "create.manual.title": "Start Manually",
    "create.manual.body": "Build from scratch using our guided setup. Perfect if you want full control or don't have an existing online presence.",
    "create.manual": "Begin Manual Setup",
    "create.process.title": "How the AI extraction works",
    "create.process.body": "We make moving to Travelseed effortless for business owners.",
    "create.process.scan.title": "1. We scan your link",
    "create.process.scan.body": "Our system safely reads the public information from the URL you provide.",
    "create.process.extract.title": "2. Extract details",
    "create.process.extract.body": "We automatically pull your business name, description, images, and services.",
    "create.process.draft.title": "3. Build your draft",
    "create.process.draft.body": "We structure everything into a beautiful, mobile-ready template you can edit.",
    "create.footer.description": "The WhatsApp-first website builder empowering independent hospitality and local commerce in Indonesia.",
    "create.preview.kicker": "Build your preview",
    "create.preview.title": "Preview your WhatsApp-ready website before you publish.",
    "create.preview.body": "Add business details, services, offers, and style choices step by step, then preview how Travelseed turns your existing presence into an owned website.",
    "create.preview.scrollable": "Scrollable preview",
    "create.preview.full": "Open Full Preview",
    "create.back": "Back",
    "create.next": "Next",
    "create.builder.search": "Search...",
    "create.builder.workspace": "Draft workspace",
    "create.builder.progress": "Progress Status",
    "create.builder.complete": "complete",
    "create.builder.completed": "Completed",
    "create.builder.current": "Current step",
    "create.builder.upcoming": "Next step",
    "create.builder.help": "Help",
    "create.builder.userGuide": "User Guide",
    "create.builder.support": "Support",
    "create.builder.saveContinue": "Save & Continue",
    "create.builder.continueTemplate": "Continue to Template",
    "create.builder.continuePreview": "Continue to Preview",
    "create.builder.editBeforePublish": "Edit Before Publish",
    "create.builder.publishNow": "Publish Now",
    "create.builder.openFull": "Open Full Screen",
    "create.step.business.title": "Business Details",
    "create.step.business.body": "Tell us about your business to set up your profile.",
    "create.step.services.title": "Services & Offers",
    "create.step.services.body": "Add what you offer. These will appear as cards on your site.",
    "create.step.template.title": "Template & Style",
    "create.step.template.body": "Design your site's look and feel.",
    "create.step.publish.title": "Review & Publish",
    "create.step.publish.body": "Your site is ready. Review the structure and SEO before going live.",
    "create.account.ready": "Account ready",
    "create.account.signOut": "Sign out",
    "create.account.signInTitle": "Sign in to build",
    "create.account.signUpTitle": "Create your Travelseed account",
    "create.account.signInBody": "Use your verified account to create and manage your site.",
    "create.account.signUpBody": "Verify your email before publishing your WhatsApp-ready business site.",
    "create.account.email": "Email",
    "create.account.password": "Password",
    "create.account.signIn": "Sign In",
    "create.account.signUp": "Create Account",
    "create.account.hasAccount": "Already have an account?",
    "create.account.create": "Create an account",
    "dashboard.sidebar.subtitle": "Business website operations",
    "dashboard.tab.dashboard": "Overview",
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
    "public.bookDirect": "Contact on WhatsApp",
  },
  id: {
    "nav.login": "Masuk",
    "nav.build": "Buat Situs Baru",
    "nav.pricing": "Harga",
    "nav.profile": "Profil",
    "nav.management": "Kelola situs",
    "nav.newSite": "Buat situs baru",
    "nav.signOut": "Keluar",
    "nav.language": "Bahasa",
    "auth.signInTitle": "Masuk",
    "auth.signUpTitle": "Buat akun",
    "auth.signInBody": "Masuk untuk membuat atau mengelola website bisnis Anda.",
    "auth.signUpBody": "Buat akun dan verifikasi email sebelum menerbitkan situs.",
    "auth.checking": "Memeriksa sesi...",
    "auth.signedIn": "Sudah masuk",
    "auth.continue": "Lanjut",
    "auth.backToSignIn": "Kembali ke masuk",
    "home.hero.kicker": "TRAVELSEED",
    "home.hero.title": "Bisnis Anda online dalam hitungan detik dengan AI.",
    "home.hero.body": "Tempel website, profil Instagram, listing OTA, marketplace, atau link sosial yang sudah ada. Travelseed mengubah informasi publik menjadi website siap WhatsApp.",
    "home.hero.cta": "Buat Situs Baru",
    "home.preview.brand": "Brand Anda",
    "home.preview.cta": "WHATSAPP",
    "home.preview.kicker": "Website bisnis lokal",
    "home.preview.title": "Situs mobile-ready untuk inquiry pelanggan langsung",
    "home.problem.label": "Masalah",
    "home.problem.title": "Bisnis independen tersebar di banyak kanal sewaan.",
    "home.problem.text": "Marketplace dan feed sosial membantu ditemukan, tetapi jarang memberi operator kecil website yang jelas, perjalanan pelanggan milik sendiri, atau jalur WhatsApp langsung.",
    "home.solution.label": "Solusi",
    "home.solution.title": "Dari link publik apa pun menjadi website WhatsApp-first.",
    "home.solution.text": "Travelseed membaca informasi yang sudah Anda miliki online, membuat draft profil bisnis, layanan, offer, dan alur inquiry pelanggan, lalu Anda bisa menyempurnakannya sebelum publish.",
    "home.features.label": "Fitur platform",
    "home.features.title": "Dibuat untuk bisnis lokal yang menjual lewat percakapan.",
    "home.features.text": "Toolkit fokus untuk pembuatan website AI, template reusable, inquiry WhatsApp, halaman offer, dan analytics bisnis sederhana.",
    "home.examples.label": "Contoh bisnis",
    "home.examples.title": "Template untuk hospitality dan local commerce Indonesia.",
    "home.examples.text": "Tampilkan menu, paket, layanan, galeri, review, dan jalur inquiry WhatsApp tanpa mengirim pelanggan ke link yang tersebar.",
    "home.how.label": "Cara kerja",
    "home.how.title": "Luncurkan website bisnis tanpa membangun ulang operasional.",
    "home.how.text": "Travelseed memulai dari informasi yang sudah dimiliki operator, lalu membuat presence web dan alur inquiry yang lebih kuat.",
    "home.cta.label": "Aksi pelanggan langsung dimulai di sini",
    "home.cta.title": "Mulai tumbuhkan bisnis langsung Anda",
    "home.footer.about": "Tentang",
    "home.footer.contact": "Kontak",
    "create.auth.kicker": "Buat situs Anda",
    "create.auth.title": "Masuk sebelum membuat website bisnis.",
    "create.auth.body": "Buat akun terverifikasi terlebih dahulu, lalu impor link yang sudah ada atau mulai manual.",
    "create.loading.session": "Memeriksa sesi akun...",
    "create.announcement": "Baru: AI Website Generation sekarang tersedia di Indonesia",
    "create.announcement.cta": "Coba sekarang",
    "create.nav.marketing": "Homepage Marketing",
    "create.start.kicker": "Buat situs Anda",
    "create.start.title": "Mulai buat website bisnis Anda",
    "create.start.titleLead": "Mulai buat website",
    "create.start.titleAccent": "bisnis",
    "create.start.titleTail": "Anda",
    "create.start.body": "Pilih cara memulai. Biarkan AI mengambil detail dari link yang sudah ada, atau mulai dari awal.",
    "create.ai.title": "Impor dari URL",
    "create.ai.body": "Tempel website, profil Instagram, atau listing OTA. AI kami akan langsung membuat draft situs Travelseed Anda.",
    "create.ai.url": "Website, Instagram, OTA, atau link sosial",
    "create.ai.button": "Generate Draft AI",
    "create.ai.loading": "Membuat draft...",
    "create.manual.title": "Mulai Manual",
    "create.manual.body": "Bangun dari awal dengan setup terpandu. Cocok jika Anda ingin kontrol penuh atau belum punya presence online.",
    "create.manual": "Mulai Setup Manual",
    "create.process.title": "Cara kerja ekstraksi AI",
    "create.process.body": "Kami membuat proses pindah ke Travelseed lebih mudah untuk pemilik bisnis.",
    "create.process.scan.title": "1. Kami memindai link Anda",
    "create.process.scan.body": "Sistem kami membaca informasi publik dari URL yang Anda berikan dengan aman.",
    "create.process.extract.title": "2. Ekstrak detail",
    "create.process.extract.body": "Kami otomatis mengambil nama bisnis, deskripsi, gambar, dan layanan.",
    "create.process.draft.title": "3. Buat draft Anda",
    "create.process.draft.body": "Kami menyusun semuanya menjadi template mobile-ready yang bisa Anda edit.",
    "create.footer.description": "Website builder WhatsApp-first untuk membantu bisnis hospitality independen dan commerce lokal di Indonesia.",
    "create.preview.kicker": "Buat preview Anda",
    "create.preview.title": "Preview website siap WhatsApp sebelum publish.",
    "create.preview.body": "Tambahkan detail bisnis, layanan, offer, dan style bertahap, lalu lihat bagaimana Travelseed mengubah presence yang ada menjadi website milik sendiri.",
    "create.preview.scrollable": "Preview dapat di-scroll",
    "create.preview.full": "Buka Preview Penuh",
    "create.back": "Kembali",
    "create.next": "Lanjut",
    "create.builder.search": "Cari...",
    "create.builder.workspace": "Workspace draft",
    "create.builder.progress": "Status Progress",
    "create.builder.complete": "selesai",
    "create.builder.completed": "Selesai",
    "create.builder.current": "Langkah saat ini",
    "create.builder.upcoming": "Langkah berikutnya",
    "create.builder.help": "Bantuan",
    "create.builder.userGuide": "Panduan Pengguna",
    "create.builder.support": "Dukungan",
    "create.builder.saveContinue": "Simpan & Lanjut",
    "create.builder.continueTemplate": "Lanjut ke Template",
    "create.builder.continuePreview": "Lanjut ke Preview",
    "create.builder.editBeforePublish": "Edit sebelum Publish",
    "create.builder.publishNow": "Publish Sekarang",
    "create.builder.openFull": "Buka Layar Penuh",
    "create.step.business.title": "Detail Bisnis",
    "create.step.business.body": "Ceritakan bisnis Anda untuk menyiapkan profil.",
    "create.step.services.title": "Layanan & Offer",
    "create.step.services.body": "Tambahkan apa yang Anda tawarkan. Item ini akan tampil sebagai kartu di situs.",
    "create.step.template.title": "Template & Style",
    "create.step.template.body": "Atur tampilan dan nuansa situs Anda.",
    "create.step.publish.title": "Review & Publish",
    "create.step.publish.body": "Situs Anda siap. Periksa struktur dan SEO sebelum online.",
    "create.account.ready": "Akun siap",
    "create.account.signOut": "Keluar",
    "create.account.signInTitle": "Masuk untuk membuat",
    "create.account.signUpTitle": "Buat akun Travelseed",
    "create.account.signInBody": "Gunakan akun terverifikasi untuk membuat dan mengelola situs.",
    "create.account.signUpBody": "Verifikasi email sebelum menerbitkan website bisnis yang siap WhatsApp.",
    "create.account.email": "Email",
    "create.account.password": "Kata sandi",
    "create.account.signIn": "Masuk",
    "create.account.signUp": "Buat Akun",
    "create.account.hasAccount": "Sudah punya akun?",
    "create.account.create": "Buat akun",
    "dashboard.sidebar.subtitle": "Operasional website bisnis",
    "dashboard.tab.dashboard": "Ringkasan",
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
    "public.bookDirect": "Hubungi via WhatsApp",
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
