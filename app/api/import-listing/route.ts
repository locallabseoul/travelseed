import { NextRequest, NextResponse } from "next/server";
import {
  createAiListingDraft,
  fallbackDraft,
  fetchListingSource,
  normalizeListingUrl,
} from "@/lib/server/listing-draft";

// Imports public business source details and turns them into a site form draft.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const url = normalizeListingUrl(body?.url);

  if (!url) {
    return NextResponse.json({ error: "Enter a valid public website, Instagram, OTA, marketplace, or social link." }, { status: 400 });
  }

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

  return NextResponse.json(
    {
      draft: fallbackDraft(url, listingSource),
      servicesDraft: [],
      sourceTextAvailable: Boolean(listingSource.bodyText),
      warning: "OPENAI_API_KEY is not configured yet, so Travelseed created a basic source draft.",
    },
    { status: 200 },
  );
}
