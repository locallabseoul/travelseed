export type ListingDraft = {
  name?: string;
  slug?: string;
  location?: string;
  type?: string;
  template_id?: string;
  hero_title?: string;
  hero_subtitle?: string;
  description?: string;
  capacity?: string;
  bedrooms?: string;
  bathrooms?: string;
  features?: string[];
  experiences?: string[];
  booking_message_template?: string;
};

export type ListingServiceDraft = {
  kind: "room" | "package" | "service";
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
};

export type ListingImportDraft = {
  site: ListingDraft;
  services: ListingServiceDraft[];
};

export type ListingSource = {
  url: string;
  host: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  jsonLd: unknown[];
  bodyText: string;
  imageUrls: string[];
};

export function normalizeListingUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function matchFirst(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function metaContent(html: string, key: string) {
  const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const propertyFirst = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedKey}["'][^>]*>`,
    "i",
  );

  return matchFirst(html, propertyFirst) || matchFirst(html, contentFirst);
}

function parseJsonLd(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  return scripts
    .slice(0, 8)
    .map((script) => stripTags(script[1] ?? ""))
    .map((content) => {
      try {
        return JSON.parse(content) as unknown;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function extractImageUrls(html: string) {
  return [
    metaContent(html, "og:image"),
    metaContent(html, "og:image:url"),
    metaContent(html, "twitter:image"),
  ].filter(Boolean);
}

function sourceFromHtml(url: URL, html: string): ListingSource {
  return {
    url: url.toString(),
    host: url.hostname,
    title: matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: metaContent(html, "description"),
    ogTitle: metaContent(html, "og:title"),
    ogDescription: metaContent(html, "og:description"),
    jsonLd: parseJsonLd(html),
    bodyText: textFromHtml(html),
    imageUrls: extractImageUrls(html),
  };
}

function titleFromUrl(url: URL) {
  const lastPath = url.pathname.split("/").filter(Boolean).at(-1) ?? url.hostname;
  return lastPath
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function fallbackDraft(url: URL): ListingDraft {
  const name = titleFromUrl(url);

  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    template_id: "boutique-villa",
    hero_title: `Direct booking for ${name}`,
    hero_subtitle: "Review and refine this AI-ready draft before publishing.",
    description: `Imported from ${url.hostname}. Add property details, photos, and booking information before launch.`,
  };
}

export async function fetchListingSource(url: URL): Promise<ListingSource> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; TravelseedBot/0.1; +https://travelseed.vercel.app)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return sourceFromHtml(url, "");
    }

    return sourceFromHtml(url, await response.text());
  } catch {
    return sourceFromHtml(url, "");
  }
}

function parseJsonObject<T>(value: string) {
  const jsonMatch = value.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

function extractOutputText(response: unknown) {
  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") {
    return outputText;
  }

  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  return output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n") ?? "";
}

export function summarizeSource(source: ListingSource) {
  return JSON.stringify(
    {
      url: source.url,
      host: source.host,
      title: source.title,
      metaDescription: source.metaDescription,
      ogTitle: source.ogTitle,
      ogDescription: source.ogDescription,
      jsonLd: source.jsonLd,
      imageUrls: source.imageUrls,
      bodyText: source.bodyText,
    },
    null,
    2,
  ).slice(0, 18000);
}

const serviceDraftSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "kind",
    "title",
    "description",
    "price_label",
    "capacity",
    "image_url",
    "highlight",
    "duration",
    "included",
    "cta_label",
    "bed_type",
    "room_size",
    "view_type",
    "bathroom_info",
    "max_guests",
    "room_amenities",
  ],
  properties: {
    kind: { type: "string", enum: ["room", "package", "service"] },
    title: { type: "string" },
    description: { type: ["string", "null"] },
    price_label: { type: ["string", "null"] },
    capacity: { type: ["number", "null"] },
    image_url: { type: ["string", "null"] },
    highlight: { type: ["string", "null"] },
    duration: { type: ["string", "null"] },
    included: { type: "array", items: { type: "string" } },
    cta_label: { type: ["string", "null"] },
    bed_type: { type: ["string", "null"] },
    room_size: { type: ["string", "null"] },
    view_type: { type: ["string", "null"] },
    bathroom_info: { type: ["string", "null"] },
    max_guests: { type: ["number", "null"] },
    room_amenities: { type: "array", items: { type: "string" } },
  },
};

const listingImportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["site", "services"],
  properties: {
    site: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "slug",
        "location",
        "type",
        "template_id",
        "hero_title",
        "hero_subtitle",
        "description",
        "capacity",
        "bedrooms",
        "bathrooms",
        "features",
        "experiences",
        "booking_message_template",
      ],
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
        location: { type: "string" },
        type: { type: "string" },
        template_id: { type: "string", enum: ["boutique-villa", "boutique-resort", "surf-camp", "minimal-stay"] },
        hero_title: { type: "string" },
        hero_subtitle: { type: "string" },
        description: { type: "string" },
        capacity: { type: "string" },
        bedrooms: { type: "string" },
        bathrooms: { type: "string" },
        features: { type: "array", items: { type: "string" } },
        experiences: { type: "array", items: { type: "string" } },
        booking_message_template: { type: "string" },
      },
    },
    services: {
      type: "array",
      items: serviceDraftSchema,
    },
  },
};

const brandCopySchema = {
  type: "object",
  additionalProperties: false,
  required: ["hero_title", "hero_subtitle", "description", "features", "experiences", "booking_message_template"],
  properties: {
    hero_title: { type: "string" },
    hero_subtitle: { type: "string" },
    description: { type: "string" },
    features: { type: "array", items: { type: "string" } },
    experiences: { type: "array", items: { type: "string" } },
    booking_message_template: { type: "string" },
  },
};

async function requestJsonObject<T>(prompt: string, system: string, schemaName: string, schema: object) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("AI draft generation failed.");
  }

  const data = await response.json();
  const content = extractOutputText(data);
  return typeof content === "string" ? parseJsonObject<T>(content) : null;
}

function compactList(value: unknown, limit: number) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean).slice(0, limit) : [];
}

export function normalizeListingServices(services: unknown, imageUrls: string[] = []): ListingServiceDraft[] {
  if (!Array.isArray(services)) {
    return [];
  }

  return services.slice(0, 5).map((service, index) => {
    const value = service as Partial<ListingServiceDraft>;
    const kind = value.kind && ["room", "package", "service"].includes(value.kind) ? value.kind : "service";
    const isRoom = kind === "room";
    const imageUrl = value.image_url ? String(value.image_url).trim() : imageUrls[index % imageUrls.length] ?? null;

    return {
      kind,
      title: String(value.title ?? "").trim(),
      description: value.description ? String(value.description).trim() : null,
      price_label: value.price_label ? String(value.price_label).trim() : "Ask for rates",
      capacity: typeof value.capacity === "number" && Number.isFinite(value.capacity) ? value.capacity : null,
      image_url: imageUrl,
      highlight: value.highlight ? String(value.highlight).trim() : null,
      duration: value.duration ? String(value.duration).trim() : null,
      included: compactList(value.included, 6),
      cta_label: value.cta_label ? String(value.cta_label).trim() : kind === "room" ? "Check availability" : "Ask availability",
      bed_type: isRoom && value.bed_type ? String(value.bed_type).trim() : null,
      room_size: isRoom && value.room_size ? String(value.room_size).trim() : null,
      view_type: isRoom && value.view_type ? String(value.view_type).trim() : null,
      bathroom_info: isRoom && value.bathroom_info ? String(value.bathroom_info).trim() : null,
      max_guests: isRoom && typeof value.max_guests === "number" && Number.isFinite(value.max_guests) ? value.max_guests : null,
      room_amenities: isRoom ? compactList(value.room_amenities, 8) : [],
    };
  }).filter((service) => service.title);
}

export async function createAiListingDraft(url: URL, source: ListingSource): Promise<ListingImportDraft | null> {
  const prompt = `Create a direct-booking resort website draft and bookable offer draft from this OTA listing.

Return only compact JSON with these keys:
site, services.

Rules:
- site.template_id must be one of: boutique-villa, boutique-resort, surf-camp, minimal-stay.
- site.description must be a polished short description of 2-4 sentences for the form's Short description field.
- site.hero_title must be emotional and specific, not just "Direct booking for X".
- site.hero_subtitle must summarize the strongest stay promise in one sentence.
- site.features must contain 6-10 guest-facing amenities or stay strengths. Use exact amenities from the source when available; otherwise infer only broad, reasonable strengths from the property type and description.
- site.experiences must contain 4-8 nearby activities, destination themes, or guest use cases.
- site.capacity, site.bedrooms, site.bathrooms should be numeric strings only if known. Leave blank if not present.
- site.booking_message_template must start with "Hello, I would like to make a reservation at {property name}." and include Check-in, Check-out, Guests, and Airport Pickup fields.
- services must contain 3-5 room, package, or service items suitable for direct WhatsApp booking.
- Use room kind for accommodation units only. Use package kind for bundles. Use service kind for add-ons, activities, transfers, or rentals.
- Use exact price labels only if present. Otherwise use "Ask for rates" or "Ask for pricing".
- Do not invent exact amenities, ratings, awards, room counts, distances, or prices unless present in the source.
- Prefer structured data, meta description, OG description, and visible listing text over URL guesses.
- Do not leave useful copy fields empty if the source contains enough context to create a useful draft.
- Use polished boutique hospitality copy, not generic SaaS copy.

Listing source:
${summarizeSource(source)}`;

  const generated = await requestJsonObject<ListingImportDraft>(
    prompt,
    "You turn OTA listing information into complete structured direct-booking website drafts. Always return valid JSON only.",
    "listing_import_draft",
    listingImportSchema,
  );

  return generated ? { site: generated.site, services: normalizeListingServices(generated.services, source.imageUrls) } : null;
}

export type BrandCopyDraft = {
  hero_title?: string;
  hero_subtitle?: string;
  description?: string;
  features?: string[];
  experiences?: string[];
  booking_message_template?: string;
};

export async function createAiBrandCopyDraft(input: {
  name: string;
  location: string;
  type: string;
  currentCopy: BrandCopyDraft;
  existingText?: string;
  listingSource?: ListingSource | null;
}) {
  const prompt = `Create a direct-booking brand copy pack for this resort.

Return only compact JSON with these keys:
hero_title, hero_subtitle, description, features, experiences, booking_message_template.

Rules:
- hero_title must be guest-facing, specific, and suitable for a homepage hero.
- hero_subtitle must be one clear sentence explaining the stay promise.
- description must be 2-4 polished hospitality sentences.
- features must contain 6-10 practical guest-facing amenities or strengths.
- experiences must contain 4-8 nearby activities, destination themes, or guest use cases.
- booking_message_template must start with "Hello, I would like to make a reservation at ${input.name}." and include Check-in, Check-out, Guests, and Airport Pickup fields.
- Preserve true operational details. Do not invent exact amenities, ratings, awards, room counts, or distances unless present in the input.
- Use warm direct-booking hospitality copy, not generic marketing filler.

Property:
${JSON.stringify(
  {
    name: input.name,
    location: input.location,
    type: input.type,
    currentCopy: input.currentCopy,
    existingText: input.existingText ?? "",
    listingSource: input.listingSource ? summarizeSource(input.listingSource) : null,
  },
  null,
  2,
)}`;

  return requestJsonObject<BrandCopyDraft>(
    prompt,
    "You create concise direct-booking resort copy packs for hospitality operators. Always return valid JSON only.",
    "brand_copy_draft",
    brandCopySchema,
  );
}
