import type { PlanType, ResortConsoleData, SiteStructurePage, SiteStructureSection, SiteType } from "@/types/dashboard";
import { canUsePlan, templateCatalog } from "@/lib/template-catalog";
import { sectionPresets } from "@/lib/section-presets";

export { canUsePlan, templateCatalog };

export const currentPlanPreviewOverride: PlanType | null = null;

export const planNameToType: Record<ResortConsoleData["plan"], PlanType> = {
  "Seed Trial": "freeTrial",
  Seed: "seed",
  Tree: "tree",
  Forest: "forest",
};

export const planTypeToName: Record<PlanType, ResortConsoleData["plan"]> = {
  freeTrial: "Seed Trial",
  seed: "Seed",
  tree: "Tree",
  forest: "Forest",
};

export const planConfig: Record<PlanType, {
  label: string;
  siteType: SiteType;
  structureLabel: string;
  positioning: string;
  upgradeTarget?: "Seed" | "Tree" | "Forest";
  unlocked: string[];
  locked: string[];
}> = {
  freeTrial: {
    label: "Free Trial",
    siteType: "landing",
    structureLabel: "One-page Landing",
    positioning: "Trial one-page resort website with Travelseed branding.",
    upgradeTarget: "Seed",
    unlocked: ["Hero", "About", "Rooms", "Facilities", "Gallery", "Map", "Contact"],
    locked: ["Reviews", "Promotion Banner", "Custom Domain", "Remove Travelseed Branding"],
  },
  seed: {
    label: "Seed",
    siteType: "landing",
    structureLabel: "One-page Landing",
    positioning: "Beautiful one-page resort website.",
    upgradeTarget: "Tree",
    unlocked: ["All landing sections", "WhatsApp CTA", "Promotion Banner", "Custom Domain", "Remove Travelseed Branding"],
    locked: ["Blog", "Detailed Experiences Pages", "Custom Page Add", "Navigation Builder"],
  },
  tree: {
    label: "Tree",
    siteType: "multipage",
    structureLabel: "Multi-page Website",
    positioning: "Multi-page brand website for direct booking.",
    upgradeTarget: "Forest",
    unlocked: ["Page Management", "SEO Controls", "Blog Operations", "Promotions Page", "Experiences Page"],
    locked: ["Custom Page Add", "Navigation Builder", "Event Landing Pages", "Membership Pages"],
  },
  forest: {
    label: "Forest",
    siteType: "custom",
    structureLabel: "Custom Resort Platform",
    positioning: "Custom resort platform for premium operations.",
    unlocked: ["Everything in Tree", "Custom Pages", "Navigation Builder", "Event Pages", "Wedding Pages", "Tour Pages", "Membership Pages", "Advanced Settings"],
    locked: [],
  },
};

export const landingSections: SiteStructureSection[] = [
  { name: "Hero", description: "Main resort promise, hero image, and primary CTA." },
  { name: "About", description: "Short brand story and location positioning." },
  { name: "Rooms", description: "Room, package, or service cards." },
  { name: "Facilities", description: "Amenities and stay highlights." },
  { name: "Gallery", description: "Curated property imagery." },
  { name: "Reviews", description: "Website testimonials.", locked: true, lockReason: "Upgrade to Seed to publish reviews." },
  { name: "Map", description: "Location and nearby area context." },
  { name: "Contact", description: "WhatsApp, email, and basic contact details." },
  { name: "Promotion Banner", description: "Simple direct booking offer.", locked: true, lockReason: "Upgrade to Seed to run promotions." },
];

export const treePages: SiteStructurePage[] = [
  { name: "Home", slug: "/", pageType: "Standard", isPublished: true },
  { name: "Rooms", slug: "/rooms", pageType: "Standard", isPublished: true },
  { name: "Experiences", slug: "/experiences", pageType: "Standard", isPublished: true },
  { name: "Gallery", slug: "/gallery", pageType: "Standard", isPublished: true },
  { name: "Reviews", slug: "/reviews", pageType: "Standard", isPublished: true },
  { name: "Blog", slug: "/blog", pageType: "Standard", isPublished: false },
  { name: "About", slug: "/about", pageType: "Standard", isPublished: true },
  { name: "Contact", slug: "/contact", pageType: "Standard", isPublished: true },
  ...sectionPresets
    .filter((preset) => canUsePlan("tree", preset.requiredPlan))
    .map((preset) => ({ name: preset.label, slug: preset.slug, pageType: preset.pageType, isPublished: preset.isPublished, settings: preset.settings })),
];

export const forestCustomPages: SiteStructurePage[] = [
  ...treePages,
  { name: "Island Tours", slug: "/tours", pageType: "Tour", isPublished: false },
  { name: "Member Offers", slug: "/membership", pageType: "Membership", isPublished: false },
  ...sectionPresets
    .filter((preset) => preset.requiredPlan === "forest" && !treePages.some((page) => page.slug === preset.slug))
    .map((preset) => ({ name: preset.label, slug: preset.slug, pageType: preset.pageType, isPublished: preset.isPublished, settings: preset.settings })),
];

export function effectivePlanType(site: ResortConsoleData) {
  return currentPlanPreviewOverride ?? site.planType ?? planNameToType[site.plan];
}
