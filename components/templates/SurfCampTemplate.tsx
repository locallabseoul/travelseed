import Image from "next/image";
import { FooterSection } from "@/components/resort/FooterSection";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import { ServiceSection } from "@/components/resort/ServiceSection";
import { TrackedWhatsAppLink } from "@/components/resort/TrackedWhatsAppLink";
import { designTokensFor } from "@/lib/design-settings";
import { createDefaultBookingMessage, createWhatsAppBookingUrl } from "@/lib/whatsapp";
import type { Resort } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

function bookingUrlFor(resort: Resort) {
  return createWhatsAppBookingUrl(
    resort.whatsapp_number,
    resort.booking_message_template || createDefaultBookingMessage(resort.name),
  );
}

// Surf camp template for energetic beach stays, camps, retreats, and activity-led resorts.
export function SurfCampTemplate({ resort }: TemplateProps) {
  const design = designTokensFor(resort.design_settings);
  const bookingUrl = bookingUrlFor(resort);
  const featuredImage = resort.hero_image_url || resort.gallery[0];
  const stats = [
    resort.capacity ? { label: "Guests", value: resort.capacity } : null,
    resort.bedrooms ? { label: "Rooms", value: resort.bedrooms } : null,
    resort.bathrooms ? { label: "Baths", value: resort.bathrooms } : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;

  return (
    <main className="text-[#0c2f35]" style={{ backgroundColor: design.colors.page }}>
      <section className="relative overflow-hidden px-5 pb-12 pt-6 text-white sm:px-6 lg:pb-16" style={{ backgroundColor: design.colors.primary }}>
        <div className="-mx-5 -mt-6 sm:-mx-6">
          <ResortNavigation resort={resort} variant="light" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 pt-10 sm:pt-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:pt-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-100">{resort.location}</p>
            <h1 className={`mt-5 text-4xl font-black leading-[0.98] sm:text-5xl lg:text-6xl ${design.headingClassName}`}>
              {resort.hero_title}
            </h1>
            {resort.hero_subtitle ? (
              <p className="mt-6 max-w-xl text-lg leading-8 text-cyan-50">{resort.hero_subtitle}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#booking"
                className={`inline-flex min-h-13 items-center px-6 text-sm font-bold ${design.buttonClassName}`}
                style={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.accent, borderColor: design.colors.accent, color: design.buttonStyle === "Soft Outline" ? design.colors.accent : design.colors.buttonText }}
              >
                Book Direct & Save
              </a>
              <a
                href="#experiences"
                className={`inline-flex min-h-13 items-center border border-white/35 px-6 text-sm font-bold text-white ${design.buttonClassName}`}
              >
                See experiences
              </a>
            </div>
          </div>

          <div className={`relative min-h-[320px] overflow-hidden bg-[#063e48] shadow-[0_30px_100px_rgba(4,43,50,0.35)] sm:min-h-[380px] lg:min-h-[440px] ${design.imageClassName}`}>
            {featuredImage ? (
              <Image src={featuredImage} alt={resort.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#0b5f6f,#6ed4d8)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#063e48]/70 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-md bg-white/90 p-4 text-[#0c2f35] backdrop-blur">
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="px-5 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0b7380]">
              {resort.type ?? "Surf camp stay"}
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Wake up close to the breaks.</h2>
          </div>
          <p className="text-lg leading-9 text-[#31585f]">
            {resort.description ??
              `${resort.name} is built for guests who want easy beach access, simple comfort, and a direct line to the host before they arrive.`}
          </p>
        </div>
      </section>

      <section id="features" className="bg-white px-5 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0b7380]">Camp essentials</p>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">Everything set up for active days.</h2>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resort.features.map((feature) => (
              <div key={feature} className="rounded-md border border-cyan-100 bg-[#f5fbf8] p-5">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0b7380]">Included</p>
                <p className="mt-8 text-lg font-black">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {resort.gallery.length > 0 ? (
        <section id="gallery" className="px-5 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0b7380]">Gallery</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resort.gallery.slice(0, 6).map((imageUrl, index) => (
                <div key={imageUrl} className={`${index === 0 ? "relative min-h-80 overflow-hidden sm:col-span-2" : "relative min-h-64 overflow-hidden"} ${design.imageClassName}`}>
                  <Image src={imageUrl} alt={`${resort.name} surf gallery ${index + 1}`} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {resort.experiences.length > 0 ? (
        <section id="experiences" className="bg-[#0c2f35] px-5 py-16 text-white sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f6d365]">Nearby experiences</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">Beach days, local rhythm, and the next session.</h2>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {resort.experiences.map((experience) => (
                <div key={experience} className="rounded-md border border-white/15 bg-white/8 p-5 text-sm font-bold">
                  {experience}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ServiceSection resort={resort} variant="surf" />

      <section id="booking" className="bg-[#f6d365] px-5 py-16 sm:px-6 lg:py-20">
        <div className={`mx-auto flex max-w-6xl flex-col gap-8 bg-white p-7 shadow-[0_24px_90px_rgba(12,47,53,0.14)] sm:p-10 lg:flex-row lg:items-center lg:justify-between ${design.imageClassName}`}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0b7380]">Direct booking</p>
            <h2 className="mt-4 text-4xl font-black text-[#0c2f35]">Book Direct & Save</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#31585f]">
              Ask about dates, airport pickup, and surf-friendly stays directly on WhatsApp.
            </p>
          </div>
          <TrackedWhatsAppLink href={bookingUrl} resortId={resort.id} source="booking_cta" target="_blank" rel="noreferrer" className={`inline-flex min-h-14 items-center justify-center px-8 text-base font-black ${design.buttonClassName}`} style={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.primary, borderColor: design.colors.primary, color: design.buttonStyle === "Soft Outline" ? design.colors.primary : "white" }}>
            Book on WhatsApp
          </TrackedWhatsAppLink>
        </div>
      </section>

      <FooterSection resort={resort} />
    </main>
  );
}
