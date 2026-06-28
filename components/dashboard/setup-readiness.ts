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
    site.experiences.length > 0 ? "" : "experiences",
  ].filter(Boolean);
  const whatsappMissing = [
    hasText(site.whatsappNumber) ? "" : "WhatsApp number",
    hasText(site.bookingMessageTemplate) ? "" : "WhatsApp inquiry message",
  ].filter(Boolean);
  const publishMissing = [
    site.isActive ? "" : "published status",
    hasText(site.slug) ? "" : "public slug",
    copyMissing.length === 0 ? "" : "customer-facing copy",
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
      id: "ota",
      title: "Existing Source",
      description: "Import a public business link or paste existing business information.",
      missing: copyMissing.length === 0 ? [] : ["imported or reviewed source content"],
      targetTab: "import" as const,
      ctaLabel: "Open Import",
    },
    {
      id: "template",
      title: "Choose Template",
      description: "Confirm the business template and visual direction for the WhatsApp-ready site.",
      missing: hasText(site.template) ? [] : ["template"],
      targetTab: "design" as const,
      ctaLabel: "Open Design",
    },
    {
      id: "copy",
      title: "AI Brand Copy",
      description: "Generate a customer-facing copy pack from your business details.",
      missing: copyMissing,
      targetTab: "aiCopy" as const,
      ctaLabel: "Open AI Copy",
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
      id: "publish",
      title: "Preview & Publish",
      description: "Review the public experience and publish when the core setup is ready.",
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
