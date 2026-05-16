import type { Resort } from "@/types/resort";
import { designTokensFor } from "@/lib/design-settings";

type ExperienceSectionProps = {
  resort: Resort;
};

// Highlights nearby activities and stay themes.
export function ExperienceSection({ resort }: ExperienceSectionProps) {
  const design = designTokensFor(resort.design_settings);

  if (resort.experiences.length === 0) {
    return null;
  }

  return (
    <section id="experiences" className="px-5 py-16 sm:px-6 lg:py-24" style={{ backgroundColor: design.colors.page }}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>
          Nearby experiences
        </p>
        <h2 className={`mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>
          Close to the best of the coast, cafes, and slow Lombok living.
        </h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {resort.experiences.map((experience) => (
            <div
              key={experience}
              className="rounded-full border px-5 py-4 text-center text-sm font-medium"
              style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent, color: design.colors.text }}
            >
              {experience}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
