import type { Resort, ResortContentTranslationPack, ResortContentTranslations } from "@/types/resort";

type TranslationSource = {
  resort: {
    name: string;
    location: string;
    type: string;
    description: string;
    hero_title: string;
    hero_subtitle: string;
    features: string[];
    experiences: string[];
    booking_message_template: string;
  };
  services: Record<string, {
    title: string;
    description: string;
    price_label: string;
    highlight: string;
    duration: string;
    included: string[];
    cta_label: string;
    bed_type: string;
    room_size: string;
    view_type: string;
    bathroom_info: string;
    room_amenities: string[];
  }>;
  pages: Record<string, {
    title: string;
    seo_title: string;
    seo_description: string;
    settings: Record<string, unknown>;
  }>;
  navigation_items: Record<string, {
    label: string;
  }>;
};

export function contentTranslationSource(resort: Resort): TranslationSource {
  return {
    resort: {
      name: resort.name,
      location: resort.location,
      type: resort.type ?? "",
      description: resort.description ?? "",
      hero_title: resort.hero_title,
      hero_subtitle: resort.hero_subtitle ?? "",
      features: resort.features ?? [],
      experiences: resort.experiences ?? [],
      booking_message_template: resort.booking_message_template ?? "",
    },
    services: Object.fromEntries((resort.services ?? []).map((service) => [
      service.id,
      {
        title: service.title,
        description: service.description ?? "",
        price_label: service.price_label ?? "",
        highlight: service.highlight ?? "",
        duration: service.duration ?? "",
        included: service.included ?? [],
        cta_label: service.cta_label ?? "",
        bed_type: service.bed_type ?? "",
        room_size: service.room_size ?? "",
        view_type: service.view_type ?? "",
        bathroom_info: service.bathroom_info ?? "",
        room_amenities: service.room_amenities ?? [],
      },
    ])),
    pages: Object.fromEntries((resort.pages ?? []).map((page) => [
      page.id,
      {
        title: page.title,
        seo_title: page.seo_title ?? "",
        seo_description: page.seo_description ?? "",
        settings: page.settings ?? {},
      },
    ])),
    navigation_items: Object.fromEntries((resort.navigation_items ?? []).map((item) => [
      item.id,
      { label: item.label },
    ])),
  };
}

export function contentTranslationHash(source: unknown) {
  const input = JSON.stringify(source);
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}

export function hasCurrentIndonesianTranslation(resort: Resort) {
  const source = contentTranslationSource(resort);
  const hash = contentTranslationHash(source);
  return resort.content_translations?.id?.sourceHash === hash;
}

export function applyContentTranslation(resort: Resort, locale: "id"): Resort {
  const pack = resort.content_translations?.[locale];
  if (!pack) {
    return resort;
  }

  return {
    ...resort,
    name: pack.resort.name || resort.name,
    location: pack.resort.location || resort.location,
    type: pack.resort.type || resort.type,
    description: pack.resort.description || resort.description,
    hero_title: pack.resort.hero_title || resort.hero_title,
    hero_subtitle: pack.resort.hero_subtitle || resort.hero_subtitle,
    features: pack.resort.features?.length ? pack.resort.features : resort.features,
    experiences: pack.resort.experiences?.length ? pack.resort.experiences : resort.experiences,
    booking_message_template: pack.resort.booking_message_template || resort.booking_message_template,
    services: (resort.services ?? []).map((service) => {
      const translated = pack.services?.[service.id];
      return translated ? {
        ...service,
        title: translated.title || service.title,
        description: translated.description || service.description,
        price_label: translated.price_label || service.price_label,
        highlight: translated.highlight || service.highlight,
        duration: translated.duration || service.duration,
        included: translated.included?.length ? translated.included : service.included,
        cta_label: translated.cta_label || service.cta_label,
        bed_type: translated.bed_type || service.bed_type,
        room_size: translated.room_size || service.room_size,
        view_type: translated.view_type || service.view_type,
        bathroom_info: translated.bathroom_info || service.bathroom_info,
        room_amenities: translated.room_amenities?.length ? translated.room_amenities : service.room_amenities,
      } : service;
    }),
    pages: (resort.pages ?? []).map((page) => {
      const translated = pack.pages?.[page.id];
      return translated ? {
        ...page,
        title: translated.title || page.title,
        seo_title: translated.seo_title || page.seo_title,
        seo_description: translated.seo_description || page.seo_description,
        settings: translated.settings ?? page.settings,
      } : page;
    }),
    navigation_items: (resort.navigation_items ?? []).map((item) => {
      const translated = pack.navigation_items?.[item.id];
      return translated ? {
        ...item,
        label: translated.label || item.label,
      } : item;
    }),
  };
}

export function nextContentTranslations(current: ResortContentTranslations | undefined, pack: ResortContentTranslationPack): ResortContentTranslations {
  return {
    ...(current ?? {}),
    [pack.locale]: pack,
  };
}
