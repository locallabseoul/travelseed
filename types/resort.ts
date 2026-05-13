export type ResortTemplateId = "boutique-villa" | "surf-camp" | "minimal-stay";

export type Resort = {
  id: string;
  owner_user_id: string | null;
  owner_email: string | null;
  slug: string;
  name: string;
  domain: string | null;
  template_id: string;
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
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ResortInsert = Omit<Resort, "id" | "owner_user_id" | "owner_email"> & {
  owner_user_id?: string | null;
  owner_email?: string | null;
};

export type ResortUpsert = ResortInsert & {
  updated_at?: string;
};

export type ResortWithMetrics = Resort & {
  whatsapp_clicks_count?: number;
  analytics?: {
    whatsappClicks7d: number;
    whatsappClicks30d: number;
    recentEvents: Array<{
      eventType: string;
      source: string;
      createdAt: string;
    }>;
    dailyClicks: Array<{
      date: string;
      whatsappClicks: number;
    }>;
  };
};
