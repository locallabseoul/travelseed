export type DashboardTab =
  | "dashboard"
  | "setup"
  | "content"
  | "design"
  | "whatsapp"
  | "domain"
  | "analytics"
  | "plan"
  | "settings";

export type ResortConsoleData = {
  id: string;
  slug: string;
  domain: string | null;
  name: string;
  type: string;
  location: string;
  plan: "Seed Trial" | "Seed" | "Tree" | "Forest";
  status: "Draft" | "Published" | "Paused";
  travelseedUrl: string;
  customDomain: string;
  monthlyVisitorsUsed: number;
  monthlyVisitorsLimit: number;
  whatsappClicksUsed: number;
  whatsappClicksLimit: number;
  storageUsedGb: number;
  storageLimitGb: number;
  template: string;
  whatsappNumber: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCta: string;
  about: string;
  features: string[];
  gallery: string[];
  experiences: string[];
  bookingMessageTemplate: string;
  language: string;
  timezone: string;
  contactEmail: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  analytics: SiteAnalyticsSummary;
};

export type SiteAnalyticsEvent = {
  eventType: string;
  source: string;
  createdAt: string;
};

export type SiteAnalyticsDailyPoint = {
  date: string;
  whatsappClicks: number;
};

export type SiteAnalyticsSummary = {
  whatsappClicks7d: number;
  whatsappClicks30d: number;
  recentEvents: SiteAnalyticsEvent[];
  dailyClicks: SiteAnalyticsDailyPoint[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
};

export type UsageMetric = {
  label: string;
  used: number;
  limit: number;
  unit: string;
};

export type SetupStep = {
  title: string;
  description: string;
  status: "Done" | "Current" | "Next";
};

export type ContentSection = {
  title: string;
  description: string;
  status: "Ready" | "Needs review" | "Draft";
};

export type TemplateOption = {
  name: string;
  description: string;
  selected?: boolean;
};

export type PlanOption = {
  name: "Seed Trial" | "Seed" | "Tree" | "Forest";
  price: string;
  positioning: string;
  features: string[];
  current?: boolean;
};
