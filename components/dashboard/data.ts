import type { ResortConsoleData } from "@/types/dashboard";
import type { ResortWithMetrics, ResortUpsert } from "@/types/resort";
import { planConfig, planNameToType } from "@/components/dashboard/subscriptionConfig";

export function siteFromResort(resort: ResortWithMetrics): ResortConsoleData {
  const plan = resort.plan ?? "Tree";
  const planType = resort.plan_type ?? planNameToType[plan];
  const planLimits = limitsForPlan(plan);
  const designSettings = resort.design_settings ?? {};

  const defaultAnalytics = {
    whatsappClicks7d: 0,
    whatsappClicks30d: resort.whatsapp_clicks_count ?? 0,
    pageViews7d: 0,
    pageViews30d: resort.page_views_count ?? 0,
    recentEvents: [],
    dailyClicks: [],
  };

  return {
    id: resort.id,
    slug: resort.slug,
    domain: resort.domain,
    name: resort.name,
    type: resort.type ?? "Direct Booking Site",
    location: resort.location,
    plan,
    planType,
    siteType: resort.site_type ?? planConfig[planType].siteType,
    status: resort.is_active ? "Published" : "Paused",
    travelseedUrl: `${resort.slug}.travelseed.app`,
    customDomain: resort.domain ?? "",
    monthlyVisitorsUsed: resort.page_views_count ?? resort.analytics?.pageViews30d ?? 0,
    monthlyVisitorsLimit: planLimits.visitors,
    whatsappClicksUsed: resort.whatsapp_clicks_count ?? 0,
    whatsappClicksLimit: planLimits.whatsappClicks,
    inquiriesUsed: resort.inquiries_count ?? 0,
    inquiriesLimit: planLimits.inquiries,
    storageUsedGb: estimatedStorageGb(resort.storage_images_count ?? imageCountFor(resort)),
    storageLimitGb: planLimits.storageGb,
    storageImagesUsed: resort.storage_images_count ?? imageCountFor(resort),
    template: resort.template_id,
    designSettings: {
      colorTheme: designSettings.colorTheme ?? "Tropical Green",
      customColors: designSettings.customColors ?? {},
      logoUrl: designSettings.logoUrl ?? "",
      fontStyle: designSettings.fontStyle ?? "Editorial Sans",
      buttonStyle: designSettings.buttonStyle ?? "Rounded",
      imageStyle: designSettings.imageStyle ?? "Soft Corners",
      templateCatalogName: designSettings.templateCatalogName ?? "",
    },
    whatsappNumber: resort.whatsapp_number,
    heroTitle: resort.hero_title,
    heroSubtitle: resort.hero_subtitle ?? "",
    heroImageUrl: resort.hero_image_url ?? "",
    heroCta: "Book Direct on WhatsApp",
    about: resort.description ?? "",
    features: resort.features,
    services: (resort.services ?? []).map((service) => ({
      id: service.id,
      kind: service.kind,
      title: service.title,
      description: service.description ?? "",
      priceLabel: service.price_label ?? "",
      capacity: service.capacity?.toString() ?? "",
      imageUrl: service.image_url ?? "",
      highlight: service.highlight ?? "",
      duration: service.duration ?? "",
      included: service.included ?? [],
      ctaLabel: service.cta_label ?? "",
      bedType: service.bed_type ?? "",
      roomSize: service.room_size ?? "",
      viewType: service.view_type ?? "",
      bathroomInfo: service.bathroom_info ?? "",
      maxGuests: service.max_guests?.toString() ?? "",
      roomAmenities: service.room_amenities ?? [],
      sortOrder: service.sort_order,
      isActive: service.is_active,
    })),
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
    domainStatus: resort.domain_status ?? (resort.domain ? "pending" : "not_connected"),
    sslStatus: resort.ssl_status ?? "pending",
    domainVerifiedAt: resort.domain_verified_at ?? null,
    createdAt: resort.created_at ?? null,
    updatedAt: resort.updated_at ?? null,
    analytics: resort.analytics ?? defaultAnalytics,
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
    design_settings: site.designSettings,
    is_active: site.isActive,
    domain_status: site.domainStatus,
    ssl_status: site.sslStatus,
    domain_verified_at: site.domainVerifiedAt,
    plan: site.plan,
    plan_type: site.planType,
    site_type: site.siteType,
    updated_at: new Date().toISOString(),
  };
}

function limitsForPlan(plan: ResortConsoleData["plan"]) {
  const limits = {
    "Seed Trial": { visitors: 500, whatsappClicks: 0, storageGb: 1, inquiries: 0 },
    Seed: { visitors: 5000, whatsappClicks: 100, storageGb: 5, inquiries: 100 },
    Tree: { visitors: 20000, whatsappClicks: 300, storageGb: 20, inquiries: 500 },
    Forest: { visitors: 100000, whatsappClicks: 100000, storageGb: 100, inquiries: null },
  } satisfies Record<ResortConsoleData["plan"], { visitors: number; whatsappClicks: number; storageGb: number; inquiries: number | null }>;

  return limits[plan];
}

function imageCountFor(resort: ResortWithMetrics) {
  return resort.gallery.length + (resort.hero_image_url ? 1 : 0) + (resort.services ?? []).filter((service) => service.image_url).length;
}

function estimatedStorageGb(imageCount: number) {
  return Number((imageCount * 0.004).toFixed(2));
}
