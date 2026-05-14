import { AboutSection } from "@/components/resort/AboutSection";
import { BookingSection } from "@/components/resort/BookingSection";
import { ExperienceSection } from "@/components/resort/ExperienceSection";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { FooterSection } from "@/components/resort/FooterSection";
import { GallerySection } from "@/components/resort/GallerySection";
import { ReviewSection } from "@/components/resort/ReviewSection";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import { ServiceSection } from "@/components/resort/ServiceSection";
import { designTokensFor } from "@/lib/design-settings";
import Image from "next/image";
import type { Resort, ResortSitePage } from "@/types/resort";

type ResortSubPageProps = {
  resort: Resort;
  page: ResortSitePage;
};

function slugKeyFor(page: ResortSitePage) {
  return page.slug.replace(/^\/+|\/+$/g, "").toLowerCase();
}

export function ResortSubPage({ resort, page }: ResortSubPageProps) {
  const design = designTokensFor(resort.design_settings);
  const slugKey = slugKeyFor(page);

  return (
    <main className="min-h-screen text-[#18352f]" style={{ backgroundColor: design.colors.page }}>
      <ResortNavigation resort={resort} variant="minimal" />
      <SubPageHero resort={resort} page={page} />
      {slugKey === "rooms" ? <ServiceSection resort={resort} variant="boutique" /> : null}
      {slugKey === "experiences" ? <ExperienceSection resort={resort} /> : null}
      {slugKey === "gallery" ? <GallerySection resort={resort} /> : null}
      {slugKey === "reviews" ? <ReviewSection resort={resort} variant="boutique" /> : null}
      {slugKey === "about" ? <AboutSection resort={resort} /> : null}
      {slugKey === "contact" ? <BookingSection resort={resort} buttonClassName="bg-[#d9c49e] text-[#18352f]" /> : null}
      {["dining", "promotions", "blog"].includes(slugKey) ? <EditorialPlaceholder resort={resort} page={page} /> : null}
      {!["rooms", "experiences", "gallery", "reviews", "about", "contact", "dining", "promotions", "blog"].includes(slugKey) ? <EditorialPlaceholder resort={resort} page={page} /> : null}
      {slugKey !== "contact" ? <BookingSection resort={resort} buttonClassName="bg-[#d9c49e] text-[#18352f]" /> : null}
      <FooterSection resort={resort} />
      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}

function SubPageHero({ resort, page }: ResortSubPageProps) {
  const design = designTokensFor(resort.design_settings);
  const heroImageUrl = page.hero_image_url || resort.hero_image_url || resort.gallery[0] || null;

  return (
    <section className={`relative overflow-hidden px-5 py-16 sm:px-6 lg:py-24 ${heroImageUrl ? "text-white" : ""}`} style={{ backgroundColor: design.colors.section }}>
      {heroImageUrl ? (
        <>
          <Image src={heroImageUrl} alt={`${page.title} at ${resort.name}`} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#18352f]/62" />
        </>
      ) : null}
      <div className="relative mx-auto max-w-6xl">
        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${heroImageUrl ? "text-white/72" : "text-[#6f7f57]"}`}>{resort.name}</p>
        <h1 className={`mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl ${design.headingClassName}`} style={{ color: heroImageUrl ? "white" : design.colors.text }}>
          {page.title}
        </h1>
        <p className={`mt-5 max-w-2xl text-base leading-8 ${design.bodyClassName}`} style={{ color: heroImageUrl ? "rgba(255,255,255,0.78)" : design.colors.muted }}>
          {page.seo_description || `Explore ${page.title.toLowerCase()} at ${resort.name}, then continue your reservation directly with the host.`}
        </p>
      </div>
    </section>
  );
}

function EditorialPlaceholder({ resort, page }: ResortSubPageProps) {
  const design = designTokensFor(resort.design_settings);

  return (
    <section className="px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">{page.page_type}</p>
          <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>
            {page.title} content is ready for your next update.
          </h2>
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-white p-6 shadow-[0_18px_50px_rgba(52,43,31,0.06)]">
          <p className={`text-base leading-8 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>
            This page is published in the site structure. Add dedicated content from the Travelseed dashboard to turn it into a complete direct-booking page for {resort.name}.
          </p>
          <a
            href={`/${resort.slug}#booking`}
            className={`mt-6 inline-flex min-h-11 items-center px-5 text-sm font-semibold ${design.buttonClassName}`}
            style={{ backgroundColor: design.colors.primary, color: "white" }}
          >
            Start a direct inquiry
          </a>
        </div>
      </div>
    </section>
  );
}
