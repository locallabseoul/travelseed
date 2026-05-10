import type { Resort } from "@/types/resort";

// Local fallback data so the sample tenant works before Supabase is connected.
export const sampleResorts: Resort[] = [
  {
    id: "local-villa-jeruk",
    slug: "villa-jeruk",
    name: "Villa Jeruk",
    domain: null,
    template_id: "boutique-villa",
    location: "Selong Belanak, Lombok, Indonesia",
    type: "Private tropical villa",
    description:
      "A private tropical villa for families, surfers, and remote workers looking for a calm base near South Lombok beaches.",
    hero_title: "Private Tropical Escape in Selong Belanak",
    hero_subtitle: "3-bedroom villa with private pool near Lombok's most beautiful beaches",
    hero_image_url:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2200&q=85",
    whatsapp_number: "6281234567890",
    capacity: 6,
    bedrooms: 3,
    bathrooms: 2,
    features: [
      "Private Pool",
      "Fast WiFi",
      "Fully Equipped Kitchen",
      "Open Living Area",
      "Tropical Garden",
      "Complimentary Bicycles",
      "Family Friendly",
      "Surf Friendly",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1529290130-4ca3753253ae?auto=format&fit=crop&w=1200&q=85",
    ],
    experiences: [
      "Selong Belanak Beach",
      "Surfing",
      "Sunset Beaches",
      "Local Cafes",
      "Long Stay Remote Work",
    ],
    booking_message_template: `Hello, I would like to make a reservation at Villa Jeruk.
Check-in:
Check-out:
Guests:
Airport Pickup:`,
    is_active: true,
  },
];

export function getSampleResortBySlug(slug: string) {
  return sampleResorts.find((resort) => resort.slug === slug && resort.is_active) ?? null;
}
