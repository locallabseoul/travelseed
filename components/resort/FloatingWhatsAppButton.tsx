import { TrackedWhatsAppLink } from "@/components/resort/TrackedWhatsAppLink";
import { createDefaultBookingMessage, createWhatsAppBookingUrl } from "@/lib/whatsapp";
import type { Resort } from "@/types/resort";

export function FloatingWhatsAppButton({ resort }: { resort: Resort }) {
  const bookingUrl = createWhatsAppBookingUrl(resort.whatsapp_number, resort.booking_message_template || createDefaultBookingMessage(resort.name));

  return (
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      <TrackedWhatsAppLink
        href={bookingUrl}
        resortId={resort.id}
        source="floating_whatsapp"
        target="_blank"
        rel="noreferrer"
        aria-label="Open WhatsApp"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] p-0 text-white shadow-[0_18px_50px_rgba(24,53,47,0.28)] ring-1 ring-white/40 transition hover:scale-105 sm:h-16 sm:w-16"
      >
        <WhatsAppGlyph />
      </TrackedWhatsAppLink>
    </div>
  );
}

function WhatsAppGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 sm:h-11 sm:w-11">
      <path fill="#ffffff" d="M12.04 3.5a8.45 8.45 0 0 0-7.16 12.94L4 20.5l4.16-1.08a8.45 8.45 0 1 0 3.88-15.92Zm0 15.36a6.86 6.86 0 0 1-3.5-.96l-.25-.15-2.47.64.52-2.4-.16-.25a6.86 6.86 0 1 1 5.86 3.12Z" />
      <path fill="#ffffff" d="M15.88 13.7c-.22-.11-1.3-.64-1.5-.71-.2-.08-.35-.11-.5.11-.14.22-.56.71-.69.85-.13.15-.25.16-.47.06-.22-.11-.93-.34-1.77-1.09a6.62 6.62 0 0 1-1.22-1.51c-.13-.22-.01-.34.1-.45.1-.1.22-.25.33-.38.11-.13.15-.22.22-.37.07-.14.04-.27-.02-.38-.05-.11-.5-1.18-.68-1.62-.18-.42-.36-.36-.5-.37h-.42c-.15 0-.38.05-.58.27-.2.22-.76.74-.76 1.8 0 1.07.78 2.1.89 2.24.11.15 1.54 2.35 3.72 3.29.52.23.92.36 1.24.46.52.17.99.14 1.36.09.42-.06 1.3-.53 1.48-1.04.18-.51.18-.95.13-1.04-.06-.09-.2-.14-.42-.25Z" />
    </svg>
  );
}
