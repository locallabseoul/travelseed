import type { ContentSection, DashboardMetric, PlanOption, ResortConsoleData, SetupStep, TemplateOption, UsageMetric } from "@/types/dashboard";

export const mockSites: ResortConsoleData[] = [
  {
    id: "villa-jeruk",
    name: "Villa Jeruk",
    type: "Private Tropical Villa",
    location: "Selong Belanak, Lombok, Indonesia",
    plan: "Tree",
    status: "Published",
    travelseedUrl: "villa-jeruk.travelseed.app",
    customDomain: "villajeruk.com",
    monthlyVisitorsUsed: 1240,
    monthlyVisitorsLimit: 20000,
    whatsappClicksUsed: 32,
    whatsappClicksLimit: 300,
    storageUsedGb: 2.4,
    storageLimitGb: 20,
    template: "Boutique Villa",
    whatsappNumber: "+62 821-4790-1202",
    heroTitle: "Private Tropical Escape in Selong Belanak",
    heroSubtitle: "3-bedroom villa with private pool near Lombok's most beautiful beaches.",
    heroCta: "Book Direct on WhatsApp",
    about: "A calm private villa for families, surfers, and remote workers looking for a South Lombok base.",
    features: ["Private Pool", "Fast WiFi", "Fully Equipped Kitchen", "Tropical Garden"],
    experiences: ["Selong Belanak Beach", "Surf Lessons", "Sunset Coast", "Local Cafes"],
    language: "English",
    timezone: "Asia/Makassar",
    contactEmail: "hello@villajeruk.com",
  },
  {
    id: "rplay-lombok",
    name: "RPLAY Lombok",
    type: "Surf Camp",
    location: "Kuta Mandalika, Lombok, Indonesia",
    plan: "Seed",
    status: "Draft",
    travelseedUrl: "rplay-lombok.travelseed.app",
    customDomain: "",
    monthlyVisitorsUsed: 420,
    monthlyVisitorsLimit: 5000,
    whatsappClicksUsed: 18,
    whatsappClicksLimit: 80,
    storageUsedGb: 1.1,
    storageLimitGb: 5,
    template: "Surf Camp",
    whatsappNumber: "+62 813-9000-4412",
    heroTitle: "Surf, Stay, and Explore South Lombok",
    heroSubtitle: "Guided surf camp packages with local instructors and flexible stays.",
    heroCta: "Ask About Surf Packages",
    about: "A surf-first stay experience for travelers who want lessons, community, and easy access to breaks.",
    features: ["Surf Lessons", "Board Rental", "Airport Pickup", "Community Dinner"],
    experiences: ["Tanjung Aan", "Gerupuk Bay", "Beginner Surf Lessons", "Beach BBQ"],
    language: "English",
    timezone: "Asia/Makassar",
    contactEmail: "booking@rplaylombok.com",
  },
  {
    id: "warung-senja",
    name: "Warung Senja",
    type: "Local Business",
    location: "Canggu, Bali, Indonesia",
    plan: "Seed Trial",
    status: "Paused",
    travelseedUrl: "warung-senja.travelseed.app",
    customDomain: "",
    monthlyVisitorsUsed: 96,
    monthlyVisitorsLimit: 500,
    whatsappClicksUsed: 7,
    whatsappClicksLimit: 20,
    storageUsedGb: 0.4,
    storageLimitGb: 1,
    template: "Local Business",
    whatsappNumber: "+62 878-1220-3344",
    heroTitle: "Balinese Home Cooking for Groups and Events",
    heroSubtitle: "Simple catering packages and local dishes prepared for private gatherings.",
    heroCta: "Request Menu on WhatsApp",
    about: "A small family-run kitchen serving practical catering for villas, retreats, and local events.",
    features: ["Group Catering", "Vegetarian Options", "Local Ingredients", "Delivery Available"],
    experiences: ["Private Villa Dinner", "Retreat Meals", "Balinese Menu", "Snack Boxes"],
    language: "English",
    timezone: "Asia/Makassar",
    contactEmail: "hello@warungsenja.id",
  },
];

export const mockResort: ResortConsoleData = mockSites[0];

export function dashboardMetricsFor(site: ResortConsoleData): DashboardMetric[] {
  return [
    {
      label: "Monthly Visitors",
      value: `${site.monthlyVisitorsUsed.toLocaleString()} / ${site.monthlyVisitorsLimit.toLocaleString()}`,
      helper: `${Math.round((site.monthlyVisitorsUsed / site.monthlyVisitorsLimit) * 100)}% of monthly allowance`,
    },
    {
      label: "WhatsApp Clicks",
      value: `${site.whatsappClicksUsed.toLocaleString()} / ${site.whatsappClicksLimit.toLocaleString()}`,
      helper: "Direct booking intent",
    },
    {
      label: "Storage",
      value: `${site.storageUsedGb}GB / ${site.storageLimitGb}GB`,
      helper: "Hero and gallery media",
    },
    {
      label: "Conversion Signal",
      value: `${((site.whatsappClicksUsed / site.monthlyVisitorsUsed) * 100).toFixed(1)}%`,
      helper: "WhatsApp clicks from visits",
    },
  ];
}

export function usageMetricsFor(site: ResortConsoleData): UsageMetric[] {
  return [
    { label: "Visitors", used: site.monthlyVisitorsUsed, limit: site.monthlyVisitorsLimit, unit: "" },
    { label: "WhatsApp clicks", used: site.whatsappClicksUsed, limit: site.whatsappClicksLimit, unit: "" },
    { label: "Storage", used: site.storageUsedGb, limit: site.storageLimitGb, unit: "GB" },
  ];
}

export const quickActions = [
  "Edit Hero Section",
  "Update Gallery",
  "Change WhatsApp Number",
  "Connect Domain",
  "Upgrade Plan",
];

export const recentActivity = [
  "Hero copy updated",
  "New gallery image added",
  "WhatsApp booking button clicked",
  "Domain verified",
];

export const setupSteps: SetupStep[] = [
  { title: "Business Info", description: "Confirm property name, type, location, and contact details.", status: "Done" },
  { title: "OTA / Existing Info", description: "Paste your current listing or bring over existing descriptions.", status: "Done" },
  { title: "Choose Template", description: "Select a hospitality template built for direct booking.", status: "Current" },
  { title: "AI Brand Copy", description: "Generate clear brand copy for guests without writing from scratch.", status: "Next" },
  { title: "WhatsApp Booking", description: "Set the booking number, message format, and pickup option.", status: "Next" },
  { title: "Preview & Publish", description: "Review the live page experience before publishing.", status: "Next" },
];

export const contentSections: ContentSection[] = [
  { title: "Hero", description: "Main headline, subtitle, hero image, and primary CTA.", status: "Ready" },
  { title: "About", description: "Short property story and positioning for direct guests.", status: "Ready" },
  { title: "Features", description: "Amenities, stay highlights, and practical selling points.", status: "Needs review" },
  { title: "Gallery", description: "Curated photos for exterior, rooms, pool, food, and area.", status: "Ready" },
  { title: "Rooms / Services", description: "Room types, villa capacity, packages, or MSME services.", status: "Draft" },
  { title: "Experiences", description: "Nearby beaches, activities, restaurants, and local attractions.", status: "Ready" },
  { title: "Booking CTA", description: "WhatsApp booking block and message template.", status: "Ready" },
  { title: "Footer", description: "Contact details, location, legal notes, and brand links.", status: "Needs review" },
];

export const templateOptions: TemplateOption[] = [
  { name: "Boutique Villa", description: "Premium visual layout for villas and private stays.", selected: true },
  { name: "Surf Camp", description: "Energetic structure for camps, trips, and group packages." },
  { name: "Minimal Stay", description: "Clean, quiet layout for small hotels and homestays." },
  { name: "Local Business", description: "Simple direct presence for MSME products and services." },
];

export const colorThemes = ["Sand", "Tropical Green", "Dark Luxury", "Minimal White"];

export const planOptions: PlanOption[] = [
  {
    name: "Seed Trial",
    price: "Free",
    positioning: "Demo only",
    features: ["Travelseed subdomain", "No custom domain", "Limited AI copy", "No live booking"],
  },
  {
    name: "Seed",
    price: "IDR 99K / month",
    positioning: "Online presence",
    features: ["Brand page", "WhatsApp basic link", "Custom domain", "5,000 visitors", "5GB storage"],
  },
  {
    name: "Tree",
    price: "IDR 199K / month",
    positioning: "Direct booking operations",
    features: ["Booking template", "Basic reservation management", "20,000 visitors", "20GB storage", "300 WhatsApp clicks"],
    current: true,
  },
  {
    name: "Forest",
    price: "IDR 999K+ / month",
    positioning: "Travel ecosystem",
    features: ["CRM", "Advanced analytics", "Activity connection", "100,000 visitors", "100GB storage", "Unlimited inquiries"],
  },
];
