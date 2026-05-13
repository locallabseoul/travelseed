import type { ResortConsoleData } from "@/types/dashboard";
import type { ResortWithMetrics, ResortUpsert } from "@/types/resort";

export function siteFromResort(resort: ResortWithMetrics): ResortConsoleData {
  return {
    id: resort.id,
    slug: resort.slug,
    domain: resort.domain,
    name: resort.name,
    type: resort.type ?? "Direct Booking Site",
    location: resort.location,
    plan: "Tree",
    status: resort.is_active ? "Published" : "Paused",
    travelseedUrl: `${resort.slug}.travelseed.app`,
    customDomain: resort.domain ?? "",
    monthlyVisitorsUsed: 0,
    monthlyVisitorsLimit: 20000,
    whatsappClicksUsed: resort.whatsapp_clicks_count ?? 0,
    whatsappClicksLimit: 300,
    storageUsedGb: 0,
    storageLimitGb: 20,
    template: resort.template_id,
    whatsappNumber: resort.whatsapp_number,
    heroTitle: resort.hero_title,
    heroSubtitle: resort.hero_subtitle ?? "",
    heroImageUrl: resort.hero_image_url ?? "",
    heroCta: "Book Direct on WhatsApp",
    about: resort.description ?? "",
    features: resort.features,
    gallery: resort.gallery,
    experiences: resort.experiences,
    bookingMessageTemplate:
      resort.booking_message_template ??
      `Hello, I would like to make a reservation at ${resort.name}.
Check-in:
Check-out:
Guests:
Airport Pickup:`,
    language: "English",
    timezone: "Asia/Makassar",
    contactEmail: resort.owner_email ?? "",
    isActive: resort.is_active,
    createdAt: resort.created_at ?? null,
    updatedAt: resort.updated_at ?? null,
  };
}

export function resortPayloadFromSite(site: ResortConsoleData): ResortUpsert {
  return {
    name: site.name,
    slug: site.slug,
    domain: site.domain,
    template_id: site.template,
    location: site.location,
    type: site.type,
    description: site.about || null,
    hero_title: site.heroTitle,
    hero_subtitle: site.heroSubtitle || null,
    hero_image_url: site.heroImageUrl || null,
    whatsapp_number: site.whatsappNumber,
    capacity: null,
    bedrooms: null,
    bathrooms: null,
    features: site.features,
    gallery: site.gallery,
    experiences: site.experiences,
    booking_message_template: site.bookingMessageTemplate || null,
    is_active: site.isActive,
    updated_at: new Date().toISOString(),
  };
}
