import type { BusinessCategoryId } from "@/lib/business-categories";

type BusinessCategoryIconProps = {
  categoryId: BusinessCategoryId;
  className?: string;
  iconClassName?: string;
};

export function BusinessCategoryIcon({
  categoryId,
  className,
  iconClassName = "h-5 w-5",
}: BusinessCategoryIconProps) {
  return (
    <span className={className} aria-hidden="true">
      <CategoryGlyph categoryId={categoryId} className={iconClassName} />
    </span>
  );
}

function CategoryGlyph({ categoryId, className }: { categoryId: BusinessCategoryId; className: string }) {
  const strokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  switch (categoryId) {
    case "food":
      return (
        <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
          <path d="M7 3v8" />
          <path d="M4 3v5a3 3 0 0 0 6 0V3" />
          <path d="M7 11v10" />
          <path d="M17 3v18" />
          <path d="M17 3c2.2 1.2 3.5 3.2 3.5 5.6S19.2 13 17 14" />
        </svg>
      );
    case "tour":
      return (
        <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
          <path d="M12 21s6-4.6 6-10a6 6 0 1 0-12 0c0 5.4 6 10 6 10Z" />
          <circle cx="12" cy="11" r="2" />
          <path d="M4 21h16" />
        </svg>
      );
    case "local_service":
      return (
        <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
          <path d="M4 10h16l-1.2-5.2A2.3 2.3 0 0 0 16.6 3H7.4a2.3 2.3 0 0 0-2.2 1.8L4 10Z" />
          <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "wellness":
      return (
        <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
          <path d="M12 21c0-5.6 3.3-10 8-10-1 5.4-3.9 8.7-8 10Z" />
          <path d="M12 21C12 13.8 8.7 8.6 4 7c.2 6.4 3 11.2 8 14Z" />
          <path d="M12 21V9" />
          <path d="M12 9c1.4-2.4 3.2-4 5.5-5" />
        </svg>
      );
    case "accommodation":
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
          <path d="M4 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" />
          <path d="M16 11h2a2 2 0 0 1 2 2v8" />
          <path d="M8 10h.01" />
          <path d="M12 10h.01" />
          <path d="M8 15h4" />
          <path d="M9 21v-4h2v4" />
        </svg>
      );
  }
}
