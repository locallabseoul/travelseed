import type { PlanType, SitePageContentCard, SitePageType } from "@/types/dashboard";

export type SectionPresetSettings = {
  title: string;
  intro: string;
  items: string[];
  cards: SitePageContentCard[];
  ctaLabel: string;
  campaignNote?: string;
  openingHours?: string;
  breakfastInfo?: string;
  privateDiningNote?: string;
};

export type SectionPreset = {
  id: string;
  label: string;
  slug: string;
  pageType: SitePageType;
  requiredPlan: PlanType;
  isPublished: boolean;
  description: string;
  layout: "dining" | "wellness" | "activities" | "promotions" | "events";
  editor: {
    titleLabel: string;
    introLabel: string;
    itemsLabel: string;
    itemsHelp: string;
    ctaLabel: string;
  };
  card: {
    eyebrow: string;
    fallbackDescription: string;
    offerDescription?: string;
  };
  settings: SectionPresetSettings;
};

export const sectionPresets: SectionPreset[] = [
  {
    id: "dining",
    label: "Dining",
    slug: "/dining",
    pageType: "Standard",
    requiredPlan: "tree",
    isPublished: false,
    description: "Restaurant, bar, breakfast, and culinary highlights.",
    layout: "dining",
    editor: {
      titleLabel: "Dining headline",
      introLabel: "Dining introduction",
      itemsLabel: "Dining highlights",
      itemsHelp: "Add one menu, venue, service, or food experience per line.",
      ctaLabel: "Dining CTA label",
    },
    card: {
      eyebrow: "Dining highlight",
      fallbackDescription: "Share what guests can expect, from breakfast service to signature local ingredients.",
    },
    settings: {
      title: "Dining shaped around the stay",
      intro: "Share breakfast, restaurant, bar, private dining, or local food experiences guests can enjoy during their stay.",
      items: ["Breakfast service", "Local ingredients", "Private dining"],
      cards: [],
      ctaLabel: "Ask about dining",
      openingHours: "Breakfast daily from 7:00 AM to 10:30 AM",
      breakfastInfo: "Fresh breakfast options are available for guests before a beach day, tour, or slow morning at the property.",
      privateDiningNote: "Private dining or special meal requests can be arranged directly with the host.",
    },
  },
  {
    id: "promotions",
    label: "Promotions",
    slug: "/promotions",
    pageType: "Landing",
    requiredPlan: "tree",
    isPublished: true,
    description: "Direct booking offers and seasonal packages.",
    layout: "promotions",
    editor: {
      titleLabel: "Promotion headline",
      introLabel: "Campaign introduction",
      itemsLabel: "Fallback promotion highlights",
      itemsHelp: "Add one direct booking perk, package, or campaign message per line. Active package/highlight offers will appear first on the public page.",
      ctaLabel: "Promotion CTA label",
    },
    card: {
      eyebrow: "Direct booking offer",
      fallbackDescription: "Use this as a fallback campaign highlight when there are no active package or highlighted offers.",
      offerDescription: "Current package or highlighted offer from the Offers manager.",
    },
    settings: {
      title: "Direct booking offers",
      intro: "Highlight seasonal packages, stay-more-save-more offers, and direct booking benefits.",
      items: ["Stay longer offer", "Direct booking perks", "Seasonal package"],
      cards: [],
      ctaLabel: "Ask for current offers",
      campaignNote: "Direct booking offers may vary by date, length of stay, and availability. Ask the host for current terms.",
    },
  },
  {
    id: "spa-wellness",
    label: "Spa & Wellness",
    slug: "/spa-wellness",
    pageType: "Standard",
    requiredPlan: "forest",
    isPublished: false,
    description: "Spa, treatments, wellness rituals, and recovery spaces.",
    layout: "wellness",
    editor: {
      titleLabel: "Wellness headline",
      introLabel: "Wellness introduction",
      itemsLabel: "Treatments and facilities",
      itemsHelp: "Add one treatment, facility, ritual, or wellness program per line.",
      ctaLabel: "Wellness CTA label",
    },
    card: {
      eyebrow: "Wellness",
      fallbackDescription: "Describe the treatment, ritual, or facility guests can plan around.",
    },
    settings: {
      title: "Wellness for slower days",
      intro: "Introduce spa treatments, wellness rituals, yoga, recovery, and quiet spaces designed for guest wellbeing.",
      items: ["Signature massage", "Yoga or meditation", "Wellness facilities"],
      cards: [],
      ctaLabel: "Plan a wellness stay",
    },
  },
  {
    id: "activities",
    label: "Activities",
    slug: "/activities",
    pageType: "Standard",
    requiredPlan: "tree",
    isPublished: false,
    description: "On-site activities, tours, and guest experiences.",
    layout: "activities",
    editor: {
      titleLabel: "Activities headline",
      introLabel: "Activities introduction",
      itemsLabel: "Activity highlights",
      itemsHelp: "Add one activity, tour, class, or guest experience per line.",
      ctaLabel: "Activities CTA label",
    },
    card: {
      eyebrow: "Guest experience",
      fallbackDescription: "Give guests a clear reason to plan this activity during the stay.",
    },
    settings: {
      title: "Activities close to the stay",
      intro: "Turn your best experiences, tours, classes, and on-site activities into a clear planning page.",
      items: ["Guided experience", "Outdoor activity", "Local tour"],
      cards: [],
      ctaLabel: "Ask about activities",
    },
  },
  {
    id: "nearby-attractions",
    label: "Nearby Attractions",
    slug: "/nearby-attractions",
    pageType: "Standard",
    requiredPlan: "tree",
    isPublished: false,
    description: "Nearby beaches, landmarks, cafes, and local area guidance.",
    layout: "activities",
    editor: {
      titleLabel: "Local guide headline",
      introLabel: "Local guide introduction",
      itemsLabel: "Nearby places",
      itemsHelp: "Add one beach, landmark, cafe, viewpoint, or local favorite per line.",
      ctaLabel: "Local guide CTA label",
    },
    card: {
      eyebrow: "Nearby place",
      fallbackDescription: "Help guests understand why this nearby place is worth visiting.",
    },
    settings: {
      title: "Everything close enough",
      intro: "Help guests understand what is nearby, from beaches and cafes to landmarks, viewpoints, and local favorites.",
      items: ["Nearby beach", "Local cafe", "Scenic viewpoint"],
      cards: [],
      ctaLabel: "Ask for local tips",
    },
  },
  {
    id: "weddings-events",
    label: "Weddings & Events",
    slug: "/weddings",
    pageType: "Wedding",
    requiredPlan: "forest",
    isPublished: false,
    description: "Wedding, retreat, event, and private gathering pages.",
    layout: "events",
    editor: {
      titleLabel: "Events headline",
      introLabel: "Events introduction",
      itemsLabel: "Event packages or moments",
      itemsHelp: "Add one wedding, retreat, private dinner, buyout, or event package per line.",
      ctaLabel: "Events CTA label",
    },
    card: {
      eyebrow: "Private event",
      fallbackDescription: "Frame the event option around guest count, atmosphere, or inquiry intent.",
    },
    settings: {
      title: "Private events with a sense of place",
      intro: "Present weddings, retreats, dinners, or private celebrations with an inquiry-first page.",
      items: ["Wedding stays", "Private dinners", "Retreat buyouts"],
      cards: [],
      ctaLabel: "Plan an event",
    },
  },
];

export function presetForSlug(slug: string) {
  const normalized = slug === "/" ? "/" : `/${slug.replace(/^\/+|\/+$/g, "")}`;
  return sectionPresets.find((preset) => preset.slug === normalized) ?? null;
}

export function presetSettingsFrom(value: unknown, preset: SectionPreset): SectionPresetSettings {
  const settings = value && typeof value === "object" ? value as Partial<SectionPresetSettings> : {};
  const items = Array.isArray(settings.items) && settings.items.length > 0 ? settings.items.map(String).filter(Boolean) : preset.settings.items;
  const cards = normalizePresetCards(settings.cards, items);

  return {
    title: typeof settings.title === "string" && settings.title.trim() ? settings.title : preset.settings.title,
    intro: typeof settings.intro === "string" && settings.intro.trim() ? settings.intro : preset.settings.intro,
    items,
    cards,
    ctaLabel: typeof settings.ctaLabel === "string" && settings.ctaLabel.trim() ? settings.ctaLabel : preset.settings.ctaLabel,
    campaignNote: optionalPresetText(settings.campaignNote, preset.settings.campaignNote),
    openingHours: optionalPresetText(settings.openingHours, preset.settings.openingHours),
    breakfastInfo: optionalPresetText(settings.breakfastInfo, preset.settings.breakfastInfo),
    privateDiningNote: optionalPresetText(settings.privateDiningNote, preset.settings.privateDiningNote),
  };
}

function normalizePresetCards(value: unknown, fallbackItems: string[]): SitePageContentCard[] {
  if (Array.isArray(value) && value.length > 0) {
    return value
      .map((item, index) => {
        const card = item && typeof item === "object" ? item as Partial<SitePageContentCard> : {};
        return {
          id: typeof card.id === "string" && card.id.trim() ? card.id : `card-${index + 1}`,
          title: typeof card.title === "string" ? card.title.trim() : "",
          description: typeof card.description === "string" ? card.description.trim() : "",
          imageUrl: typeof card.imageUrl === "string" ? card.imageUrl.trim() : "",
          sortOrder: typeof card.sortOrder === "number" && Number.isFinite(card.sortOrder) ? card.sortOrder : index,
        };
      })
      .filter((card) => card.title)
      .sort((first, second) => first.sortOrder - second.sortOrder);
  }

  return fallbackItems.map((item, index) => ({
    id: `legacy-item-${index + 1}`,
    title: item,
    description: "",
    imageUrl: "",
    sortOrder: index,
  }));
}

function optionalPresetText(value: unknown, fallback: string | undefined) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
