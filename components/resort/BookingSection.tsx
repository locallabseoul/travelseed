import type { Resort } from "@/types/resort";
import { createDefaultBookingMessage, createWhatsAppBookingUrl } from "@/lib/whatsapp";
import { TrackedWhatsAppLink } from "@/components/resort/TrackedWhatsAppLink";

type BookingSectionProps = {
  resort: Resort;
  buttonClassName?: string;
};

// Creates the primary direct-booking call to action through WhatsApp.
export function BookingSection({ resort, buttonClassName = "bg-forest text-white" }: BookingSectionProps) {
  const message = resort.booking_message_template || createDefaultBookingMessage(resort.name);
  const bookingUrl = createWhatsAppBookingUrl(resort.whatsapp_number, message);

  return (
    <section id="booking" className="bg-[#fbf8f1] px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 overflow-hidden rounded-md bg-[#18352f] p-7 text-white shadow-[0_28px_90px_rgba(24,53,47,0.22)] sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9c49e]">
            WhatsApp direct booking
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Book Direct & Save</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/76">
            Send a prefilled inquiry and continue the reservation directly with the host for the best available direct-booking terms.
          </p>
        </div>
        <div className="rounded-md border border-white/12 bg-white/8 p-5 backdrop-blur">
          <p className="text-sm leading-6 text-white/70">Ready to check dates for {resort.name}?</p>
          <TrackedWhatsAppLink
            href={bookingUrl}
            resortId={resort.id}
            source="booking_cta"
            target="_blank"
            rel="noreferrer"
            className={`mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full px-7 text-base font-semibold ${buttonClassName}`}
          >
            Book on WhatsApp
          </TrackedWhatsAppLink>
        </div>
      </div>
    </section>
  );
}
