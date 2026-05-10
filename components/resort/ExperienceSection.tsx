import type { Resort } from "@/types/resort";

type ExperienceSectionProps = {
  resort: Resort;
};

// Highlights nearby activities and stay themes.
export function ExperienceSection({ resort }: ExperienceSectionProps) {
  if (resort.experiences.length === 0) {
    return null;
  }

  return (
    <section id="experiences" className="bg-white px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">
          Nearby experiences
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[#18352f] sm:text-4xl">
          Close to the best of the coast, cafes, and slow Lombok living.
        </h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {resort.experiences.map((experience) => (
            <div
              key={experience}
              className="rounded-full border border-[#d9ccb8] bg-[#fbf8f1] px-5 py-4 text-center text-sm font-medium text-[#18352f]"
            >
              {experience}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
