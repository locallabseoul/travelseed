import { designTokensFor } from "@/lib/design-settings";
import type { Resort } from "@/types/resort";

export function ReviewSection({ resort, variant = "boutique" }: { resort: Resort; variant?: "boutique" | "surf" | "minimal" }) {
  const design = designTokensFor(resort.design_settings);
  const reviews = (resort.reviews ?? [])
    .filter((review) => review.status === "published" && review.show_on_website)
    .sort((first, second) => Number(second.featured) - Number(first.featured) || first.sort_order - second.sort_order)
    .slice(0, 3);

  if (reviews.length === 0) {
    return null;
  }

  const copy = {
    boutique: {
      eyebrow: "Guest reviews",
      title: "Loved by guests who book direct.",
      section: "bg-white",
    },
    surf: {
      eyebrow: "Guest stories",
      title: "What guests say after their stay.",
      section: "bg-white",
    },
    minimal: {
      eyebrow: "Testimonials",
      title: "A few words from recent guests.",
      section: "bg-[#f8f6f0]",
    },
  }[variant];

  return (
    <section id="reviews" className={`${copy.section} px-5 py-16 sm:px-6 lg:py-24`} style={{ backgroundColor: variant === "minimal" ? design.colors.section : design.colors.page }}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.primary }}>{copy.eyebrow}</p>
            <h2 className={`mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl ${design.headingClassName}`}>{copy.title}</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent }}>
              <p className="text-sm font-semibold tracking-[0.12em]" style={{ color: design.colors.accent }} aria-label={`${review.rating} star rating`}>
                {ratingStars(review.rating)}
              </p>
              <p className={`mt-5 text-base leading-7 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>{`"${review.review_text}"`}</p>
              <div className="mt-6 border-t pt-4" style={{ borderColor: design.colors.accent }}>
                <p className="text-sm font-semibold" style={{ color: design.colors.text }}>{review.guest_name}</p>
                {review.stay_date ? <p className="mt-1 text-xs font-medium" style={{ color: design.colors.muted }}>{review.stay_date}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ratingStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? "*" : "-")).join(" ");
}
