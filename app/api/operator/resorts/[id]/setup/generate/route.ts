import { NextResponse } from "next/server";
import { businessCategoryFromType } from "@/lib/business-categories";
import {
  createAiBrandCopyDraft,
  createAiListingDraft,
  fallbackDraft,
  fetchListingSource,
  normalizeListingUrl,
} from "@/lib/server/listing-draft";
import {
  createServiceRoleClient,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type SetupGenerateMode = "import_listing" | "brand_copy";

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

function textDraft(existingText: string, resort: Resort) {
  const lines = existingText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    name: resort.name,
    location: resort.location,
    type: resort.type ?? "",
    template_id: resort.template_id,
    hero_title: resort.hero_title,
    hero_subtitle: resort.hero_subtitle ?? lines[0] ?? "",
    description: lines.slice(0, 4).join(" "),
    features: lines.slice(0, 10),
    experiences: resort.experiences,
  };
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const mode = body?.mode as SetupGenerateMode | undefined;
  const supabase = createServiceRoleClient();
  const { data: resort, error: loadError } = await supabase
    .from("resorts")
    .select("*")
    .eq("id", id)
    .single();

  if (loadError || !resort) {
    return NextResponse.json({ error: loadError?.message ?? "Site not found." }, { status: 404 });
  }

  if (!canManageResort(resort as Resort, user)) {
    return NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 });
  }

  const currentResort = resort as Resort;

  if (mode === "import_listing") {
    const url = normalizeListingUrl(body?.sourceUrl);
    const existingText = typeof body?.existingText === "string" ? body.existingText.trim() : "";

    if (!url && !existingText) {
      return NextResponse.json({ error: "Enter a public business link or paste existing business information." }, { status: 400 });
    }

    if (url) {
      const listingSource = await fetchListingSource(url);

      try {
        const aiDraft = await createAiListingDraft(url, listingSource);

        if (aiDraft) {
          return NextResponse.json({
            draft: { ...fallbackDraft(url, listingSource), ...aiDraft.site },
            servicesDraft: aiDraft.services,
            sourceTextAvailable: Boolean(
              listingSource.bodyText ||
                listingSource.metaDescription ||
                listingSource.ogDescription ||
                listingSource.jsonLd.length,
            ),
          });
        }
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "AI draft generation failed." },
          { status: 502 },
        );
      }

      return NextResponse.json({
        draft: fallbackDraft(url, listingSource),
        servicesDraft: [],
        sourceTextAvailable: Boolean(listingSource.bodyText),
        warning: "OPENAI_API_KEY is not configured yet, so Travelseed created a basic source draft.",
      });
    }

    return NextResponse.json({
      draft: textDraft(existingText, currentResort),
      servicesDraft: [],
      sourceTextAvailable: true,
      warning: "No URL was provided, so Travelseed prepared a draft from the pasted business text only.",
    });
  }

  if (mode === "brand_copy") {
    const sourceUrl = normalizeListingUrl(body?.sourceUrl);
    const existingText = typeof body?.existingText === "string" ? body.existingText.trim() : "";
    const listingSource = sourceUrl ? await fetchListingSource(sourceUrl) : null;
    const category = businessCategoryFromType({ type: currentResort.type, templateId: currentResort.template_id });

    try {
      const aiDraft = await createAiBrandCopyDraft({
        name: currentResort.name,
        location: currentResort.location,
        type: currentResort.type ?? "",
        existingText,
        listingSource,
        currentCopy: {
          hero_title: currentResort.hero_title,
          hero_subtitle: currentResort.hero_subtitle ?? "",
          description: currentResort.description ?? "",
          features: currentResort.features,
          experiences: currentResort.experiences,
          booking_message_template: currentResort.booking_message_template ?? "",
        },
      });

      if (aiDraft) {
        return NextResponse.json({ draft: aiDraft, sourceTextAvailable: Boolean(existingText || listingSource?.bodyText) });
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "AI brand copy generation failed." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      draft: {
        hero_title: currentResort.hero_title || `Contact ${currentResort.name} on WhatsApp`,
        hero_subtitle: currentResort.hero_subtitle ?? `A WhatsApp-ready business website in ${currentResort.location}.`,
        description: currentResort.description ?? `${currentResort.name} is a local business website in ${currentResort.location}.`,
        features: currentResort.features,
        experiences: currentResort.experiences,
        booking_message_template:
          currentResort.booking_message_template ??
          category.defaultBookingMessage(currentResort.name),
      },
      sourceTextAvailable: Boolean(existingText || listingSource?.bodyText),
      warning: "OPENAI_API_KEY is not configured yet, so Travelseed prepared a copy pack from existing site fields.",
    });
  }

  return NextResponse.json({ error: "Unsupported setup generation mode." }, { status: 400 });
}
