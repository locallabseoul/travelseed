"use client";

import { useEffect, useMemo, useState } from "react";
import { DatePickerField, formatDateLabel } from "@/components/dashboard/DatePickerField";
import { Badge, Panel } from "@/components/dashboard/ui";
import {
  categoryReviewSamples,
  dashboardCategoryCopyFor,
  reviewSourceDisplayLabel,
  reviewSourceDisplayOptions,
  reviewSourceValueFromDisplay,
  type DashboardCategoryCopy,
} from "@/lib/dashboard-category-copy";
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
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const fallbackReviews = useMemo(() => categoryReviewSamples({ type: site.type, template: site.template }), [site.template, site.type]);

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
  }, [accessToken, fallbackReviews, site.id]);

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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Reviews</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Website Reviews</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Add and manage customer testimonials displayed on your public business website.
            </p>
          </div>
          <button type="button" onClick={() => setForm(emptyForm)} className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm">
            Add Review
          </button>
        </div>
      </Panel>

      {status ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          {usingFallback ? "Sample mode: " : ""}
          {status}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <Panel key={metric.label}>
            <p className="text-sm font-medium text-slate-600">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-xs leading-5 text-emerald-700">{metric.helper}</p>
          </Panel>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="grid gap-6">
          <AddReviewFormCard form={form} dashboardCopy={dashboardCopy} saving={saving} onChange={setForm} onSave={saveReview} />
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
  dashboardCopy,
  saving,
  onChange,
  onSave,
}: {
  form: ReviewForm;
  dashboardCopy: DashboardCategoryCopy;
  saving: boolean;
  onChange: (form: ReviewForm) => void;
  onSave: () => void;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{form.id ? "Edit review" : "Add review"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Create a manual customer testimonial for the website review section.</p>
        </div>
        <Badge tone="green">Database backed</Badge>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <EditableField label="Customer Name" value={form.guestName} placeholder="Customer name" onChange={(guestName) => onChange({ ...form, guestName })} />
        <SelectField label="Rating" value={String(form.rating)} options={["5", "4", "3", "2", "1"]} onChange={(rating) => onChange({ ...form, rating: Number(rating) })} />
        <SelectField label="Source Label" value={reviewSourceDisplayLabel(form.sourceLabel)} options={reviewSourceDisplayOptions} onChange={(sourceLabel) => onChange({ ...form, sourceLabel: reviewSourceValueFromDisplay(sourceLabel) })} />
        <DatePickerField label={dashboardCopy.reviews.dateLabel} value={form.stayDate ?? ""} onChange={(stayDate) => onChange({ ...form, stayDate })} />
        <div className="md:col-span-2">
          <EditableField label="Review Text" value={form.reviewText} placeholder="Paste or write the customer review..." textarea onChange={(reviewText) => onChange({ ...form, reviewText })} />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4">
          <Toggle checked={form.showOnWebsite} label="Show on Website" onChange={(showOnWebsite) => onChange({ ...form, showOnWebsite, status: showOnWebsite ? "published" : form.status })} />
          <Toggle checked={form.featured} label="Featured" onChange={(featured) => onChange({ ...form, featured, showOnWebsite: featured ? true : form.showOnWebsite, status: featured ? "published" : form.status })} />
        </div>
        <button type="button" onClick={onSave} disabled={saving} className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
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
        <h2 className="text-xl font-semibold text-slate-950">Review list</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Manage which reviews are published, featured, and shown on the public website.</p>
      </Panel>
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <ReviewCard key={review.id} review={review} onEdit={() => onEdit(review)} onDelete={() => onDelete(review)} onPatch={(patch) => onPatch(review, patch)} />
        ))
      ) : (
        <Panel>
          <p className="text-sm font-semibold text-slate-950">No website reviews yet</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Add a customer review to start building your public testimonials section.</p>
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
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{review.guestName}</h3>
            <Badge tone={review.status === "published" ? "green" : "gray"}>{review.status === "published" ? "Published" : "Draft"}</Badge>
            <Badge tone="sand">{reviewSourceDisplayLabel(review.sourceLabel)}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold tracking-[0.12em] text-[#d29735]" aria-label={`${review.rating} star rating`}>
              {ratingStars(review.rating)}
            </span>
            <span className="text-slate-600">{review.stayDate ? formatDateLabel(review.stayDate) : "Date not set"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Toggle checked={review.showOnWebsite} label="Show on Website" onChange={(showOnWebsite) => onPatch({ showOnWebsite, status: showOnWebsite ? "published" : review.status })} />
          <Toggle checked={review.featured} label="Featured" onChange={(featured) => onPatch({ featured, showOnWebsite: featured ? true : review.showOnWebsite, status: featured ? "published" : review.status })} />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{review.reviewText}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
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
          <h2 className="text-xl font-semibold text-slate-950">Website Testimonials</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Published reviews with Show on Website enabled will appear on your public website. Featured reviews appear first.</p>
        </div>
        <Badge tone="green">{reviews.length} visible</Badge>
      </div>
      {reviews.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <article key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Badge tone="green">Website</Badge>
              <p className="mt-4 text-sm font-semibold text-slate-950">{review.guestName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{`"${review.reviewText}"`}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => onMove(review, -1)} disabled={index === 0} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                  Move Up
                </button>
                <button type="button" onClick={() => onMove(review, 1)} disabled={index === reviews.length - 1} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                  Move Down
                </button>
                <button type="button" onClick={() => onRemove(review)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  Remove from Website
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-950">No website testimonials selected</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Turn on Show on Website for published reviews you want to display publicly.</p>
        </div>
      )}
    </Panel>
  );
}

function WebsitePreviewCard({ reviews }: { reviews: WebsiteReview[] }) {
  return (
    <Panel>
      <h2 className="text-xl font-semibold text-slate-950">Website Preview</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">Testimonials section preview</p>
      <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">What customers say</p>
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
      <button type="button" className="mt-5 min-h-11 w-full rounded-full bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
        Preview Website
      </button>
    </Panel>
  );
}

function GoogleReviewsSyncCard({ feature }: { feature: GoogleReviewsSyncFeature }) {
  return (
    <Panel className="bg-[#f3f0e8] opacity-80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-950">{feature.title}</h2>
        <Badge tone="gray">Future</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
      <button type="button" disabled className="mt-5 min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 disabled:cursor-not-allowed">
        Coming Soon
      </button>
    </Panel>
  );
}

function PlanLimitCard() {
  return (
    <Panel className="border-slate-200 bg-[#fffdf8]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-950">Tree plan review tools</h2>
        <Badge tone="sand">Tree</Badge>
      </div>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
        <li>Published website reviews: up to 10</li>
        <li>AI review helper: 20 uses / month</li>
        <li>Manual review management included</li>
      </ul>
      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-slate-950">Upgrade to Forest</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Unlock unlimited website reviews, advanced translation, Google Reviews sync, and review performance analytics.</p>
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
    <label className="grid gap-2 text-sm font-semibold text-slate-950">
      {label}
      {textarea ? (
        <textarea value={value} placeholder={placeholder} rows={5} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
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
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-950">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-emerald-600">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange?: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-950">
      <span>{label}</span>
      <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? "bg-emerald-600" : "bg-slate-300"}`}>
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
    .filter((review) => review.status === "published" && review.showOnWebsite)
    .sort((left, right) => Number(right.featured) - Number(left.featured) || (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .slice(0, 3);
}

function ratingStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? "*" : "-")).join(" ");
}

function shorten(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}
