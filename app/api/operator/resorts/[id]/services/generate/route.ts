import { NextResponse } from "next/server";
import { businessCategoryFromType } from "@/lib/business-categories";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { Resort, ResortOfferInput } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type GeneratedOffer = Required<Pick<ResortOfferInput, "kind" | "title">> &
  Pick<ResortOfferInput, "description" | "price_label" | "capacity" | "image_url" | "highlight" | "duration" | "included" | "cta_label" | "bed_type" | "room_size" | "view_type" | "bathroom_info" | "max_guests" | "room_amenities">;

const openAiModel = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

function userError(check: Awaited<ReturnType<typeof verifyAuthenticatedRequest>>) {
  return NextResponse.json({ error: check.ok ? "Unexpected session check state." : check.message }, {
    status: check.ok ? 500 : check.status,
  });
}

function canManageResort(resort: Resort, user: Extract<Awaited<ReturnType<typeof verifyAuthenticatedRequest>>, { ok: true }>) {
  if (resort.owner_user_id) {
    return resort.owner_user_id === user.userId;
  }

  if (resort.owner_email) {
    return resort.owner_email === user.email;
  }

  return false;
}

function imageFor(images: string[], index: number) {
  return images.length > 0 ? images[index % images.length] : null;
}

function fallbackServices(resort: Resort): GeneratedOffer[] {
  const images = [resort.hero_image_url, ...resort.gallery].filter(Boolean) as string[];
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const businessType = `${resort.type ?? ""} ${resort.template_id}`.toLowerCase();
  const isSurf = businessType.includes("surf");
  const isVilla = businessType.includes("villa");
  const accommodation = category.id === "accommodation";

  if (category.id === "food") {
    return [
      {
        kind: "service",
        title: "Signature Menu Highlight",
        description: `A customer-ready menu highlight from ${resort.name}, easy to ask about or reserve through WhatsApp.`,
        price_label: "Ask for menu",
        capacity: null,
        image_url: imageFor(images, 0),
        highlight: "Popular",
        duration: "Available daily",
        included: ["Menu details", "WhatsApp reservation", "Staff confirmation"],
        cta_label: "Ask menu details",
      },
      {
        kind: "package",
        title: "Group Dining Package",
        description: "A simple dining package for families, teams, or small groups that want to coordinate details in advance.",
        price_label: "Custom quote",
        capacity: resort.capacity,
        image_url: imageFor(images, 1),
        highlight: "Groups",
        duration: "Preferred time",
        included: ["Table reservation", "Set menu planning", "WhatsApp confirmation"],
        cta_label: "Reserve a table",
      },
      {
        kind: "service",
        title: "Takeaway or Catering Request",
        description: "A direct inquiry option for takeaway, catering, or special food requests.",
        price_label: "Ask for pricing",
        capacity: null,
        image_url: imageFor(images, 2),
        highlight: "Flexible",
        duration: "By request",
        included: ["Order details", "Pickup or delivery notes", "WhatsApp support"],
        cta_label: "Order via WhatsApp",
      },
    ];
  }

  if (category.id === "tour") {
    return [
      {
        kind: "package",
        title: "Private Local Tour",
        description: `A flexible tour package from ${resort.name} with itinerary details confirmed directly on WhatsApp.`,
        price_label: "Ask for tour rate",
        capacity: resort.capacity,
        image_url: imageFor(images, 0),
        highlight: "Popular",
        duration: "Full day",
        included: ["Local guide", "Trip planning", "WhatsApp coordination"],
        cta_label: "Ask tour availability",
      },
      {
        kind: "package",
        title: "Custom Group Trip",
        description: "A group-friendly package for customers who want pickup, route planning, or a custom itinerary.",
        price_label: "Custom quote",
        capacity: resort.capacity,
        image_url: imageFor(images, 1),
        highlight: "Groups",
        duration: "Custom",
        included: ["Itinerary planning", "Pickup coordination", "Local support"],
        cta_label: "Request itinerary",
      },
      {
        kind: "service",
        title: "Pickup or Transfer Service",
        description: "A practical transfer add-on for customers who need pickup before or after a tour.",
        price_label: "Ask for pricing",
        capacity: 4,
        image_url: imageFor(images, 2),
        highlight: "Easy pickup",
        duration: "One way",
        included: ["Driver coordination", "Pickup details", "WhatsApp confirmation"],
        cta_label: "Ask pickup details",
      },
    ];
  }

  if (category.id === "wellness") {
    return [
      {
        kind: "service",
        title: "Signature Treatment",
        description: `A clear treatment card for ${resort.name}, ready for appointment requests through WhatsApp.`,
        price_label: "Ask for treatment price",
        capacity: 1,
        image_url: imageFor(images, 0),
        highlight: "Popular",
        duration: "60 minutes",
        included: ["Treatment details", "Appointment coordination", "Aftercare notes"],
        cta_label: "Book appointment",
      },
      {
        kind: "package",
        title: "Wellness Package",
        description: "A bundled package for customers who want to combine treatments or plan a longer wellness visit.",
        price_label: "Custom quote",
        capacity: 2,
        image_url: imageFor(images, 1),
        highlight: "Best value",
        duration: "Custom",
        included: ["Treatment planning", "Staff support", "WhatsApp confirmation"],
        cta_label: "Book package",
      },
      {
        kind: "service",
        title: "Consultation Appointment",
        description: "A simple appointment option for customers who want guidance before choosing a treatment.",
        price_label: "Ask for pricing",
        capacity: 1,
        image_url: imageFor(images, 2),
        highlight: "Consultation",
        duration: "30 minutes",
        included: ["Consultation", "Treatment recommendation", "Schedule support"],
        cta_label: "Ask treatment details",
      },
    ];
  }

  if (isSurf || (accommodation && businessType.includes("tour"))) {
    return [
      {
        kind: "package",
        title: "3-Night Surf & Stay Package",
        description: `A simple package for customers who want to coordinate ${resort.name} directly on WhatsApp.`,
        price_label: "Ask for seasonal rates",
        capacity: resort.capacity,
        image_url: imageFor(images, 0),
        highlight: "Most popular",
        duration: "3 nights",
        included: ["Package planning", "Local guidance", "WhatsApp support"],
        cta_label: "Request package",
      },
      {
        kind: "service",
        title: "Beginner Surf Lesson",
        description: "A beginner-friendly surf lesson with local guidance, ideal for first-time surfers and casual beach days.",
        price_label: "From IDR 450K",
        capacity: 2,
        image_url: imageFor(images, 1),
        highlight: "Beginner friendly",
        duration: "2 hours",
        included: ["Board rental", "Instructor", "Beach coordination"],
        cta_label: "Ask availability",
      },
      {
        kind: "service",
        title: "Airport Pickup",
        description: "Private transfer arranged before arrival so customers can coordinate without extra back-and-forth.",
        price_label: "From IDR 350K",
        capacity: 4,
        image_url: imageFor(images, 2),
        highlight: "Easy arrival",
        duration: "One way",
        included: ["Private driver", "Arrival coordination", "WhatsApp confirmation"],
        cta_label: "Add pickup",
      },
    ];
  }

  if (isVilla) {
    return [
      {
        kind: "room",
        title: "Private Villa Stay",
        description: `A private stay at ${resort.name} for guests who want calm spaces, easy WhatsApp inquiry, and a comfortable base in ${resort.location}.`,
        price_label: "Ask for nightly rates",
        capacity: resort.capacity,
        image_url: imageFor(images, 0),
        highlight: "Best for families",
        duration: "Per night",
        included: ["Private villa access", "Guest support", "Direct WhatsApp inquiry"],
        cta_label: "Ask availability",
        bed_type: resort.bedrooms ? `${resort.bedrooms} bedroom villa` : "Private villa",
        room_size: null,
        view_type: "Garden and pool view",
        bathroom_info: resort.bathrooms ? `${resort.bathrooms} bathrooms` : null,
        max_guests: resort.capacity,
        room_amenities: ["Private pool", "Kitchen", "WiFi"],
      },
      {
        kind: "package",
        title: "Long Stay Villa Package",
        description: "A flexible long-stay option for families, remote workers, and guests planning a slower stay.",
        price_label: "Weekly and monthly rates available",
        capacity: resort.capacity,
        image_url: imageFor(images, 1),
        highlight: "Long stay",
        duration: "7+ nights",
        included: ["Weekly rate", "Local recommendations", "Flexible arrival support"],
        cta_label: "Request long stay",
      },
      {
        kind: "service",
        title: "Airport Pickup",
        description: "A private pickup option to help guests arrive smoothly from the airport to the villa.",
        price_label: "From IDR 350K",
        capacity: 4,
        image_url: imageFor(images, 2),
        highlight: "Guest favorite",
        duration: "One way",
        included: ["Private driver", "Arrival coordination", "WhatsApp confirmation"],
        cta_label: "Add pickup",
      },
    ];
  }

  return [
    {
      kind: "service",
      title: "Signature Service",
      description: `A clear, bookable service from ${resort.name}, presented for direct inquiries through WhatsApp.`,
      price_label: "Ask for pricing",
      capacity: null,
      image_url: imageFor(images, 0),
      highlight: "Recommended",
      duration: "Flexible",
      included: ["Direct inquiry", "WhatsApp coordination", "Local support"],
      cta_label: category.primaryCta,
    },
    {
      kind: "package",
      title: "Custom Customer Package",
      description: "A flexible package that combines the core offer with practical support before the customer visits, books, or orders.",
      price_label: "Custom quote",
      capacity: resort.capacity,
      image_url: imageFor(images, 1),
      highlight: "Flexible",
      duration: "Custom",
      included: ["Personalized planning", "WhatsApp support", "Simple confirmation"],
      cta_label: "Request quote",
    },
  ];
}

function normalizeGeneratedServices(services: GeneratedOffer[], resort: Resort) {
  const images = [resort.hero_image_url, ...resort.gallery].filter(Boolean) as string[];
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const accommodation = category.id === "accommodation";

  return services.slice(0, 6).map((service, index) => {
    const rawKind = ["room", "package", "service"].includes(service.kind) ? service.kind : "service";
    const kind = rawKind === "room" && !accommodation ? "service" : rawKind;
    const isRoom = kind === "room";

    return {
      kind,
      title: String(service.title ?? "").trim(),
      description: service.description ? String(service.description).trim() : null,
      price_label: service.price_label ? String(service.price_label).trim() : null,
      capacity: typeof service.capacity === "number" && Number.isFinite(service.capacity) ? service.capacity : null,
      image_url: service.image_url ? String(service.image_url).trim() : imageFor(images, index),
      highlight: service.highlight ? String(service.highlight).trim() : null,
      duration: service.duration ? String(service.duration).trim() : null,
      included: Array.isArray(service.included) ? service.included.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 6) : [],
      cta_label: service.cta_label ? String(service.cta_label).trim() : (isRoom ? "Ask availability" : category.primaryCta),
      bed_type: isRoom ? service.bed_type ? String(service.bed_type).trim() : null : null,
      room_size: isRoom ? service.room_size ? String(service.room_size).trim() : null : null,
      view_type: isRoom ? service.view_type ? String(service.view_type).trim() : null : null,
      bathroom_info: isRoom ? service.bathroom_info ? String(service.bathroom_info).trim() : null : null,
      max_guests: isRoom && typeof service.max_guests === "number" && Number.isFinite(service.max_guests) ? service.max_guests : null,
      room_amenities: isRoom && Array.isArray(service.room_amenities) ? service.room_amenities.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8) : [],
      sort_order: index,
      is_active: true,
    };
  }).filter((service) => service.title);
}

function extractOutputText(response: unknown) {
  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") {
    return outputText;
  }

  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  return output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n") ?? "";
}

async function generateWithOpenAi(resort: Resort): Promise<GeneratedOffer[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: openAiModel,
      input: [
        {
          role: "system",
          content:
            "You generate concise JSON for a WhatsApp-first business website console. Return only JSON. Do not invent unavailable facts. Use the provided gallery images only for image_url. Prefer service and package offers; use room only when the business is clearly Resort / Villa / Hotel accommodation.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: "Generate 3 to 5 services, packages, products, menu items, tours, treatments, appointment options, or room offers for this business. Use rooms only for accommodation businesses. Include category-specific CTAs for direct WhatsApp inquiries.",
            resort: {
              name: resort.name,
              type: resort.type,
              category: category.label,
              template_id: resort.template_id,
              location: resort.location,
              description: resort.description,
              features: resort.features,
              capacity: resort.capacity,
              bedrooms: resort.bedrooms,
              bathrooms: resort.bathrooms,
              accommodation: category.id === "accommodation",
              images: [resort.hero_image_url, ...resort.gallery].filter(Boolean),
            },
            cta_guidance: category.ctaOptions,
            schema: {
              services: [
                {
                  kind: "room | package | service",
                  title: "short customer-facing title",
                  description: "1-2 sentence description",
                  price_label: "short display price or inquiry label",
                  capacity: "number or null",
                  image_url: "one provided image URL or null",
                  highlight: "short badge",
                  duration: "short duration label",
                  included: ["3-5 concise included items"],
                  cta_label: "short CTA label",
                  bed_type: "room-only bed setup or null",
                  room_size: "room-only size label or null",
                  view_type: "room-only view label or null",
                  bathroom_info: "room-only bathroom label or null",
                  max_guests: "room-only number or null",
                  room_amenities: ["room-only amenities"],
                },
              ],
            },
          }),
        },
      ],
      text: { format: { type: "json_object" } },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json().catch(() => null);
  const outputText = extractOutputText(data);
  const parsed = JSON.parse(outputText) as { services?: GeneratedOffer[] };

  return Array.isArray(parsed.services) ? parsed.services : null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data: resort, error } = await supabase
    .from("resorts")
    .select("*, services:resort_services(*)")
    .eq("id", id)
    .single();

  if (error || !resort) {
    return NextResponse.json({ error: error?.message ?? "Site not found." }, { status: 404 });
  }

  if (!canManageResort(resort as Resort, user)) {
    return NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 });
  }

  const generated = await generateWithOpenAi(resort as Resort).catch(() => null);
  const services = normalizeGeneratedServices(generated ?? fallbackServices(resort as Resort), resort as Resort);

  return NextResponse.json({
    services,
    source: generated ? "ai" : "fallback",
  });
}
