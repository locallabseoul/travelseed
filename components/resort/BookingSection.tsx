import type { Resort } from "@/types/resort";
import { BookingInquiryModal } from "@/components/resort/BookingInquiryForm";
import { businessCategoryFromType } from "@/lib/business-categories";
import { designTokensFor } from "@/lib/design-settings";

type BookingSectionProps = {
  resort: Resort;
  buttonClassName?: string;
};

// Creates the primary customer inquiry call to action through WhatsApp.
export function BookingSection({ resort, buttonClassName = "" }: BookingSectionProps) {
  const design = designTokensFor(resort.design_settings);
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const accommodation = category.id === "accommodation";

  return (
    <section id="booking" className="px-5 py-16 sm:px-6 lg:py-24" style={{ backgroundColor: design.colors.section }}>
      <div className={`mx-auto grid max-w-6xl gap-8 overflow-hidden p-7 text-white shadow-[0_28px_90px_rgba(24,53,47,0.22)] sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center ${design.imageClassName}`} style={{ backgroundColor: design.colors.primary }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9c49e]">
            {category.inquiry.eyebrow}
          </p>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight sm:text-5xl ${design.headingClassName}`}>
            {accommodation ? "Book Direct & Save" : category.inquiry.title}
          </h2>
          <p className={`mt-5 max-w-2xl text-base leading-8 text-white/76 ${design.bodyClassName}`}>
            {accommodation
              ? "Send a prefilled inquiry and continue the reservation directly with the host for the best available direct-booking terms."
              : category.inquiry.body}
          </p>
        </div>
        <div className="rounded-md border border-white/12 bg-white/8 p-5 backdrop-blur">
          <p className="text-sm leading-6 text-white/70">{accommodation ? `Ready to check dates for ${resort.name}?` : `Ready to ${category.primaryCta.toLowerCase()} for ${resort.name}?`}</p>
          <BookingInquiryModal
            resort={resort}
            source="booking_cta"
            buttonClassName={`mt-5 w-full ${buttonClassName} ${design.buttonClassName}`}
            buttonStyle={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.accent, borderColor: design.colors.accent, color: design.buttonStyle === "Soft Outline" ? design.colors.accent : design.colors.buttonText }}
          />
        </div>
      </div>
    </section>
  );
}
