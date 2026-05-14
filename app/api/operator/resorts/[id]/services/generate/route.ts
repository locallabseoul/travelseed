import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { Resort, ResortServiceInput } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type GeneratedService = Required<Pick<ResortServiceInput, "kind" | "title">> &
  Pick<ResortServiceInput, "description" | "price_label" | "capacity" | "image_url" | "highlight" | "duration" | "included" | "cta_label">;

const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

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

function fallbackServices(resort: Resort): GeneratedService[] {
  const images = [resort.hero_image_url, ...resort.gallery].filter(Boolean) as string[];
  const businessType = `${resort.type ?? ""} ${resort.template_id}`.toLowerCase();
  const isSurf = businessType.includes("surf");
  const isVilla = businessType.includes("villa");

  if (isSurf) {
    return [
      {
        kind: "package",
        title: "3-Night Surf & Stay Package",
        description: `A simple package for guests who want to stay at ${resort.name}, surf nearby breaks, and coordinate everything directly with the host.`,
        price_label: "Ask for seasonal rates",
        capacity: resort.capacity,
        image_url: imageFor(images, 0),
        highlight: "Most popular",
        duration: "3 nights",
        included: ["Accommodation", "Daily breakfast", "Surf session planning", "WhatsApp booking support"],
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
        description: "Private airport transfer arranged before arrival so guests can reach the property without extra coordination.",
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
        description: `A private stay at ${resort.name} for guests who want calm spaces, easy direct booking, and a comfortable base in ${resort.location}.`,
        price_label: "Ask for nightly rates",
        capacity: resort.capacity,
        image_url: imageFor(images, 0),
        highlight: "Best for families",
        duration: "Per night",
        included: ["Private villa access", "Guest support", "Direct booking on WhatsApp"],
        cta_label: "Ask availability",
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
      cta_label: "Ask now",
    },
    {
      kind: "package",
      title: "Custom Guest Package",
      description: "A flexible package that combines the core offer with practical support before arrival.",
      price_label: "Custom quote",
      capacity: resort.capacity,
      image_url: imageFor(images, 1),
      highlight: "Flexible",
      duration: "Custom",
      included: ["Personalized planning", "Direct booking support", "Simple confirmation"],
      cta_label: "Request quote",
    },
  ];
}

function normalizeGeneratedServices(services: GeneratedService[], resort: Resort) {
  const images = [resort.hero_image_url, ...resort.gallery].filter(Boolean) as string[];

  return services.slice(0, 6).map((service, index) => ({
    kind: ["room", "package", "service"].includes(service.kind) ? service.kind : "service",
    title: String(service.title ?? "").trim(),
    description: service.description ? String(service.description).trim() : null,
    price_label: service.price_label ? String(service.price_label).trim() : null,
    capacity: typeof service.capacity === "number" && Number.isFinite(service.capacity) ? service.capacity : null,
    image_url: service.image_url ? String(service.image_url).trim() : imageFor(images, index),
    highlight: service.highlight ? String(service.highlight).trim() : null,
    duration: service.duration ? String(service.duration).trim() : null,
    included: Array.isArray(service.included) ? service.included.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 6) : [],
    cta_label: service.cta_label ? String(service.cta_label).trim() : "Ask availability",
    sort_order: index,
    is_active: true,
  })).filter((service) => service.title);
}

function extractOutputText(response: unknown) {
  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") {
    return outputText;
  }

  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  return output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n") ?? "";
}

async function generateWithOpenAi(resort: Resort): Promise<GeneratedService[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

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
            "You generate concise JSON for a direct booking hospitality console. Return only JSON. Do not invent unavailable facts. Use the provided gallery images only for image_url.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: "Generate 3 to 5 rooms, packages, or services for this property. Include a practical mix for direct WhatsApp booking.",
            resort: {
              name: resort.name,
              type: resort.type,
              template_id: resort.template_id,
              location: resort.location,
              description: resort.description,
              features: resort.features,
              capacity: resort.capacity,
              bedrooms: resort.bedrooms,
              bathrooms: resort.bathrooms,
              images: [resort.hero_image_url, ...resort.gallery].filter(Boolean),
            },
            schema: {
              services: [
                {
                  kind: "room | package | service",
                  title: "short guest-facing title",
                  description: "1-2 sentence description",
                  price_label: "short display price or inquiry label",
                  capacity: "number or null",
                  image_url: "one provided image URL or null",
                  highlight: "short badge",
                  duration: "short duration label",
                  included: ["3-5 concise included items"],
                  cta_label: "short CTA label",
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
  const parsed = JSON.parse(outputText) as { services?: GeneratedService[] };

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
