import { AboutSection } from "@/components/resort/AboutSection";
import { BookingSection } from "@/components/resort/BookingSection";
import { ExperienceSection } from "@/components/resort/ExperienceSection";
import { FeatureSection } from "@/components/resort/FeatureSection";
import { FloatingWhatsAppButton } from "@/components/resort/FloatingWhatsAppButton";
import { FooterSection } from "@/components/resort/FooterSection";
import { GallerySection } from "@/components/resort/GallerySection";
import { HeroSection } from "@/components/resort/HeroSection";
import { ReviewSection } from "@/components/resort/ReviewSection";
import { ServiceSection } from "@/components/resort/ServiceSection";
import { designTokensFor } from "@/lib/design-settings";
import { isSiteSectionEnabled } from "@/lib/site-structure";
import type { Resort } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

// Boutique villa template for private, design-led stays.
export function BoutiqueVillaTemplate({ resort }: TemplateProps) {
  const design = designTokensFor(resort.design_settings);
  const showAbout = isSiteSectionEnabled(resort, "about");
  const showFacilities = isSiteSectionEnabled(resort, "facilities");
  const showRooms = isSiteSectionEnabled(resort, "rooms");
  const showReviews = isSiteSectionEnabled(resort, "reviews");
  const showGallery = isSiteSectionEnabled(resort, "gallery");
  const showExperiences = isSiteSectionEnabled(resort, "experiences");
  const showContact = isSiteSectionEnabled(resort, "contact");

  return (
    <main style={{ backgroundColor: design.colors.page }}>
      <HeroSection resort={resort} accentClassName="bg-forest" />
      {showAbout ? <AboutSection resort={resort} /> : null}
      {showFacilities ? <FeatureSection resort={resort} /> : null}
      {showRooms ? <ServiceSection resort={resort} variant="boutique" /> : null}
      {showReviews ? <ReviewSection resort={resort} variant="boutique" /> : null}
      {showGallery ? <GallerySection resort={resort} /> : null}
      {showExperiences ? <ExperienceSection resort={resort} /> : null}
      {showContact ? <BookingSection resort={resort} buttonClassName="bg-[#d9c49e] text-[#18352f]" /> : null}
      <FooterSection resort={resort} />
      <FloatingWhatsAppButton resort={resort} />
    </main>
  );
}
