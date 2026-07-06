import { NextResponse } from "next/server";
import {
  contentTranslationHash,
  contentTranslationSource,
  nextContentTranslations,
} from "@/lib/content-translations";
import {
  createServiceRoleClient,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort, ResortContentTranslationPack } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const openAiModel = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";

type TranslationAiResult = {
  resort: ResortContentTranslationPack["resort"];
  services: Array<NonNullable<ResortContentTranslationPack["services"]>[string] & { id: string }>;
  pages: Array<Omit<NonNullable<ResortContentTranslationPack["pages"]>[string], "settings"> & { id: string; settings_json: string }>;
  navigation_items: Array<NonNullable<ResortContentTranslationPack["navigation_items"]>[string] & { id: string }>;
};

const translationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["resort", "services", "pages", "navigation_items"],
  properties: {
    resort: {
      type: "object",
      additionalProperties: false,
      required: ["name", "location", "type", "description", "hero_title", "hero_subtitle", "features", "experiences", "booking_message_template"],
      properties: {
        name: { type: "string" },
        location: { type: "string" },
        type: { type: "string" },
        description: { type: "string" },
        hero_title: { type: "string" },
        hero_subtitle: { type: "string" },
        features: { type: "array", items: { type: "string" } },
        experiences: { type: "array", items: { type: "string" } },
        booking_message_template: { type: "string" },
      },
    },
    services: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "description", "price_label", "highlight", "duration", "included", "cta_label", "bed_type", "room_size", "view_type", "bathroom_info", "room_amenities"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          price_label: { type: "string" },
          highlight: { type: "string" },
          duration: { type: "string" },
          included: { type: "array", items: { type: "string" } },
          cta_label: { type: "string" },
          bed_type: { type: "string" },
          room_size: { type: "string" },
          view_type: { type: "string" },
          bathroom_info: { type: "string" },
          room_amenities: { type: "array", items: { type: "string" } },
        },
      },
    },
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "seo_title", "seo_description", "settings_json"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          seo_title: { type: "string" },
          seo_description: { type: "string" },
          settings_json: { type: "string" },
        },
      },
    },
    navigation_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
        },
      },
    },
  },
};

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

function extractOutputText(response: unknown) {
  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === "string") {
    return outputText;
  }

  const output = (response as { output?: Array<{ content?: Array<{ text?: string }> }> }).output;
  return output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n") ?? "";
}

function sourceForAi(source: ReturnType<typeof contentTranslationSource>) {
  return {
    ...source,
    services: Object.entries(source.services).map(([id, service]) => ({ id, ...service })),
    pages: Object.entries(source.pages).map(([id, page]) => ({
      id,
      title: page.title,
      seo_title: page.seo_title,
      seo_description: page.seo_description,
      settings_json: JSON.stringify(page.settings ?? {}),
    })),
    navigation_items: Object.entries(source.navigation_items).map(([id, item]) => ({ id, ...item })),
  };
}

function parseSettingsJson(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function normalizeAiTranslation(result: TranslationAiResult): Omit<ResortContentTranslationPack, "generatedAt" | "sourceHash" | "translatedHash" | "locale"> {
  return {
    resort: result.resort,
    services: Object.fromEntries(result.services.map(({ id, ...service }) => [id, service])),
    pages: Object.fromEntries(result.pages.map(({ id, settings_json, ...page }) => [id, {
      ...page,
      settings: parseSettingsJson(settings_json),
    }])),
    navigation_items: Object.fromEntries(result.navigation_items.map(({ id, ...item }) => [id, item])),
  };
}

async function generateIndonesianTranslation(source: ReturnType<typeof contentTranslationSource>) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
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
            "Translate customer-facing website content from English to natural Bahasa Indonesia for Indonesian local businesses. Preserve JSON keys and object ids exactly. Keep brand names, URLs, phone numbers, and proper nouns unchanged unless they are generic words. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "Translate all string values to Bahasa Indonesia. Keep empty strings empty. Keep array lengths and ids unchanged. settings_json is a JSON string: return a valid JSON string with the same shape and translated customer-facing string values.",
            source: sourceForAi(source),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "indonesian_content_translation",
          schema: translationSchema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody ? `AI translation generation failed: ${errorBody.slice(0, 500)}` : "AI translation generation failed.");
  }

  const data = await response.json();
  return normalizeAiTranslation(JSON.parse(extractOutputText(data)) as TranslationAiResult);
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const force = Boolean(body?.force);
  const supabase = createServiceRoleClient();
  const { data: resort, error: loadError } = await supabase
    .from("resorts")
    .select("*, services:resort_services(*), pages:site_pages(*), navigation_items:site_navigation_items(*)")
    .eq("id", id)
    .single();

  if (loadError || !resort) {
    return NextResponse.json({ error: loadError?.message ?? "Site not found." }, { status: 404 });
  }

  const currentResort = resort as Resort;
  if (!canManageResort(currentResort, user)) {
    return NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 });
  }

  const source = contentTranslationSource(currentResort);
  const sourceHash = contentTranslationHash(source);
  const currentPack = currentResort.content_translations?.id;

  if (!force && currentPack?.sourceHash === sourceHash) {
    return NextResponse.json({
      status: "unchanged",
      contentTranslations: currentResort.content_translations ?? {},
      generatedAt: currentPack.generatedAt,
    });
  }

  try {
    const translated = await generateIndonesianTranslation(source);
    const pack: ResortContentTranslationPack = {
      ...translated,
      locale: "id",
      generatedAt: new Date().toISOString(),
      sourceHash,
      translatedHash: contentTranslationHash(translated),
    };
    const contentTranslations = nextContentTranslations(currentResort.content_translations, pack);
    const { error: updateError } = await supabase
      .from("resorts")
      .update({ content_translations: contentTranslations, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: currentPack ? "updated" : "created",
      contentTranslations,
      generatedAt: pack.generatedAt,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate Indonesian translation." }, { status: 502 });
  }
}
