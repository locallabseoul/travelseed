import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageViewTracker } from "@/components/resort/PageViewTracker";
import { renderResortTemplate } from "@/components/templates";
import { getActiveResortBySlug } from "@/lib/tenants";
import type { Resort } from "@/types/resort";

type SitePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    template?: string;
  }>;
};

function metadataDescriptionFor(resort: Resort) {
  return (
    resort.hero_subtitle ||
    resort.description ||
    `${resort.name} is a direct booking stay in ${resort.location}.`
  );
}

function metadataImageFor(resort: Resort) {
  return resort.hero_image_url || resort.gallery[0] || null;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resort = await getActiveResortBySlug(slug);

  if (!resort) {
    return {
      title: "Resort not found | Travelseed",
    };
  }

  const title = `${resort.name} | Direct Booking`;
  const description = metadataDescriptionFor(resort);
  const imageUrl = metadataImageFor(resort);

  return {
    title,
    description,
    alternates: {
      canonical: `/${resort.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: resort.name,
      locale: "en_US",
      url: `/${resort.slug}`,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${resort.name} in ${resort.location}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function SitePage({ params, searchParams }: SitePageProps) {
  const { slug } = await params;
  const { template } = await searchParams;
  const resort = await getActiveResortBySlug(slug);

  if (!resort) {
    notFound();
  }

  return (
    <>
      <PageViewTracker resortId={resort.id} path={`/${resort.slug}`} />
      {renderResortTemplate(resort, template)}
    </>
  );
}
