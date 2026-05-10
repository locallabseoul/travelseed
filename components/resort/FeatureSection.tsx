import type { Resort } from "@/types/resort";

type FeatureSectionProps = {
  resort: Resort;
};

// Summarizes key stay details and amenities for quick scanning.
export function FeatureSection({ resort }: FeatureSectionProps) {
  return (
    <section id="features" className="bg-white px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">
            {resort.type ?? "Stay features"}
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#18352f] sm:text-4xl">
            Everything you need, nothing that gets in the way.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resort.features.map((feature) => (
            <div
              key={feature}
              className="rounded-md border border-[#e9dfcf] bg-[#fbf8f1] p-5 shadow-[0_18px_50px_rgba(52,43,31,0.06)]"
            >
              <div className="mb-8 h-1.5 w-10 rounded-full bg-[#9e7d4d]" />
              <p className="text-base font-medium text-[#18352f]">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
