import { NextRequest, NextResponse } from "next/server";

type ListingDraft = {
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
};

function normalizeUrl(value: unknown) {
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

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function titleFromUrl(url: URL) {
  const lastPath = url.pathname.split("/").filter(Boolean).at(-1) ?? url.hostname;
  return lastPath
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fallbackDraft(url: URL): ListingDraft {
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

async function fetchListingText(url: URL) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; TravelseedBot/0.1; +https://travelseed.vercel.app)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return "";
    }

    return textFromHtml(await response.text());
  } catch {
    return "";
  }
}

function parseJsonObject(value: string) {
  const jsonMatch = value.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]) as ListingDraft;
  } catch {
    return null;
  }
}

async function createAiDraft(url: URL, listingText: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const prompt = `Create a direct-booking resort website draft from this OTA listing.

Return only compact JSON with these keys:
name, slug, location, type, template_id, hero_title, hero_subtitle, description, capacity, bedrooms, bathrooms, features, experiences.

Rules:
- template_id must be one of: boutique-villa, surf-camp, minimal-stay.
- features and experiences must be arrays of short strings.
- capacity, bedrooms, bathrooms should be strings if known.
- Do not invent precise room counts if they are not present.
- Use polished boutique hospitality copy, not generic SaaS copy.

Listing URL: ${url.toString()}
Listing text:
${listingText || "The OTA page text could not be fetched. Use the URL only and leave uncertain fields blank."}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You turn OTA listing information into structured direct-booking website drafts.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("AI draft generation failed.");
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? parseJsonObject(content) : null;
}

// Imports public OTA listing details and turns them into a resort form draft.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const url = normalizeUrl(body?.url);

  if (!url) {
    return NextResponse.json({ error: "Enter a valid OTA listing URL." }, { status: 400 });
  }

  const listingText = await fetchListingText(url);

  try {
    const aiDraft = await createAiDraft(url, listingText);

    if (aiDraft) {
      return NextResponse.json({
        draft: { ...fallbackDraft(url), ...aiDraft },
        sourceTextAvailable: Boolean(listingText),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI draft generation failed." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      draft: fallbackDraft(url),
      sourceTextAvailable: Boolean(listingText),
      warning: "OPENAI_API_KEY is not configured yet, so Travelseed created a basic URL draft.",
    },
    { status: 200 },
  );
}
