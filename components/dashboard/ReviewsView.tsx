"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
import type { GoogleReviewsSyncFeature, ResortConsoleData, WebsiteReview } from "@/types/dashboard";

type ReviewForm = Omit<WebsiteReview, "id" | "resortId" | "createdAt" | "updatedAt"> & {
  id?: string;
};

type RawWebsiteReview = {
  id: string;
  resort_id: string;
  guest_name: string;
  rating: number;
  review_text: string;
  source_label: WebsiteReview["sourceLabel"];
  stay_date: string | null;
  status: WebsiteReview["status"];
  show_on_website: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

// TODO: Remove fallback data after the website_reviews table is deployed in all environments.
const fallbackReviews: WebsiteReview[] = [
  {
    id: "review-1",
    guestName: "Maya T.",
    rating: 5,
    reviewText: "Villa Jeruk was a peaceful tropical villa with the perfect private pool for our family. We felt relaxed from the moment we arrived.",
    sourceLabel: "Guest Message",
    stayDate: "Apr 2026",
    status: "published",
    showOnWebsite: true,
    featured: true,
    sortOrder: 0,
  },
  {
    id: "review-2",
    guestName: "Daniel R.",
    rating: 5,
    reviewText: "Beautiful location near Selong Belanak Beach. The host was helpful, fast to respond, and made our Lombok trip easy.",
    sourceLabel: "Manual",
    stayDate: "Apr 2026",
    status: "published",
    showOnWebsite: true,
    featured: true,
    sortOrder: 1,
  },
  {
    id: "review-3",
    guestName: "Alex K.",
    rating: 5,
    reviewText: "Our kids loved the garden and private pool. The villa felt family friendly while still being quiet and private.",
    sourceLabel: "Manual",
    stayDate: "Mar 2026",
    status: "published",
    showOnWebsite: true,
    featured: true,
    sortOrder: 2,
  },
  {
    id: "review-4",
    guestName: "Sari N.",
    rating: 4,
    reviewText: "Clean rooms, fast WiFi, and a calm atmosphere for a work-friendly stay. We would come back for a longer visit.",
    sourceLabel: "Google",
    stayDate: "Mar 2026",
    status: "draft",
    showOnWebsite: false,
    featured: false,
    sortOrder: 3,
  },
  {
    id: "review-5",
    guestName: "Hannah L.",
    rating: 5,
    reviewText: "The host gave clear recommendations and helped us plan beach time around Selong Belanak. The villa was private and comfortable.",
    sourceLabel: "Guest Message",
    stayDate: "Feb 2026",
    status: "draft",
    showOnWebsite: false,
    featured: false,
    sortOrder: 4,
  },
  {
    id: "review-6",
    guestName: "Rizky A.",
    rating: 5,
    reviewText: "Great stay for a small family. The pool, WiFi, and quiet tropical setting made Villa Jeruk feel like a real break.",
    sourceLabel: "Manual",
    stayDate: "Feb 2026",
    status: "draft",
    showOnWebsite: false,
    featured: false,
    sortOrder: 5,
  },
];

const googleReviewsSync: GoogleReviewsSyncFeature = {
  title: "Google Reviews Sync",
  description: "Connect Google Business Profile in a future update to import public reviews automatically.",
  status: "coming_soon",
};

const emptyForm: ReviewForm = {
  guestName: "",
  rating: 5,
  reviewText: "",
  sourceLabel: "Manual",
  stayDate: "",
  status: "draft",
  showOnWebsite: false,
  featured: false,
  sortOrder: 0,
};

export function ReviewsView({ site, accessToken }: { site: ResortConsoleData; accessToken: string | null }) {
  const [reviews, setReviews] = useState<WebsiteReview[]>([]);
  const [form, setForm] = useState<ReviewForm>(emptyForm);
  const [status, setStatus] = useState("Loading website reviews...");
  const [saving, setSaving] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  async function apiRequest(path: string, init: RequestInit = {}) {
    if (!accessToken) {
      throw new Error("Sign in before managing website reviews.");
    }

    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${accessToken}`);
    if (init.body) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, { ...init, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "Request failed.");
    }

    return data;
  }

  useEffect(() => {
    setForm(emptyForm);
    if (!accessToken) {
      setReviews(fallbackReviews);
      setUsingFallback(true);
      setStatus("Sign in to manage saved website reviews. Showing sample reviews.");
      return;
    }

    async function loadReviews() {
      setStatus("Loading website reviews...");
      try {
        const response = await fetch(`/api/operator/resorts/${site.id}/reviews`, {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error ?? "Could not load website reviews.");
        }

        setReviews(((data.reviews ?? []) as RawWebsiteReview[]).map(reviewFromApi));
        setUsingFallback(false);
        setStatus("");
      } catch (error) {
        setReviews(fallbackReviews);
        setUsingFallback(true);
        setStatus(error instanceof Error ? `${error.message} Showing sample reviews.` : "Could not load website reviews. Showing sample reviews.");
      }
    }

    void loadReviews();
  }, [accessToken, site.id]);

  async function saveReview() {
    setSaving(true);
    setStatus(form.id ? "Updating review..." : "Saving review...");
    try {
      const payload = {
        guestName: form.guestName,
        rating: form.rating,
        reviewText: form.reviewText,
        sourceLabel: form.sourceLabel,
        stayDate: form.stayDate,
        status: form.status,
        showOnWebsite: form.showOnWebsite,
        featured: form.featured,
        sortOrder: form.sortOrder,
      };
      const path = form.id ? `/api/operator/resorts/${site.id}/reviews/${form.id}` : `/api/operator/resorts/${site.id}/reviews`;
      const method = form.id ? "PATCH" : "POST";
      const data = await apiRequest(path, { method, body: JSON.stringify(payload) });
      const savedReview = reviewFromApi(data.review as RawWebsiteReview);

      setReviews((currentReviews) => {
        if (form.id) {
          return currentReviews.map((review) => (review.id === savedReview.id ? savedReview : review));
        }
        return [savedReview, ...currentReviews];
      });
      setUsingFallback(false);
      setForm(emptyForm);
      setStatus("Review saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save review.");
    } finally {
      setSaving(false);
    }
  }

  async function patchReview(review: WebsiteReview, patch: Partial<WebsiteReview>) {
    setStatus("Updating review...");
    try {
      const data = await apiRequest(`/api/operator/resorts/${site.id}/reviews/${review.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...review, ...patch }),
      });
      const savedReview = reviewFromApi(data.review as RawWebsiteReview);
      setReviews((currentReviews) => currentReviews.map((currentReview) => (currentReview.id === savedReview.id ? savedReview : currentReview)));
      setUsingFallback(false);
      setStatus("Review updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update review.");
    }
  }

  async function deleteReview(review: WebsiteReview) {
    setStatus("Deleting review...");
    try {
      await apiRequest(`/api/operator/resorts/${site.id}/reviews/${review.id}`, { method: "DELETE" });
      setReviews((currentReviews) => currentReviews.filter((currentReview) => currentReview.id !== review.id));
      setStatus("Review deleted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete review.");
    }
  }

  async function moveFeaturedReview(review: WebsiteReview, direction: -1 | 1) {
    const featuredReviews = websiteReviewsForDisplay(reviews);
    const currentIndex = featuredReviews.findIndex((currentReview) => currentReview.id === review.id);
    const nextIndex = currentIndex + direction;
    const nextReview = featuredReviews[nextIndex];

    if (!nextReview) {
      return;
    }

    const leftSort = review.sortOrder ?? currentIndex;
    const rightSort = nextReview.sortOrder ?? nextIndex;
    await patchReview(review, { sortOrder: rightSort });
    await patchReview(nextReview, { sortOrder: leftSort });
  }

  const featuredReviews = websiteReviewsForDisplay(reviews);
  const summaryMetrics = useMemo(() => {
    const publishedCount = reviews.filter((review) => review.status === "published").length;
    const draftCount = reviews.filter((review) => review.status === "draft").length;
    const averageRating = reviews.length > 0 ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1) : "0.0";

    return [
      { label: "Published Reviews", value: String(publishedCount), helper: "Visible-ready website reviews" },
      { label: "Draft Reviews", value: String(draftCount), helper: "Saved for review" },
      { label: "Average Rating", value: averageRating, helper: "Website review set" },
      { label: "Website Section", value: featuredReviews.length > 0 ? "Active" : "Inactive", helper: "Testimonials visibility" },
    ];
  }, [featuredReviews.length, reviews]);

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Reviews</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Website Reviews</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">
              Add and manage guest testimonials displayed on your direct booking website.
            </p>
          </div>
          <button type="button" onClick={() => setForm(emptyForm)} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white shadow-sm">
            Add Review
          </button>
        </div>
      </Panel>

      {status ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6f7b74] shadow-sm">
          {usingFallback ? "Sample mode: " : ""}
          {status}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <Panel key={metric.label}>
            <p className="text-sm font-medium text-[#6f7b74]">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#18352f]">{metric.value}</p>
            <p className="mt-2 text-xs leading-5 text-[#72815e]">{metric.helper}</p>
          </Panel>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="grid gap-6">
          <AddReviewFormCard form={form} saving={saving} onChange={setForm} onSave={saveReview} />
          <ReviewListCard reviews={reviews} onEdit={setForm} onDelete={deleteReview} onPatch={patchReview} />
          <WebsiteTestimonialsCard reviews={featuredReviews} onMove={moveFeaturedReview} onRemove={(review) => patchReview(review, { showOnWebsite: false, featured: false })} />
        </main>

        <aside className="grid content-start gap-6">
          <WebsitePreviewCard reviews={featuredReviews} />
          <GoogleReviewsSyncCard feature={googleReviewsSync} />
          <PlanLimitCard />
        </aside>
      </div>
    </div>
  );
}

function AddReviewFormCard({
  form,
  saving,
  onChange,
  onSave,
}: {
  form: ReviewForm;
  saving: boolean;
  onChange: (form: ReviewForm) => void;
  onSave: () => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#18352f]">{form.id ? "Edit review" : "Add review"}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Create a manual guest testimonial for the website review section.</p>
        </div>
        <Badge tone="green">Database backed</Badge>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <EditableField label="Guest Name" value={form.guestName} placeholder="Guest name" onChange={(guestName) => onChange({ ...form, guestName })} />
        <SelectField label="Rating" value={String(form.rating)} options={["5", "4", "3", "2", "1"]} onChange={(rating) => onChange({ ...form, rating: Number(rating) })} />
        <SelectField label="Source Label" value={form.sourceLabel} options={["Manual", "Google", "Guest Message"]} onChange={(sourceLabel) => onChange({ ...form, sourceLabel: sourceLabel as WebsiteReview["sourceLabel"] })} />
        <EditableField label="Stay Date" value={form.stayDate ?? ""} placeholder="Apr 2026" onChange={(stayDate) => onChange({ ...form, stayDate })} />
        <div className="md:col-span-2">
          <EditableField label="Review Text" value={form.reviewText} placeholder="Paste or write the guest review..." textarea onChange={(reviewText) => onChange({ ...form, reviewText })} />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4">
          <Toggle checked={form.showOnWebsite} label="Show on Website" onChange={(showOnWebsite) => onChange({ ...form, showOnWebsite, status: showOnWebsite ? "published" : form.status })} />
          <Toggle checked={form.featured} label="Featured" onChange={(featured) => onChange({ ...form, featured, showOnWebsite: featured ? true : form.showOnWebsite, status: featured ? "published" : form.status })} />
        </div>
        <button type="button" onClick={onSave} disabled={saving} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving..." : "Save Review"}
        </button>
      </div>
    </Panel>
  );
}

function ReviewListCard({
  reviews,
  onEdit,
  onDelete,
  onPatch,
}: {
  reviews: WebsiteReview[];
  onEdit: (review: ReviewForm) => void;
  onDelete: (review: WebsiteReview) => void;
  onPatch: (review: WebsiteReview, patch: Partial<WebsiteReview>) => void;
}) {
  return (
    <section className="grid gap-4">
      <Panel>
        <h2 className="text-xl font-semibold text-[#18352f]">Review list</h2>
        <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Manage which reviews are published, featured, and shown on the public website.</p>
      </Panel>
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <ReviewCard key={review.id} review={review} onEdit={() => onEdit(review)} onDelete={() => onDelete(review)} onPatch={(patch) => onPatch(review, patch)} />
        ))
      ) : (
        <Panel>
          <p className="text-sm font-semibold text-[#18352f]">No website reviews yet</p>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Add a guest review to start building your public testimonials section.</p>
        </Panel>
      )}
    </section>
  );
}

function ReviewCard({
  review,
  onEdit,
  onDelete,
  onPatch,
}: {
  review: WebsiteReview;
  onEdit: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<WebsiteReview>) => void;
}) {
  return (
    <article className="rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-[0_18px_60px_rgba(54,43,29,0.07)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[#18352f]">{review.guestName}</h3>
            <Badge tone={review.status === "published" ? "green" : "gray"}>{review.status === "published" ? "Published" : "Draft"}</Badge>
            <Badge tone="sand">{review.sourceLabel}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold tracking-[0.12em] text-[#d29735]" aria-label={`${review.rating} star rating`}>
              {ratingStars(review.rating)}
            </span>
            <span className="text-[#6f7b74]">{review.stayDate ?? "Stay date not set"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Toggle checked={review.showOnWebsite} label="Show on Website" onChange={(showOnWebsite) => onPatch({ showOnWebsite, status: showOnWebsite ? "published" : review.status })} />
          <Toggle checked={review.featured} label="Featured" onChange={(featured) => onPatch({ featured, showOnWebsite: featured ? true : review.showOnWebsite, status: featured ? "published" : review.status })} />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#52615a]">{review.reviewText}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="rounded-full bg-[#fff7f5] px-4 py-2 text-sm font-semibold text-[#9d3323]">
          Delete
        </button>
      </div>
    </article>
  );
}

function WebsiteTestimonialsCard({
  reviews,
  onMove,
  onRemove,
}: {
  reviews: WebsiteReview[];
  onMove: (review: WebsiteReview, direction: -1 | 1) => void;
  onRemove: (review: WebsiteReview) => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#18352f]">Website Testimonials</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">These reviews will appear on your public website.</p>
        </div>
        <Badge tone="green">{reviews.length} featured</Badge>
      </div>
      {reviews.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <article key={review.id} className="rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
              <Badge tone="green">Website</Badge>
              <p className="mt-4 text-sm font-semibold text-[#18352f]">{review.guestName}</p>
              <p className="mt-2 text-sm leading-6 text-[#52615a]">{`"${review.reviewText}"`}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => onMove(review, -1)} disabled={index === 0} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:cursor-not-allowed disabled:opacity-40">
                  Move Up
                </button>
                <button type="button" onClick={() => onMove(review, 1)} disabled={index === reviews.length - 1} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:cursor-not-allowed disabled:opacity-40">
                  Move Down
                </button>
                <button type="button" onClick={() => onRemove(review)} className="rounded-full bg-[#fff7f5] px-3 py-1 text-xs font-semibold text-[#9d3323]">
                  Remove from Website
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#d8cebb] bg-[#fbfaf7] p-5">
          <p className="text-sm font-semibold text-[#18352f]">No website testimonials selected</p>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Turn on Show on Website and Featured for reviews you want to publish.</p>
        </div>
      )}
    </Panel>
  );
}

function WebsitePreviewCard({ reviews }: { reviews: WebsiteReview[] }) {
  return (
    <Panel>
      <h2 className="text-xl font-semibold text-[#18352f]">Website Preview</h2>
      <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Testimonials section preview</p>
      <div className="mt-5 rounded-2xl bg-[#18352f] p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">What guests say</p>
        <div className="mt-4 grid gap-3">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="rounded-xl bg-white/10 p-3">
              <p className="text-xs font-semibold tracking-[0.1em] text-[#f2cc7b]">{ratingStars(review.rating)}</p>
              <p className="mt-2 text-sm leading-6 text-white/85">{shorten(review.reviewText, 130)}</p>
              <p className="mt-2 text-xs font-semibold text-white/65">{review.guestName}</p>
            </div>
          ))}
          {reviews.length === 0 ? <p className="text-sm leading-6 text-white/70">Select reviews to preview the testimonials section.</p> : null}
        </div>
      </div>
      <button type="button" className="mt-5 min-h-11 w-full rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
        Preview Website
      </button>
    </Panel>
  );
}

function GoogleReviewsSyncCard({ feature }: { feature: GoogleReviewsSyncFeature }) {
  return (
    <Panel className="bg-[#f3f0e8] opacity-80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#18352f]">{feature.title}</h2>
        <Badge tone="gray">Future</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6f7b74]">{feature.description}</p>
      <button type="button" disabled className="mt-5 min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-[#6f7b74] ring-1 ring-[#d8cebb] disabled:cursor-not-allowed">
        Coming Soon
      </button>
    </Panel>
  );
}

function PlanLimitCard() {
  return (
    <Panel className="border-[#d8cebb] bg-[#fffdf8]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#18352f]">Tree plan review tools</h2>
        <Badge tone="sand">Tree</Badge>
      </div>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-[#52615a]">
        <li>Published website reviews: up to 10</li>
        <li>AI review helper: 20 uses / month</li>
        <li>Manual review management included</li>
      </ul>
      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
        <p className="text-sm font-semibold text-[#18352f]">Upgrade to Forest</p>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Unlock unlimited website reviews, advanced translation, Google Reviews sync, and review performance analytics.</p>
      </div>
    </Panel>
  );
}

function EditableField({
  label,
  value,
  placeholder,
  textarea,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  textarea?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} placeholder={placeholder} rows={5} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#18352f]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm font-medium text-[#52615a] outline-none focus:border-[#18352f]">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange?: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#18352f]">
      <span>{label}</span>
      <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? "bg-[#2d6b50]" : "bg-[#d8cebb]"}`}>
        <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : ""}`} />
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange?.(event.target.checked)} className="sr-only" />
    </label>
  );
}

function reviewFromApi(review: RawWebsiteReview): WebsiteReview {
  return {
    id: review.id,
    resortId: review.resort_id,
    guestName: review.guest_name,
    rating: review.rating,
    reviewText: review.review_text,
    sourceLabel: review.source_label,
    stayDate: review.stay_date ?? "",
    status: review.status,
    showOnWebsite: review.show_on_website,
    featured: review.featured,
    sortOrder: review.sort_order,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
  };
}

function websiteReviewsForDisplay(reviews: WebsiteReview[]) {
  return reviews
    .filter((review) => review.status === "published" && review.showOnWebsite && review.featured)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .slice(0, 3);
}

function ratingStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? "*" : "-")).join(" ");
}

function shorten(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}
