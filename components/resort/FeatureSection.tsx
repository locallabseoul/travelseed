import type { Resort } from "@/types/resort";
import { designTokensFor } from "@/lib/design-settings";

type FeatureSectionProps = {
  resort: Resort;
};

// Summarizes key stay details and amenities for quick scanning.
export function FeatureSection({ resort }: FeatureSectionProps) {
  const design = designTokensFor(resort.design_settings);

  return (
    <section id="features" className="px-5 py-16 sm:px-6 lg:py-24" style={{ backgroundColor: design.colors.page }}>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>
            {resort.type ?? "Stay features"}
          </p>
          <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>
            Everything you need, nothing that gets in the way.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resort.features.map((feature) => (
            <div
              key={feature}
              className="rounded-md border p-5 shadow-[0_18px_50px_rgba(52,43,31,0.06)]"
              style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent }}
            >
              <div className="mb-8 h-1.5 w-10 rounded-full" style={{ backgroundColor: design.colors.accent }} />
              <p className="text-base font-medium" style={{ color: design.colors.text }}>{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
