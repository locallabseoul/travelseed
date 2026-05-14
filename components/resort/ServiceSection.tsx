"use client";

import Image from "next/image";
import { useRef } from "react";
import { designTokensFor } from "@/lib/design-settings";
import type { Resort, ResortServiceKind } from "@/types/resort";

type ServiceSectionProps = {
  resort: Resort;
  variant?: "boutique" | "surf" | "minimal";
};

const sectionCopy = {
  boutique: {
    eyebrow: "Stay options",
    title: "Choose the room, package, or service that fits your stay.",
    sectionClassName: "bg-[#fbf8f1]",
    cardClassName: "rounded-md border border-[#e9dfcf] bg-white shadow-[0_18px_50px_rgba(52,43,31,0.06)]",
    badgeClassName: "bg-[#e6f0e7] text-[#1f5a45]",
    accentClassName: "text-[#18352f]",
  },
  surf: {
    eyebrow: "Camps & add-ons",
    title: "Build your active beach stay around the right package.",
    sectionClassName: "bg-[#eef9f6]",
    cardClassName: "rounded-md border border-cyan-100 bg-white shadow-[0_18px_50px_rgba(12,47,53,0.08)]",
    badgeClassName: "bg-[#e4fbff] text-[#0b7380]",
    accentClassName: "text-[#0c2f35]",
  },
  minimal: {
    eyebrow: "Rooms & services",
    title: "Simple options, clearly presented.",
    sectionClassName: "bg-[#f8f6f0]",
    cardClassName: "rounded-md border border-[#ddd6c9] bg-white",
    badgeClassName: "bg-[#f4efe4] text-[#4f564f]",
    accentClassName: "text-[#202724]",
  },
};

const groupCopy: Record<ResortServiceKind, { eyebrow: string; title: string }> = {
  room: {
    eyebrow: "Rooms",
    title: "Stay options",
  },
  package: {
    eyebrow: "Packages",
    title: "Ready-made booking packages",
  },
  service: {
    eyebrow: "Services",
    title: "Add-ons and local services",
  },
};

const groupOrder: ResortServiceKind[] = ["room", "package", "service"];

function servicesByKind(services: NonNullable<Resort["services"]>) {
  return groupOrder
    .map((kind) => ({
      kind,
      services: services.filter((service) => service.kind === kind),
    }))
    .filter((group) => group.services.length > 0);
}

export function ServiceSection({ resort, variant = "boutique" }: ServiceSectionProps) {
  const services = (resort.services ?? []).filter((service) => service.is_active);
  const groupedServices = servicesByKind(services);
  const copy = sectionCopy[variant];
  const design = designTokensFor(resort.design_settings);

  if (services.length === 0) {
    return null;
  }

  return (
    <section id="services" className={`${copy.sectionClassName} px-5 py-16 sm:px-6 lg:py-24`} style={{ backgroundColor: design.colors.section }}>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">{copy.eyebrow}</p>
          <h2 className={`mt-4 text-3xl font-semibold leading-tight sm:text-4xl ${copy.accentClassName} ${design.headingClassName}`} style={{ color: design.colors.text }}>{copy.title}</h2>
        </div>
        <div className="mt-10 grid gap-12">
          {groupedServices.map((group) => (
            <ServiceRail key={group.kind} group={group} copy={copy} design={design} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceRail({
  group,
  copy,
  design,
}: {
  group: ReturnType<typeof servicesByKind>[number];
  copy: (typeof sectionCopy)[keyof typeof sectionCopy];
  design: ReturnType<typeof designTokensFor>;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    rail.scrollBy({
      left: direction * rail.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 border-t border-[#d8cebb] pt-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f7f57]">{groupCopy[group.kind].eyebrow}</p>
          <h3 className={`mt-2 text-2xl font-semibold ${copy.accentClassName} ${design.headingClassName}`} style={{ color: design.colors.text }}>{groupCopy[group.kind].title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#6b6a5f]">{group.services.length} option{group.services.length === 1 ? "" : "s"}</p>
          {group.services.length > 3 ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => scrollRail(-1)} aria-label={`Previous ${groupCopy[group.kind].eyebrow}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-semibold text-[#18352f] shadow-sm ring-1 ring-[#d8cebb]">
                {"<"}
              </button>
              <button type="button" onClick={() => scrollRail(1)} aria-label={`Next ${groupCopy[group.kind].eyebrow}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-semibold text-[#18352f] shadow-sm ring-1 ring-[#d8cebb]">
                {">"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div ref={railRef} className="mt-5 flex snap-x gap-5 overflow-x-auto scroll-smooth pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {group.services.map((service) => (
          <article key={service.id} className={`w-[82vw] flex-none snap-start overflow-hidden sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] ${copy.cardClassName} ${design.imageStyle === "Postcard" ? "p-2" : ""}`}>
            {service.image_url ? (
              <div className={`relative aspect-[4/3] bg-[#e8ddc8] ${design.imageClassName}`}>
                <Image src={service.image_url} alt={service.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 82vw" className="object-cover" />
              </div>
            ) : null}
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                {service.highlight ? <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: design.colors.primary }}>{service.highlight}</span> : null}
                {service.capacity ? <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#18352f]">{service.capacity} guests</span> : null}
                {service.duration ? <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#18352f]">{service.duration}</span> : null}
              </div>
              <h3 className={`mt-4 text-xl font-semibold ${copy.accentClassName} ${design.headingClassName}`} style={{ color: design.colors.text }}>{service.title}</h3>
              {service.description ? <p className={`mt-3 text-sm leading-6 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>{service.description}</p> : null}
              {service.included && service.included.length > 0 ? (
                <ul className="mt-4 grid gap-2 text-sm text-[#536159]">
                  {service.included.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#6f7f57]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {service.price_label ? <p className="mt-5 text-sm font-semibold text-[#18352f]">{service.price_label}</p> : null}
              <a href="#booking" className={`mt-5 inline-flex min-h-10 items-center px-4 text-sm font-semibold ${design.buttonClassName}`} style={{ backgroundColor: design.buttonStyle === "Soft Outline" ? "transparent" : design.colors.primary, borderColor: design.colors.primary, color: design.buttonStyle === "Soft Outline" ? design.colors.primary : "white" }}>
                {service.cta_label || "Ask availability"}
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
