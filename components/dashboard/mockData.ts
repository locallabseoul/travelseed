import type { ContentSection, DashboardMetric, PlanOption, ResortConsoleData, SetupStep, TemplateOption, UsageMetric } from "@/types/dashboard";

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
      helper: "Direct customer intent",
    },
    {
      label: "Storage",
      value: `${site.storageUsedGb}GB / ${site.storageLimitGb}GB`,
      helper: "Business and gallery media",
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
  "Continue Setup",
  "Edit Home Hero",
  "Update Gallery",
  "Manage Offers",
  "Edit WhatsApp Inquiry",
  "Connect Domain",
  "Upgrade Plan",
];

export const recentActivity = [
  "Hero copy updated",
  "New gallery image added",
  "WhatsApp inquiry button clicked",
  "Domain verified",
];

export const setupSteps: SetupStep[] = [
  { title: "Business Info", description: "Confirm business name, type, location, and contact details.", status: "Done" },
  { title: "Existing Source", description: "Paste a current website, Instagram, OTA, marketplace, or business notes.", status: "Done" },
  { title: "Choose Template", description: "Select a business template built for WhatsApp inquiries.", status: "Current" },
  { title: "AI Brand Copy", description: "Generate clear customer-facing copy without writing from scratch.", status: "Next" },
  { title: "WhatsApp Inquiry", description: "Set the WhatsApp number and message format.", status: "Next" },
  { title: "Preview & Publish", description: "Review the live page experience before publishing.", status: "Next" },
];

export const contentSections: ContentSection[] = [
  { title: "Hero", description: "Main headline, subtitle, hero image, and primary CTA.", status: "Ready" },
  { title: "About", description: "Short business story and customer positioning.", status: "Ready" },
  { title: "Features", description: "Services, amenities, business highlights, and practical selling points.", status: "Needs review" },
  { title: "Gallery", description: "Curated photos for storefront, team, services, products, rooms, food, or area.", status: "Ready" },
  { title: "Services", description: "Services, products, packages, menus, treatments, tours, and customer use cases.", status: "Ready" },
  { title: "Inquiry CTA", description: "WhatsApp inquiry block and message template.", status: "Ready" },
  { title: "Footer", description: "Contact details, location, legal notes, and brand links.", status: "Needs review" },
];

export const templateOptions: TemplateOption[] = [
  { name: "Local Business", description: "Clean, practical layout for services, menus, products, and inquiries.", selected: true },
  { name: "Boutique Cafe", description: "Warm local commerce layout for cafes, restaurants, wellness, and shops." },
  { name: "Surf Camp", description: "Energetic structure for camps, trips, and group packages." },
  { name: "Boutique Villa", description: "Premium visual layout for villas and private stays." },
];

export const colorThemes = ["Sand", "Tropical Green", "Dark Luxury", "Minimal White"];

export const planOptions: PlanOption[] = [
  {
    name: "Seed Trial",
    price: "Free",
    positioning: "Trial one-page landing",
    features: ["One-page landing", "Travelseed branding", "Subdomain only", "Basic sections"],
  },
  {
    name: "Seed",
    price: "IDR 99K / month",
    positioning: "Beautiful one-page business website",
    features: ["Landing sections", "WhatsApp CTA", "Promotion banner", "Custom domain", "5,000 visitors"],
  },
  {
    name: "Tree",
    price: "IDR 199K / month",
    positioning: "Multi-page business website",
    features: ["Home", "Offers", "Services", "Promotions", "Reviews", "Blog", "SEO controls"],
    current: true,
  },
  {
    name: "Forest",
    price: "IDR 999K+ / month",
    positioning: "Custom business platform",
    features: ["Custom pages", "Navigation builder", "Event pages", "Tour pages", "Membership pages", "Advanced settings"],
  },
];
