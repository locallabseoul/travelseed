import type { ContentSection, DashboardMetric, PlanOption, ResortConsoleData, SetupStep, TemplateOption, UsageMetric } from "@/types/dashboard";

export const mockResort: ResortConsoleData = {
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
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Monthly Visitors", value: "1,240 / 20,000", helper: "6.2% of monthly allowance" },
  { label: "WhatsApp Clicks", value: "32 / 300", helper: "Direct booking intent" },
  { label: "Storage", value: "2.4GB / 20GB", helper: "Hero and gallery media" },
  { label: "Conversion Signal", value: "2.6%", helper: "WhatsApp clicks from visits" },
];

export const usageMetrics: UsageMetric[] = [
  { label: "Visitors", used: 1240, limit: 20000, unit: "" },
  { label: "WhatsApp clicks", used: 32, limit: 300, unit: "" },
  { label: "Storage", used: 2.4, limit: 20, unit: "GB" },
];

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
