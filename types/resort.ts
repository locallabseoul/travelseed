export type ResortTemplateId = "boutique-villa" | "boutique-resort" | "surf-camp" | "minimal-stay";
export type ResortPlan = "Seed Trial" | "Seed" | "Tree" | "Forest";
export type ResortPlanType = "freeTrial" | "seed" | "tree" | "forest";
export type ResortSiteType = "landing" | "multipage" | "custom";
export type DomainStatus = "not_connected" | "pending" | "verified" | "active" | "error";
export type SslStatus = "pending" | "active" | "error";
export type ResortOfferKind = "room" | "service" | "package";
export type ResortReviewSourceLabel = "Manual" | "Google" | "Guest Message";
export type BookingVoucherStatus = "draft" | "issued" | "void";

export type ResortDesignSettings = {
  colorTheme?: string;
  customColors?: {
    primary?: string;
    accent?: string;
    page?: string;
    text?: string;
  };
  logoUrl?: string;
  fontStyle?: string;
  buttonStyle?: string;
  imageStyle?: string;
  templateCatalogName?: string;
};

export type ResortContentTranslationLocale = "id";

export type ResortContentTranslationPack = {
  generatedAt: string;
  sourceHash: string;
  translatedHash: string;
  locale: ResortContentTranslationLocale;
  resort: {
    name?: string;
    location?: string;
    type?: string;
    description?: string;
    hero_title?: string;
    hero_subtitle?: string;
    features?: string[];
    experiences?: string[];
    booking_message_template?: string;
  };
  services?: Record<string, {
    title?: string;
    description?: string;
    price_label?: string;
    highlight?: string;
    duration?: string;
    included?: string[];
    cta_label?: string;
    bed_type?: string;
    room_size?: string;
    view_type?: string;
    bathroom_info?: string;
    room_amenities?: string[];
  }>;
  pages?: Record<string, {
    title?: string;
    seo_title?: string;
    seo_description?: string;
    settings?: Record<string, unknown>;
  }>;
  navigation_items?: Record<string, {
    label?: string;
  }>;
};

export type ResortContentTranslations = Partial<Record<ResortContentTranslationLocale, ResortContentTranslationPack>>;

export type Resort = {
  id: string;
  owner_user_id: string | null;
  owner_email: string | null;
  slug: string;
  name: string;
  domain: string | null;
  template_id: string;
  plan?: ResortPlan;
  plan_type?: ResortPlanType;
  site_type?: ResortSiteType;
  location: string;
  type: string | null;
  description: string | null;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  whatsapp_number: string;
  capacity: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string[];
  gallery: string[];
  experiences: string[];
  booking_message_template: string | null;
  design_settings?: ResortDesignSettings;
  content_translations?: ResortContentTranslations;
  is_active: boolean;
  domain_status?: DomainStatus;
  ssl_status?: SslStatus;
  domain_verified_at?: string | null;
  services?: ResortOffer[];
  reviews?: ResortWebsiteReview[];
  pages?: ResortSitePage[];
  sections?: ResortSiteSection[];
  navigation_items?: ResortNavigationItem[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortOffer = {
  id: string;
  resort_id: string;
  kind: ResortOfferKind;
  title: string;
  description: string | null;
  price_label: string | null;
  capacity: number | null;
  image_url: string | null;
  highlight?: string | null;
  duration?: string | null;
  included?: string[];
  cta_label?: string | null;
  bed_type?: string | null;
  room_size?: string | null;
  view_type?: string | null;
  bathroom_info?: string | null;
  max_guests?: number | null;
  room_amenities?: string[];
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortOfferInput = {
  id?: string;
  kind: ResortOfferKind;
  title: string;
  description?: string | null;
  price_label?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  highlight?: string | null;
  duration?: string | null;
  included?: string[];
  cta_label?: string | null;
  bed_type?: string | null;
  room_size?: string | null;
  view_type?: string | null;
  bathroom_info?: string | null;
  max_guests?: number | null;
  room_amenities?: string[];
  sort_order?: number;
  is_active?: boolean;
};

export type ResortServiceKind = ResortOfferKind;
export type ResortService = ResortOffer;
export type ResortServiceInput = ResortOfferInput;

export type ResortSiteSectionInput = {
  id?: string;
  section_key: string;
  label: string;
  is_enabled?: boolean;
  is_locked?: boolean;
  sort_order?: number;
  settings?: Record<string, unknown>;
};

export type ResortSitePageInput = {
  id?: string;
  title: string;
  slug: string;
  page_type?: ResortSitePage["page_type"];
  is_published?: boolean;
  hero_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number;
  settings?: Record<string, unknown>;
};

export type ResortNavigationItemInput = {
  id?: string;
  label: string;
  href: string;
  page_id?: string | null;
  is_enabled?: boolean;
  sort_order?: number;
};

export type ResortWebsiteReview = {
  id: string;
  resort_id: string;
  guest_name: string;
  rating: number;
  review_text: string;
  source_label: ResortReviewSourceLabel;
  stay_date: string | null;
  status: "published" | "draft";
  show_on_website: boolean;
  featured: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortSiteSection = {
  id: string;
  resort_id: string;
  section_key: string;
  label: string;
  is_enabled: boolean;
  is_locked: boolean;
  sort_order: number;
  settings?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortSitePage = {
  id: string;
  resort_id: string;
  title: string;
  slug: string;
  page_type: "Standard" | "Landing" | "Event" | "Wedding" | "Tour" | "Membership";
  is_published: boolean;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  settings?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortNavigationItem = {
  id: string;
  resort_id: string;
  label: string;
  href: string;
  page_id: string | null;
  is_enabled: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortBookingVoucher = {
  id: string;
  resort_id: string;
  inquiry_id: string | null;
  room_offer_id: string | null;
  voucher_code: string;
  public_token: string;
  guest_name: string;
  guest_contact: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  offer_title: string | null;
  room_label: string | null;
  amount_note: string | null;
  included_notes: string | null;
  policy_notes: string | null;
  status: BookingVoucherStatus;
  issued_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ResortInsert = Omit<Resort, "id" | "owner_user_id" | "owner_email"> & {
  owner_user_id?: string | null;
  owner_email?: string | null;
};

export type ResortUpsert = ResortInsert & {
  domain_status?: DomainStatus;
  ssl_status?: SslStatus;
  domain_verified_at?: string | null;
  updated_at?: string;
};

export type ResortWithMetrics = Resort & {
  whatsapp_clicks_count?: number;
  page_views_count?: number;
  inquiries_count?: number;
  storage_images_count?: number;
  analytics?: {
    whatsappClicks7d: number;
    whatsappClicks30d: number;
    pageViews7d: number;
    pageViews30d: number;
    recentEvents: Array<{
      eventType: string;
      source: string;
      createdAt: string;
    }>;
    dailyClicks: Array<{
      date: string;
      whatsappClicks: number;
      pageViews: number;
    }>;
  };
};
