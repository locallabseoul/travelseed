export type ResortTemplateId = "boutique-villa" | "surf-camp" | "minimal-stay";
export type ResortPlan = "Seed Trial" | "Seed" | "Tree" | "Forest";
export type DomainStatus = "not_connected" | "pending" | "verified" | "active" | "error";
export type SslStatus = "pending" | "active" | "error";
export type ResortServiceKind = "room" | "service" | "package";
export type ResortReviewSourceLabel = "Manual" | "Google" | "Guest Message";

export type ResortDesignSettings = {
  colorTheme?: string;
  logoUrl?: string;
  fontStyle?: string;
  buttonStyle?: string;
  imageStyle?: string;
};

export type Resort = {
  id: string;
  owner_user_id: string | null;
  owner_email: string | null;
  slug: string;
  name: string;
  domain: string | null;
  template_id: string;
  plan?: ResortPlan;
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
  is_active: boolean;
  domain_status?: DomainStatus;
  ssl_status?: SslStatus;
  domain_verified_at?: string | null;
  services?: ResortService[];
  reviews?: ResortWebsiteReview[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortService = {
  id: string;
  resort_id: string;
  kind: ResortServiceKind;
  title: string;
  description: string | null;
  price_label: string | null;
  capacity: number | null;
  image_url: string | null;
  highlight?: string | null;
  duration?: string | null;
  included?: string[];
  cta_label?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortServiceInput = {
  id?: string;
  kind: ResortServiceKind;
  title: string;
  description?: string | null;
  price_label?: string | null;
  capacity?: number | null;
  image_url?: string | null;
  highlight?: string | null;
  duration?: string | null;
  included?: string[];
  cta_label?: string | null;
  sort_order?: number;
  is_active?: boolean;
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
