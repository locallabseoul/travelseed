import Image from "next/image";
import { FooterSection } from "@/components/resort/FooterSection";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import { ServiceSection } from "@/components/resort/ServiceSection";
import { TrackedWhatsAppLink } from "@/components/resort/TrackedWhatsAppLink";
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

// Minimal stay template for quiet boutique stays, long-stay rentals, and calm design-led properties.
export function MinimalStayTemplate({ resort }: TemplateProps) {
  const bookingUrl = bookingUrlFor(resort);
  const heroImage = resort.hero_image_url || resort.gallery[0];
  const stayDetails = [
    resort.capacity ? `${resort.capacity} guests` : null,
    resort.bedrooms ? `${resort.bedrooms} bedrooms` : null,
    resort.bathrooms ? `${resort.bathrooms} bathrooms` : null,
  ].filter(Boolean);

  return (
    <main className="bg-[#f8f6f0] text-[#202724]">
      <ResortNavigation resort={resort} variant="minimal" />

      <section className="px-5 pb-16 pt-8 sm:px-6 lg:pb-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a715d]">{resort.location}</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.02] sm:text-6xl">{resort.hero_title}</h1>
            {resort.hero_subtitle ? (
              <p className="mt-6 text-lg leading-8 text-[#5b625e]">{resort.hero_subtitle}</p>
            ) : null}
            {stayDetails.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {stayDetails.map((detail) => (
                  <span key={detail} className="rounded-full border border-[#d8cebb] px-4 py-2 text-sm text-[#4f564f]">
                    {detail}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative min-h-[520px] overflow-hidden rounded-md bg-[#ded7c9]">
            {heroImage ? (
              <Image src={heroImage} alt={resort.name} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#ded7c9,#9a8f78)]" />
            )}
          </div>
        </div>
      </section>

      <section id="about" className="bg-white px-5 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a715d]">
              {resort.type ?? "Minimal stay"}
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">A slower way to arrive.</h2>
          </div>
          <div>
            <p className="text-lg leading-9 text-[#555d58]">
              {resort.description ??
                `${resort.name} is a quiet direct-booking stay for guests who care about calm spaces, practical comfort, and a more personal reservation experience.`}
            </p>
            <div id="features" className="mt-10 grid gap-3 sm:grid-cols-2">
              {resort.features.map((feature) => (
                <div key={feature} className="border-t border-[#ddd6c9] py-5 text-base font-medium">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {resort.gallery.length > 0 ? (
        <section id="gallery" className="px-5 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a715d]">Gallery</p>
                <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Rooms, light, and simple details.</h2>
              </div>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {resort.gallery.slice(0, 4).map((imageUrl, index) => (
                <div key={imageUrl} className={index === 0 ? "relative min-h-[430px] overflow-hidden rounded-md sm:row-span-2" : "relative min-h-[210px] overflow-hidden rounded-md"}>
                  <Image src={imageUrl} alt={`${resort.name} minimal gallery ${index + 1}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ServiceSection resort={resort} />

      {resort.experiences.length > 0 ? (
        <section id="experiences" className="bg-white px-5 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a715d]">Nearby</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">A quiet base with everything close enough.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resort.experiences.map((experience) => (
                <div key={experience} className="rounded-md bg-[#f8f6f0] p-6 text-base font-medium text-[#202724]">
                  {experience}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="booking" className="px-5 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 border-y border-[#d8cebb] py-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a715d]">Direct booking</p>
            <h2 className="mt-4 text-4xl font-semibold">Book Direct & Save</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#555d58]">
              Send a clear WhatsApp inquiry and reserve directly with the host.
            </p>
          </div>
          <TrackedWhatsAppLink href={bookingUrl} resortId={resort.id} source="booking_cta" target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-md bg-[#202724] px-8 text-base font-semibold text-white">
            Book on WhatsApp
          </TrackedWhatsAppLink>
        </div>
      </section>

      <FooterSection resort={resort} />
    </main>
  );
}
