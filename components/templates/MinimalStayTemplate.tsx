import Image from "next/image";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { FooterSection } from "@/components/resort/FooterSection";
import { ReviewSection } from "@/components/resort/ReviewSection";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import { ServiceSection } from "@/components/resort/ServiceSection";
import { designTokensFor } from "@/lib/design-settings";
import { isSiteSectionEnabled } from "@/lib/site-structure";
import type { Resort } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

// Minimal stay template for quiet boutique stays, long-stay rentals, and calm design-led properties.
export function MinimalStayTemplate({ resort }: TemplateProps) {
  const design = designTokensFor(resort.design_settings);
  const heroImage = resort.hero_image_url || resort.gallery[0];
  const showAbout = isSiteSectionEnabled(resort, "about");
  const showFacilities = isSiteSectionEnabled(resort, "facilities");
  const showRooms = isSiteSectionEnabled(resort, "rooms");
  const showReviews = isSiteSectionEnabled(resort, "reviews");
  const showGallery = isSiteSectionEnabled(resort, "gallery");
  const showExperiences = isSiteSectionEnabled(resort, "experiences");
  const showContact = isSiteSectionEnabled(resort, "contact");
  const stayDetails = [
    resort.capacity ? `${resort.capacity} guests` : null,
    resort.bedrooms ? `${resort.bedrooms} bedrooms` : null,
    resort.bathrooms ? `${resort.bathrooms} bathrooms` : null,
  ].filter(Boolean);

  return (
    <main style={{ backgroundColor: design.colors.page, color: design.colors.text }}>
      <ResortNavigation resort={resort} variant="minimal" />

      <section className="px-5 pb-16 pt-8 sm:px-6 lg:pb-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>{resort.location}</p>
            <h1 className={`mt-5 text-5xl font-semibold leading-[1.02] sm:text-6xl ${design.headingClassName}`} style={{ color: design.colors.text }}>{resort.hero_title}</h1>
            {resort.hero_subtitle ? (
              <p className={`mt-6 text-lg leading-8 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>{resort.hero_subtitle}</p>
            ) : null}
            {stayDetails.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {stayDetails.map((detail) => (
                  <span key={detail} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: design.colors.accent, color: design.colors.muted }}>
                    {detail}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className={`relative min-h-[520px] overflow-hidden ${design.imageClassName}`} style={{ backgroundColor: design.colors.accent }}>
            {heroImage ? (
              <Image src={heroImage} alt={resort.name} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${design.colors.section}, ${design.colors.accent})` }} />
            )}
          </div>
        </div>
      </section>

      {showAbout || showFacilities ? (
        <section id="about" className="px-5 py-16 sm:px-6 lg:py-24" style={{ backgroundColor: design.colors.page }}>
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>
                {resort.type ?? "Minimal stay"}
              </p>
              <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>A slower way to arrive.</h2>
            </div>
            <div>
              {showAbout ? (
                <p className={`text-lg leading-9 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>
                  {resort.description ??
                    `${resort.name} is a quiet direct-booking stay for guests who care about calm spaces, practical comfort, and a more personal reservation experience.`}
                </p>
              ) : null}
              {showFacilities ? (
                <div id="features" className="mt-10 grid gap-3 sm:grid-cols-2">
                  {resort.features.map((feature) => (
                    <div key={feature} className="border-t py-5 text-base font-medium" style={{ borderColor: design.colors.accent, color: design.colors.text }}>
                      {feature}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showGallery && resort.gallery.length > 0 ? (
        <section id="gallery" className="px-5 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>Gallery</p>
                <h2 className={`mt-4 text-3xl font-semibold sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>Rooms, light, and simple details.</h2>
              </div>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {resort.gallery.slice(0, 4).map((imageUrl, index) => (
                <div key={imageUrl} className={`${index === 0 ? "relative min-h-[430px] overflow-hidden sm:row-span-2" : "relative min-h-[210px] overflow-hidden"} ${design.imageClassName}`}>
                  <Image src={imageUrl} alt={`${resort.name} minimal gallery ${index + 1}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showRooms ? <ServiceSection resort={resort} variant="minimal" /> : null}
      {showReviews ? <ReviewSection resort={resort} variant="minimal" /> : null}

      {showExperiences && resort.experiences.length > 0 ? (
        <section id="experiences" className="px-5 py-16 sm:px-6 lg:py-24" style={{ backgroundColor: design.colors.page }}>
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>Nearby</p>
            <h2 className={`mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>A quiet base with everything close enough.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resort.experiences.map((experience) => (
                <div key={experience} className="rounded-md p-6 text-base font-medium" style={{ backgroundColor: design.colors.section, color: design.colors.text }}>
                  {experience}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showContact ? (
        <section id="booking" className="px-5 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto grid max-w-6xl gap-8 border-y py-12 lg:grid-cols-[1fr_0.8fr] lg:items-center" style={{ borderColor: design.colors.accent }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>Direct booking</p>
              <h2 className={`mt-4 text-4xl font-semibold ${design.headingClassName}`} style={{ color: design.colors.text }}>Book Direct & Save</h2>
              <p className={`mt-4 max-w-2xl text-base leading-7 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>
                Send a clear WhatsApp inquiry and reserve directly with the host.
              </p>
            </div>
            <BookingInquiryModal
              resort={resort}
              source="booking_cta"
              buttonClassName={`w-full ${design.buttonClassName}`}
              buttonStyle={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.primary, borderColor: design.colors.primary, color: design.buttonStyle === "Soft Outline" ? design.colors.primary : "white" }}
            />
          </div>
        </section>
      ) : null}

      <FooterSection resort={resort} />
      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}
