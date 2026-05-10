import { notFound } from "next/navigation";
import { renderResortTemplate } from "@/components/templates";
import { getActiveResortBySlug } from "@/lib/tenants";

type SitePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    template?: string;
  }>;
};

// Slug-based tenant route. Inactive or missing resorts return a 404.
export default async function SitePage({ params, searchParams }: SitePageProps) {
  const { slug } = await params;
  const { template } = await searchParams;
  const resort = await getActiveResortBySlug(slug);

  if (!resort) {
    notFound();
  }

  return renderResortTemplate(resort, template);
}
