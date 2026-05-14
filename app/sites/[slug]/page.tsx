import { redirect } from "next/navigation";

type LegacySitePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    template?: string;
  }>;
};

export default async function LegacySitePage({ params, searchParams }: LegacySitePageProps) {
  const { slug } = await params;
  const { template } = await searchParams;
  const query = template ? `?template=${encodeURIComponent(template)}` : "";

  redirect(`/${slug}${query}`);
}
