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
    hasText(site.bookingMessageTemplate) ? "" : "booking message",
  ].filter(Boolean);
  const publishMissing = [
    site.isActive ? "" : "published status",
    hasText(site.slug) ? "" : "public slug",
    copyMissing.length === 0 ? "" : "guest-facing copy",
  ].filter(Boolean);
  const rawSteps = [
    {
      id: "business",
      title: "Business Info",
      description: "Confirm property name, type, location, and account context.",
      missing: businessMissing,
      targetTab: "settings" as const,
      ctaLabel: "Open Settings",
    },
    {
      id: "ota",
      title: "OTA / Existing Info",
      description: "Import a public listing or paste existing property information.",
      missing: copyMissing.length === 0 ? [] : ["imported or reviewed source content"],
      targetTab: "import" as const,
      ctaLabel: "Open Import",
    },
    {
      id: "template",
      title: "Choose Template",
      description: "Confirm the hospitality template and visual direction for the direct-booking site.",
      missing: hasText(site.template) ? [] : ["template"],
      targetTab: "design" as const,
      ctaLabel: "Open Design",
    },
    {
      id: "copy",
      title: "AI Brand Copy",
      description: "Generate a direct-booking copy pack from your property details.",
      missing: copyMissing,
      targetTab: "aiCopy" as const,
      ctaLabel: "Open AI Copy",
    },
    {
      id: "whatsapp",
      title: "WhatsApp Booking",
      description: "Set the booking number, message format, and pickup option.",
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
