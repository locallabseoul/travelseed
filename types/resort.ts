export type ResortTemplateId = "boutique-villa" | "surf-camp" | "minimal-stay";

export type Resort = {
  id: string;
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
};

export type ResortInsert = Omit<Resort, "id">;

export type ResortUpsert = Omit<Resort, "id"> & {
  updated_at?: string;
};
