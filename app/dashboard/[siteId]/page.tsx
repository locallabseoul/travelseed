import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata = {
  title: "Site Console | Travelseed",
  description: "Manage one Travelseed business website.",
};

type DashboardSitePageProps = {
  params: Promise<{
    siteId: string;
  }>;
};

export default async function DashboardSitePage({ params }: DashboardSitePageProps) {
  const { siteId } = await params;
  return <DashboardShell siteId={siteId} />;
}
