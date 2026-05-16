import type { Resort } from "@/types/resort";
import { designTokensFor } from "@/lib/design-settings";

type AboutSectionProps = {
  resort: Resort;
};

// Introduces the resort story with stay capacity details.
export function AboutSection({ resort }: AboutSectionProps) {
  const design = designTokensFor(resort.design_settings);
  const details = [
    resort.capacity ? { label: "Guests", value: resort.capacity } : null,
    resort.bedrooms ? { label: "Bedrooms", value: resort.bedrooms } : null,
    resort.bathrooms ? { label: "Bathrooms", value: resort.bathrooms } : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;

  return (
    <section id="about" className="px-5 py-16 sm:px-6 lg:py-24" style={{ backgroundColor: design.colors.section }}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>
            About the villa
          </p>
          <h2 className={`mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`} style={{ color: design.colors.text }}>
            A quiet tropical base for slow mornings, beach days, and private evenings.
          </h2>
        </div>
        <div className="rounded-md border bg-white/75 p-6 shadow-[0_24px_80px_rgba(52,43,31,0.08)] sm:p-8" style={{ borderColor: design.colors.accent }}>
          <p className={`text-base leading-8 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>
            {resort.description ??
              `${resort.name} is a direct-booking stay in ${resort.location}, designed for guests who want privacy, comfort, and a more personal way to reserve.`}
          </p>
          {details.length > 0 ? (
            <div className="mt-8 grid grid-cols-3 gap-3 border-t pt-6" style={{ borderColor: design.colors.accent }}>
              {details.map((detail) => (
                <div key={detail.label}>
                  <p className="text-2xl font-semibold" style={{ color: design.colors.text }}>{detail.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em]" style={{ color: design.colors.muted }}>
                    {detail.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
