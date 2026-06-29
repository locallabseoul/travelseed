import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import type { DashboardTab, ResortConsoleData } from "@/types/dashboard";

export type SetupStatus = "Done" | "Current" | "Next";

export type SetupReadinessStep = {
  id: string;
  title: string;
  description: string;
  status: SetupStatus;
  missing: string[];
  targetTab: DashboardTab;
  ctaLabel: string;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function setupStepsFor(site: ResortConsoleData): SetupReadinessStep[] {
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const businessMissing = [
    hasText(site.name) ? "" : "business name",
    hasText(site.location) ? "" : "location",
    hasText(site.type) ? "" : "business type",
  ].filter(Boolean);
  const copyMissing = [
    hasText(site.heroTitle) ? "" : "hero title",
    hasText(site.heroSubtitle) ? "" : "hero subtitle",
    hasText(site.about) ? "" : "about copy",
    site.features.length > 0 ? "" : "features",
  ].filter(Boolean);
  const offersMissing = site.services.length > 0 ? [] : [dashboardCopy.setup.offerMissing];
  const whatsappMissing = [
    hasText(site.whatsappNumber) ? "" : "WhatsApp number",
    hasText(site.bookingMessageTemplate) ? "" : "WhatsApp inquiry message",
  ].filter(Boolean);
  const inboxMissing = [
    hasText(site.whatsappNumber) ? "" : "WhatsApp destination",
    site.isActive ? "" : "published site",
  ].filter(Boolean);
  const publishMissing = [
    site.isActive ? "" : "published status",
    hasText(site.slug) ? "" : "public slug",
    copyMissing.length === 0 ? "" : dashboardCopy.setup.copyMissing,
    offersMissing.length === 0 ? "" : dashboardCopy.setup.offerMissing,
    whatsappMissing.length === 0 ? "" : "WhatsApp inquiry setup",
  ].filter(Boolean);
  const rawSteps = [
    {
      id: "business",
      title: "Business Info",
      description: "Confirm business name, type, location, and account context.",
      missing: businessMissing,
      targetTab: "settings" as const,
      ctaLabel: "Open Settings",
    },
    {
      id: "offers",
      title: dashboardCopy.setup.offersStepTitle,
      description: dashboardCopy.setup.offersStepDescription,
      missing: offersMissing,
      targetTab: "offers" as const,
      ctaLabel: "Open Offers",
    },
    {
      id: "whatsapp",
      title: "WhatsApp Inquiry",
      description: "Set the WhatsApp number and message format.",
      missing: whatsappMissing,
      targetTab: "whatsapp" as const,
      ctaLabel: "Open WhatsApp",
    },
    {
      id: "content",
      title: "Pages & Content",
      description: dashboardCopy.setup.contentStepDescription,
      missing: copyMissing,
      targetTab: "content" as const,
      ctaLabel: "Open Content",
    },
    {
      id: "inquiries",
      title: "Inquiry Inbox",
      description: dashboardCopy.setup.inboxStepDescription,
      missing: inboxMissing,
      targetTab: "inquiries" as const,
      ctaLabel: "Open Inquiries",
    },
    {
      id: "publish",
      title: "Preview & Publish",
      description: `Review ${dashboardCopy.setup.contentFocus} before sending customers to the live site.`,
      missing: publishMissing,
      targetTab: "settings" as const,
      ctaLabel: "Open Publish Settings",
    },
  ];
  const firstIncompleteIndex = rawSteps.findIndex((step) => step.missing.length > 0);

  return rawSteps.map((step, index) => ({
    ...step,
    status: step.missing.length === 0 ? "Done" : index === firstIncompleteIndex ? "Current" : "Next",
  }));
}

export function setupReadinessFor(site: ResortConsoleData) {
  const steps = setupStepsFor(site);
  const doneCount = steps.filter((step) => step.status === "Done").length;

  return {
    steps,
    progress: Math.round((doneCount / steps.length) * 100),
    nextStep: steps.find((step) => step.status !== "Done") ?? null,
  };
}
