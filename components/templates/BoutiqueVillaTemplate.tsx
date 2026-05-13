import { AboutSection } from "@/components/resort/AboutSection";
import { BookingSection } from "@/components/resort/BookingSection";
import { ExperienceSection } from "@/components/resort/ExperienceSection";
import { FeatureSection } from "@/components/resort/FeatureSection";
import { FooterSection } from "@/components/resort/FooterSection";
import { GallerySection } from "@/components/resort/GallerySection";
import { HeroSection } from "@/components/resort/HeroSection";
import { ServiceSection } from "@/components/resort/ServiceSection";
import type { Resort } from "@/types/resort";

type TemplateProps = {
  resort: Resort;
};

// Boutique villa template for private, design-led stays.
export function BoutiqueVillaTemplate({ resort }: TemplateProps) {
  return (
    <main className="bg-[#fbf8f1]">
      <HeroSection resort={resort} accentClassName="bg-forest" />
      <AboutSection resort={resort} />
      <FeatureSection resort={resort} />
      <ServiceSection resort={resort} />
      <GallerySection resort={resort} />
      <ExperienceSection resort={resort} />
      <BookingSection resort={resort} buttonClassName="bg-[#d9c49e] text-[#18352f]" />
      <FooterSection resort={resort} />
    </main>
  );
}
