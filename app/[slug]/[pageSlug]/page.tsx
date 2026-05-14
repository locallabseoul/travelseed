import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageViewTracker } from "@/components/resort/PageViewTracker";
import { ResortSubPage } from "@/components/resort/ResortSubPage";
import { findPublishedPage, isMultipageResort } from "@/lib/site-structure";
import { getActiveResortBySlug } from "@/lib/tenants";
import type { Resort, ResortSitePage } from "@/types/resort";

type PublicSubPageProps = {
  params: Promise<{
    slug: string;
    pageSlug: string;
  }>;
};

function metadataTitleFor(resort: Resort, page: ResortSitePage) {
  return page.seo_title || `${page.title} | ${resort.name}`;
}

function metadataDescriptionFor(resort: Resort, page: ResortSitePage) {
  return page.seo_description || resort.hero_subtitle || resort.description || `${page.title} at ${resort.name} in ${resort.location}.`;
}

export async function generateMetadata({ params }: PublicSubPageProps): Promise<Metadata> {
  const { slug, pageSlug } = await params;
  const resort = await getActiveResortBySlug(slug);
  const page = resort ? findPublishedPage(resort, pageSlug) : null;

  if (!resort || !page || !isMultipageResort(resort)) {
    return {
      title: "Page not found | Travelseed",
    };
  }

  const title = metadataTitleFor(resort, page);
  const description = metadataDescriptionFor(resort, page);

  return {
    title,
    description,
    alternates: {
      canonical: `/${resort.slug}/${page.slug.replace(/^\/+/, "")}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: resort.name,
      url: `/${resort.slug}/${page.slug.replace(/^\/+/, "")}`,
    },
  };
}

export default async function PublicSubPage({ params }: PublicSubPageProps) {
  const { slug, pageSlug } = await params;

  if (pageSlug === "home") {
    redirect(`/${slug}`);
  }

  const resort = await getActiveResortBySlug(slug);

  if (!resort || !isMultipageResort(resort)) {
    notFound();
  }

  const page = findPublishedPage(resort, pageSlug);

  if (!page || page.slug === "/") {
    notFound();
  }

  return (
    <>
      <PageViewTracker resortId={resort.id} path={`/${resort.slug}/${page.slug.replace(/^\/+/, "")}`} />
      <ResortSubPage resort={resort} page={page} />
    </>
  );
}
