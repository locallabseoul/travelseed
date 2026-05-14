export const RESERVED_PUBLIC_SLUGS = [
  "admin",
  "api",
  "blog",
  "create",
  "dashboard",
  "help",
  "login",
  "preview",
  "pricing",
  "privacy",
  "settings",
  "sites",
  "support",
  "terms",
  "www",
];

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePublicSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function validatePublicSlug(slug: string) {
  const normalizedSlug = normalizePublicSlug(slug);

  if (!slugPattern.test(normalizedSlug)) {
    return "Slug can only contain lowercase letters, numbers, and hyphens.";
  }

  if (RESERVED_PUBLIC_SLUGS.includes(normalizedSlug)) {
    return `The slug "${normalizedSlug}" is reserved. Choose another public URL.`;
  }

  return null;
}
