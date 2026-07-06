import type { ResortContentTranslations } from "@/types/resort";

export type DashboardTab =
  | "dashboard"
  | "setup"
  | "import"
  | "aiCopy"
  | "content"
  | "offers"
  | "structure"
  | "design"
  | "whatsapp"
  | "inquiries"
  | "vouchers"
  | "domain"
  | "analytics"
  | "reviews"
  | "plan"
  | "settings";

export type DashboardConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

export type DashboardUnsavedChanges = {
  isDirty: boolean;
  title: string;
  description: string;
};

export type DashboardNotificationItem = {
  id: string;
  tab: DashboardTab;
  label: string;
  count: number;
};

export type DashboardNotificationSummary = {
  total: number;
  items: DashboardNotificationItem[];
  byTab: Partial<Record<DashboardTab, number>>;
};

export type PlanType = "freeTrial" | "seed" | "tree" | "forest";
export type SiteType = "landing" | "multipage" | "custom";
export type SitePageType = "Standard" | "Landing" | "Event" | "Wedding" | "Tour" | "Membership";
export type SitePageContentCard = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
};

export type SitePageSettings = {
  title?: string;
  intro?: string;
  items?: string[];
  cards?: SitePageContentCard[];
  ctaLabel?: string;
  campaignNote?: string;
  openingHours?: string;
  breakfastInfo?: string;
  privateDiningNote?: string;
};

export type ResortConsoleData = {
  id: string;
  slug: string;
  domain: string | null;
  name: string;
  type: string;
  location: string;
  plan: "Seed Trial" | "Seed" | "Tree" | "Forest";
  planType: PlanType;
  siteType: SiteType;
  status: "Draft" | "Published" | "Paused";
  travelseedUrl: string;
  customDomain: string;
  monthlyVisitorsUsed: number;
  monthlyVisitorsLimit: number;
  whatsappClicksUsed: number;
  whatsappClicksLimit: number;
  inquiriesUsed: number;
  inquiriesLimit: number | null;
  storageUsedGb: number;
  storageLimitGb: number;
  storageImagesUsed: number;
  template: string;
  designSettings: {
    colorTheme: string;
    customColors: {
      primary?: string;
      accent?: string;
      page?: string;
      text?: string;
    };
    logoUrl: string;
    fontStyle: string;
    buttonStyle: string;
    imageStyle: string;
    templateCatalogName: string;
  };
  whatsappNumber: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCta: string;
  about: string;
  features: string[];
  services: ResortOfferData[];
  gallery: string[];
  experiences: string[];
  bookingMessageTemplate: string;
  contentTranslations: ResortContentTranslations;
  language: string;
  timezone: string;
  contactEmail: string;
  isActive: boolean;
  domainStatus: "not_connected" | "pending" | "verified" | "active" | "error";
  sslStatus: "pending" | "active" | "error";
  domainVerifiedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  analytics: SiteAnalyticsSummary;
};

export type InquiryStatus = "new" | "contacted" | "confirmed" | "cancelled";
export type VoucherStatus = "draft" | "issued" | "void";

export type BookingInquiry = {
  id: string;
  resortId: string;
  guestName: string;
  guestContact: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  status: InquiryStatus;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type BookingVoucher = {
  id: string;
  resortId: string;
  inquiryId: string | null;
  roomOfferId: string | null;
  voucherCode: string;
  publicToken: string;
  guestName: string;
  guestContact: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  offerTitle: string;
  roomLabel: string;
  amountNote: string;
  includedNotes: string;
  policyNotes: string;
  status: VoucherStatus;
  issuedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResortOfferData = {
  id: string;
  kind: "room" | "service" | "package";
  title: string;
  description: string;
  priceLabel: string;
  capacity: string;
  imageUrl: string;
  highlight: string;
  duration: string;
  included: string[];
  ctaLabel: string;
  bedType: string;
  roomSize: string;
  viewType: string;
  bathroomInfo: string;
  maxGuests: string;
  roomAmenities: string[];
  sortOrder: number;
  isActive: boolean;
};

export type ResortServiceData = ResortOfferData;

export type SiteAnalyticsEvent = {
  eventType: string;
  source: string;
  createdAt: string;
};

export type SiteAnalyticsDailyPoint = {
  date: string;
  whatsappClicks: number;
  pageViews: number;
};

export type SiteAnalyticsSummary = {
  whatsappClicks7d: number;
  whatsappClicks30d: number;
  pageViews7d: number;
  pageViews30d: number;
  recentEvents: SiteAnalyticsEvent[];
  dailyClicks: SiteAnalyticsDailyPoint[];
};

export type WebsiteReview = {
  id: string;
  resortId?: string;
  guestName: string;
  rating: number;
  reviewText: string;
  sourceLabel: "Manual" | "Google" | "Guest Message";
  stayDate?: string;
  status: "published" | "draft";
  showOnWebsite: boolean;
  featured: boolean;
  sortOrder?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GoogleReviewsSyncFeature = {
  title: string;
  description: string;
  status: "coming_soon";
};

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
};

export type UsageMetric = {
  label: string;
  used: number;
  limit: number;
  unit: string;
};

export type SetupStep = {
  title: string;
  description: string;
  status: "Done" | "Current" | "Next";
};

export type ContentSection = {
  title: string;
  description: string;
  status: "Ready" | "Needs review" | "Draft";
};

export type TemplateOption = {
  name: string;
  description: string;
  selected?: boolean;
};

export type SiteStructurePage = {
  name: string;
  slug: string;
  pageType: SitePageType;
  isPublished: boolean;
  heroImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  settings?: SitePageSettings;
  locked?: boolean;
};

export type SiteStructureSection = {
  name: string;
  description: string;
  isEnabled?: boolean;
  locked?: boolean;
  lockReason?: string;
};

export type PlanOption = {
  name: "Seed Trial" | "Seed" | "Tree" | "Forest";
  price: string;
  positioning: string;
  features: string[];
  current?: boolean;
};
