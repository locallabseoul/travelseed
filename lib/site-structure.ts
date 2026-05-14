import type { Resort, ResortNavigationItem, ResortSitePage, ResortSiteSection } from "@/types/resort";

type PublicNavigationLink = {
  href: string;
  label: string;
};

const landingNavigationSections = [
  { key: "about", href: "#about", label: "About" },
  { key: "rooms", href: "#services", label: "Rooms" },
  { key: "gallery", href: "#gallery", label: "Gallery" },
  { key: "reviews", href: "#reviews", label: "Reviews" },
  { key: "experiences", href: "#experiences", label: "Experiences" },
];

function sortByOrder<T extends { sort_order: number }>(items: T[] | undefined) {
  return [...(items ?? [])].sort((first, second) => first.sort_order - second.sort_order);
}

function normalizeSlug(slug: string) {
  if (!slug || slug === "/") {
    return "/";
  }

  return `/${slug.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeSectionKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function pageHref(resort: Resort, href: string) {
  if (href.startsWith("http") || href.startsWith("#")) {
    return href;
  }

  const path = normalizeSlug(href);
  return path === "/" ? `/${resort.slug}` : `/${resort.slug}${path}`;
}

export function isMultipageResort(resort: Resort) {
  return resort.site_type === "multipage" || resort.site_type === "custom" || resort.plan_type === "tree" || resort.plan_type === "forest";
}

export function activeSiteSections(resort: Resort) {
  return sortByOrder(resort.sections).filter((section) => section.is_enabled);
}

export function publishedSitePages(resort: Resort) {
  return sortByOrder(resort.pages).filter((page) => page.is_published);
}

export function activeNavigationItems(resort: Resort) {
  return sortByOrder(resort.navigation_items).filter((item) => item.is_enabled);
}

export function isSiteSectionEnabled(resort: Resort, sectionKey: string, defaultValue = true) {
  const sections = resort.sections ?? [];

  if (sections.length === 0) {
    return defaultValue;
  }

  const normalizedKey = normalizeSectionKey(sectionKey);
  const section = sections.find((item) => normalizeSectionKey(item.section_key) === normalizedKey || normalizeSectionKey(item.label) === normalizedKey);

  return section ? section.is_enabled : defaultValue;
}

export function findPublishedPage(resort: Resort, pageSlug: string) {
  const normalizedPageSlug = normalizeSlug(pageSlug);

  return publishedSitePages(resort).find((page) => normalizeSlug(page.slug) === normalizedPageSlug) ?? null;
}

export function publicNavigationLinks(resort: Resort): PublicNavigationLink[] {
  if (!isMultipageResort(resort)) {
    return landingNavigationSections
      .filter((link) => link.key === "experiences" ? resort.experiences.length > 0 : isSiteSectionEnabled(resort, link.key))
      .filter((link) => link.key !== "gallery" || resort.gallery.length > 0)
      .map(({ href, label }) => ({ href, label }));
  }

  const navigationItems = activeNavigationItems(resort);

  if (navigationItems.length > 0) {
    return navigationItems.map((item: ResortNavigationItem) => ({
      href: pageHref(resort, item.href),
      label: item.label,
    }));
  }

  return publishedSitePages(resort).map((page: ResortSitePage) => ({
    href: pageHref(resort, page.slug),
    label: page.title,
  }));
}

export function sortedPublicSiteData(resort: Resort): Resort {
  return {
    ...resort,
    services: sortByOrder(resort.services),
    reviews: sortByOrder(resort.reviews),
    sections: sortByOrder(resort.sections as ResortSiteSection[] | undefined),
    pages: sortByOrder(resort.pages),
    navigation_items: sortByOrder(resort.navigation_items),
  };
}
