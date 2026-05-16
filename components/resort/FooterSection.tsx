import type { Resort } from "@/types/resort";
import { designTokensFor } from "@/lib/design-settings";

type FooterSectionProps = {
  resort: Resort;
};

// Keeps tenant identity visible at the end of every generated website.
export function FooterSection({ resort }: FooterSectionProps) {
  const design = designTokensFor(resort.design_settings);

  return (
    <footer className="px-5 py-10 sm:px-6" style={{ backgroundColor: design.colors.primary, color: design.colors.buttonText }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">{resort.name}</p>
          <p className="text-sm opacity-70">{resort.location}</p>
        </div>
        <p className="text-sm opacity-55">Direct booking website powered by Travelseed</p>
      </div>
    </footer>
  );
}
