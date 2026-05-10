import type { Resort } from "@/types/resort";

type AboutSectionProps = {
  resort: Resort;
};

// Introduces the resort story with stay capacity details.
export function AboutSection({ resort }: AboutSectionProps) {
  const details = [
    resort.capacity ? { label: "Guests", value: resort.capacity } : null,
    resort.bedrooms ? { label: "Bedrooms", value: resort.bedrooms } : null,
    resort.bathrooms ? { label: "Bathrooms", value: resort.bathrooms } : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;

  return (
    <section id="about" className="bg-[#fbf8f1] px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">
            About the villa
          </p>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-[#18352f] sm:text-4xl">
            A quiet tropical base for slow mornings, beach days, and private evenings.
          </h2>
        </div>
        <div className="rounded-md border border-[#e7ddca] bg-white/75 p-6 shadow-[0_24px_80px_rgba(52,43,31,0.08)] sm:p-8">
          <p className="text-base leading-8 text-[#43524a]">
            {resort.description ??
              `${resort.name} is a direct-booking stay in ${resort.location}, designed for guests who want privacy, comfort, and a more personal way to reserve.`}
          </p>
          {details.length > 0 ? (
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#eadfce] pt-6">
              {details.map((detail) => (
                <div key={detail.label}>
                  <p className="text-2xl font-semibold text-[#18352f]">{detail.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7b735f]">
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
