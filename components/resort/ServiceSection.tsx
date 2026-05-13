import Image from "next/image";
import type { Resort } from "@/types/resort";

type ServiceSectionProps = {
  resort: Resort;
};

export function ServiceSection({ resort }: ServiceSectionProps) {
  const services = (resort.services ?? []).filter((service) => service.is_active);

  if (services.length === 0) {
    return null;
  }

  return (
    <section id="services" className="bg-[#fbf8f1] px-5 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">Rooms & services</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#18352f] sm:text-4xl">
            Choose the stay, package, or service that fits your trip.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="overflow-hidden rounded-md border border-[#e9dfcf] bg-white shadow-[0_18px_50px_rgba(52,43,31,0.06)]">
              {service.image_url ? (
                <div className="relative aspect-[4/3] bg-[#e8ddc8]">
                  <Image src={service.image_url} alt={service.title} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
              ) : null}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#e6f0e7] px-3 py-1 text-xs font-semibold capitalize text-[#1f5a45]">{service.kind}</span>
                  {service.capacity ? <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#18352f]">{service.capacity} guests</span> : null}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#18352f]">{service.title}</h3>
                {service.description ? <p className="mt-3 text-sm leading-6 text-[#6b6a5f]">{service.description}</p> : null}
                {service.price_label ? <p className="mt-5 text-sm font-semibold text-[#18352f]">{service.price_label}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
