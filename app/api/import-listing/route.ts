import { NextRequest, NextResponse } from "next/server";
import {
  createAiListingDraft,
  fallbackDraft,
  fetchListingSource,
  normalizeListingUrl,
} from "@/lib/server/listing-draft";

// Imports public OTA listing details and turns them into a resort form draft.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const url = normalizeListingUrl(body?.url);

  if (!url) {
    return NextResponse.json({ error: "Enter a valid OTA listing URL." }, { status: 400 });
  }

  const listingSource = await fetchListingSource(url);

  try {
    const aiDraft = await createAiListingDraft(url, listingSource);

    if (aiDraft) {
      return NextResponse.json({
        draft: { ...fallbackDraft(url), ...aiDraft.site },
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
      draft: fallbackDraft(url),
      servicesDraft: [],
      sourceTextAvailable: Boolean(listingSource.bodyText),
      warning: "OPENAI_API_KEY is not configured yet, so Travelseed created a basic URL draft.",
    },
    { status: 200 },
  );
}
