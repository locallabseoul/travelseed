import type { PlanType, ResortConsoleData, SiteStructurePage, SiteStructureSection, SiteType } from "@/types/dashboard";

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
  { name: "Dining", slug: "/dining", pageType: "Standard", isPublished: false },
  { name: "Promotions", slug: "/promotions", pageType: "Landing", isPublished: true },
  { name: "Blog", slug: "/blog", pageType: "Standard", isPublished: false },
  { name: "About", slug: "/about", pageType: "Standard", isPublished: true },
  { name: "Contact", slug: "/contact", pageType: "Standard", isPublished: true },
];

export const forestCustomPages: SiteStructurePage[] = [
  ...treePages,
  { name: "Wedding Packages", slug: "/weddings", pageType: "Wedding", isPublished: false },
  { name: "Island Tours", slug: "/tours", pageType: "Tour", isPublished: false },
  { name: "Member Offers", slug: "/membership", pageType: "Membership", isPublished: false },
];

export const templateCatalog = [
  { name: "Sunset Landing", description: "A fast one-page direct booking site for small properties.", planType: "seed" as const, siteType: "landing" as const, templateId: "minimal-stay", tags: ["Landing", "Seed"] },
  { name: "Tropical Villa Landing", description: "Premium one-page villa presentation with booking CTA.", planType: "seed" as const, siteType: "landing" as const, templateId: "boutique-villa", tags: ["Landing", "Seed"] },
  { name: "Boutique Resort Multi-page", description: "Multi-page resort brand structure for rooms, dining, blog, and SEO.", planType: "tree" as const, siteType: "multipage" as const, templateId: "boutique-villa", tags: ["Multi-page", "Tree"] },
  { name: "Surf Camp Multi-page", description: "Activity-led multi-page site for camps, packages, and experiences.", planType: "tree" as const, siteType: "multipage" as const, templateId: "surf-camp", tags: ["Multi-page", "Tree"] },
  { name: "Luxury Resort Platform", description: "Custom platform structure for premium resort campaigns and special pages.", planType: "forest" as const, siteType: "custom" as const, templateId: "boutique-villa", tags: ["Custom", "Forest"] },
];

export function effectivePlanType(site: ResortConsoleData) {
  return currentPlanPreviewOverride ?? site.planType ?? planNameToType[site.plan];
}

export function canUsePlan(current: PlanType, required: PlanType) {
  const order: PlanType[] = ["freeTrial", "seed", "tree", "forest"];
  return order.indexOf(current) >= order.indexOf(required);
}
