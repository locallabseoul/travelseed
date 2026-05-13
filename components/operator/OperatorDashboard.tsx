"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { resortTemplateOptions } from "@/components/templates";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Resort, ResortUpsert } from "@/types/resort";

type SiteForm = {
  name: string;
  slug: string;
  location: string;
  template_id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  whatsapp_number: string;
  description: string;
  features: string;
  gallery: string;
  experiences: string;
  is_active: boolean;
};

const emptyForm: SiteForm = {
  name: "",
  slug: "",
  location: "",
  template_id: "boutique-villa",
  hero_title: "",
  hero_subtitle: "",
  hero_image_url: "",
  whatsapp_number: "",
  description: "",
  features: "",
  gallery: "",
  experiences: "",
  is_active: true,
};

const fieldClassName =
  "min-h-11 rounded-md border border-[#18352f]/15 bg-white px-3 text-sm outline-none focus:border-[#18352f]";

function listToTextarea(items: string[]) {
  return items.join("\n");
}

function textareaToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalText(value: string) {
  return value.trim() || null;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formFromResort(resort: Resort): SiteForm {
  return {
    name: resort.name,
    slug: resort.slug,
    location: resort.location,
    template_id: resort.template_id,
    hero_title: resort.hero_title,
    hero_subtitle: resort.hero_subtitle ?? "",
    hero_image_url: resort.hero_image_url ?? "",
    whatsapp_number: resort.whatsapp_number,
    description: resort.description ?? "",
    features: listToTextarea(resort.features),
    gallery: listToTextarea(resort.gallery),
    experiences: listToTextarea(resort.experiences),
    is_active: resort.is_active,
  };
}

function payloadFromForm(form: SiteForm): ResortUpsert {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    domain: null,
    template_id: form.template_id,
    location: form.location.trim(),
    type: null,
    description: optionalText(form.description),
    hero_title: form.hero_title.trim(),
    hero_subtitle: optionalText(form.hero_subtitle),
    hero_image_url: optionalText(form.hero_image_url),
    whatsapp_number: form.whatsapp_number.trim(),
    capacity: null,
    bedrooms: null,
    bathrooms: null,
    features: textareaToList(form.features),
    gallery: textareaToList(form.gallery),
    experiences: textareaToList(form.experiences),
    booking_message_template: `Hello, I would like to make a reservation at ${form.name || "your resort"}.
Check-in:
Check-out:
Guests:
Airport Pickup:`,
    is_active: form.is_active,
    updated_at: new Date().toISOString(),
  };
}

export function OperatorDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [sites, setSites] = useState<Resort[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState<"hero" | "gallery" | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedSite = useMemo(() => sites.find((site) => site.id === selectedSiteId) ?? null, [sites, selectedSiteId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setSites([]);
        setSelectedSiteId(null);
        setForm(emptyForm);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      void loadSites();
    }
    // selectedSiteId is excluded so choosing a site does not trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  async function operatorFetch(path: string, init: RequestInit = {}) {
    if (!session?.access_token) {
      throw new Error("Sign in before managing sites.");
    }

    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${session.access_token}`);
    if (init.body && !(init.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, { ...init, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "Request failed.");
    }

    return data;
  }

  async function loadSites() {
    setStatus("Loading your sites...");
    try {
      const data = await operatorFetch("/api/operator/resorts");
      const loadedSites = (data.resorts ?? []) as Resort[];
      setSites(loadedSites);

      if (!selectedSiteId && loadedSites[0]) {
        setSelectedSiteId(loadedSites[0].id);
        setForm(formFromResort(loadedSites[0]));
      }

      setStatus(loadedSites.length > 0 ? "" : "No sites yet. Create your first site to manage it here.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load sites.");
    }
  }

  function selectSite(site: Resort) {
    setSelectedSiteId(site.id);
    setForm(formFromResort(site));
    setStatus("");
  }

  function updateField<Key extends keyof SiteForm>(key: Key, value: SiteForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(file: File, folder: "hero" | "gallery") {
    const slug = form.slug.trim() || selectedSite?.slug || "draft-site";
    const formData = new FormData();
    formData.set("file", file, sanitizeFileName(file.name));
    formData.set("folder", folder);
    formData.set("slug", slug);

    const data = await operatorFetch("/api/operator/images", {
      method: "POST",
      body: formData,
    });

    return String(data.publicUrl);
  }

  async function handleHeroUpload(file: File) {
    setUploading("hero");
    setStatus("Uploading hero image...");
    try {
      const publicUrl = await uploadImage(file, "hero");
      updateField("hero_image_url", publicUrl);
      setStatus("Hero image uploaded. Save changes to publish it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function handleGalleryUpload(files: FileList) {
    setUploading("gallery");
    setStatus(`Uploading ${files.length} gallery image${files.length > 1 ? "s" : ""}...`);
    try {
      const uploadedUrls = await Promise.all(Array.from(files).map((file) => uploadImage(file, "gallery")));
      updateField("gallery", [...textareaToList(form.gallery), ...uploadedUrls].join("\n"));
      setStatus("Gallery uploaded. Save changes to publish it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Gallery upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSite) {
      setStatus("Choose a site first.");
      return;
    }

    setSaving(true);
    setStatus("Saving site...");
    try {
      await operatorFetch(`/api/operator/resorts/${selectedSite.id}`, {
        method: "PUT",
        body: JSON.stringify({ resort: payloadFromForm(form) }),
      });
      setStatus("Site updated.");
      await loadSites();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save site.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedSite) {
      return;
    }

    if (!window.confirm(`Delete ${selectedSite.name}? This cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setStatus("Deleting site...");
    try {
      await operatorFetch(`/api/operator/resorts/${selectedSite.id}`, { method: "DELETE" });
      setSelectedSiteId(null);
      setForm(emptyForm);
      setStatus("Site deleted.");
      await loadSites();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete site.");
    } finally {
      setSaving(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-[#f8f5ef] px-5 py-6 text-[#18352f]">
        <DashboardHeader />
        <CenteredMessage text="Supabase is not configured." />
      </main>
    );
  }

  if (!authReady) {
    return (
      <main className="min-h-screen bg-[#f8f5ef] px-5 py-6 text-[#18352f]">
        <DashboardHeader />
        <CenteredMessage text="Checking account session..." />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#f8f5ef] px-5 py-6 text-[#18352f]">
        <DashboardHeader />
        <CenteredMessage
          text="Sign in to manage your sites."
          action={
            <Link href="/login?next=/dashboard" className="rounded-full bg-[#18352f] px-5 py-3 text-sm font-semibold text-white">
              Sign in
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-5 py-8 text-[#18352f] sm:px-6">
      <DashboardHeader />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Operator</p>
              <h1 className="mt-3 text-4xl font-semibold">Site management</h1>
            </div>
            <Link href="/create" className="min-h-11 rounded-md bg-[#18352f] px-4 py-3 text-sm font-semibold text-white">
              New site
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#51635b]">
            <span>{session.user.email}</span>
            <button type="button" onClick={() => void supabase.auth.signOut()} className="font-semibold text-[#0f5f6b]">
              Sign out
            </button>
          </div>

          <div className="mt-8 space-y-3">
            {sites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => selectSite(site)}
                className={`w-full rounded-md border p-5 text-left shadow-sm transition ${
                  site.id === selectedSiteId
                    ? "border-[#18352f] bg-white"
                    : "border-transparent bg-white/75 hover:border-[#18352f]/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{site.name}</h2>
                    <p className="mt-1 text-sm text-[#51635b]">{site.location}</p>
                  </div>
                  <span className="rounded-full bg-[#f8f5ef] px-3 py-1 text-xs">
                    {site.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <a className="font-semibold text-[#0f5f6b]" href={`/sites/${site.slug}`} target="_blank" rel="noreferrer">
                    View live
                  </a>
                  <span className="text-[#51635b]">/{site.slug}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-md bg-white p-5 shadow-sm sm:p-6">
          {selectedSite ? (
            <form onSubmit={handleSave} className="grid gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Edit {selectedSite.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#51635b]">Changes publish to the live direct booking site.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => updateField("is_active", event.target.checked)}
                    className="h-4 w-4 accent-[#18352f]"
                  />
                  Active
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Name" value={form.name} onChange={(value) => updateField("name", value)} required />
                <TextField label="Slug" value={form.slug} onChange={(value) => updateField("slug", value)} required />
                <TextField label="Location" value={form.location} onChange={(value) => updateField("location", value)} required />
                <TextField
                  label="WhatsApp number"
                  value={form.whatsapp_number}
                  onChange={(value) => updateField("whatsapp_number", value)}
                  required
                />
              </div>

              <label className="grid gap-2 text-sm font-medium">
                Template
                <select
                  value={form.template_id}
                  onChange={(event) => updateField("template_id", event.target.value)}
                  className={fieldClassName}
                >
                  {resortTemplateOptions.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>

              <TextField label="Hero title" value={form.hero_title} onChange={(value) => updateField("hero_title", value)} required />
              <TextField label="Hero subtitle" value={form.hero_subtitle} onChange={(value) => updateField("hero_subtitle", value)} />
              <ImageUploadPanel
                label="Hero image"
                imageUrl={form.hero_image_url}
                uploading={uploading === "hero"}
                onUpload={handleHeroUpload}
                onClear={() => updateField("hero_image_url", "")}
              />
              <TextareaField label="Description" value={form.description} onChange={(value) => updateField("description", value)} />
              <TextareaField label="Features" value={form.features} onChange={(value) => updateField("features", value)} />
              <GalleryUploadPanel
                gallery={textareaToList(form.gallery)}
                uploading={uploading === "gallery"}
                onUpload={handleGalleryUpload}
                onRemove={(imageUrl) =>
                  updateField(
                    "gallery",
                    textareaToList(form.gallery)
                      .filter((item) => item !== imageUrl)
                      .join("\n"),
                  )
                }
              />
              <TextareaField label="Nearby experiences" value={form.experiences} onChange={(value) => updateField("experiences", value)} />

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 rounded-md bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={saving}
                  className="min-h-12 rounded-md border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete site
                </button>
              </div>
              {status ? <p className="text-sm text-[#51635b]">{status}</p> : null}
            </form>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-[#18352f]/15 bg-[#f8f5ef]/60 p-6 text-center">
              <div>
                <h2 className="text-2xl font-semibold">No site selected</h2>
                <p className="mt-2 text-sm text-[#51635b]">{status || "Create a site first, then manage it here."}</p>
                <Link href="/create" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[#18352f] px-5 text-sm font-semibold text-white">
                  Build new site
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardHeader() {
  return (
    <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
      <Link href="/" className="text-sm font-semibold tracking-[0.22em]">
        TRAVELSEED
      </Link>
      <Link href="/create" className="text-sm font-semibold text-[#51635b]">
        Build My Site
      </Link>
    </header>
  );
}

function CenteredMessage({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="grid justify-items-center gap-4 text-center">
        <p className="text-sm font-medium text-[#51635b]">{text}</p>
        {action}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName} />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="rounded-md border border-[#18352f]/15 bg-white px-3 py-3 text-sm outline-none focus:border-[#18352f]"
      />
    </label>
  );
}

function ImageUploadPanel({
  label,
  imageUrl,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  imageUrl: string;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  return (
    <section className="grid gap-3 rounded-md border border-[#18352f]/10 bg-[#f8f5ef]/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">{label}</h3>
        {imageUrl ? (
          <button type="button" onClick={onClear} className="text-xs font-semibold text-red-700">
            Clear
          </button>
        ) : null}
      </div>
      {imageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-white">
          <Image src={imageUrl} alt={label} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-[#18352f]/20 bg-white text-sm text-[#51635b]">
          No image selected
        </div>
      )}
      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-semibold ring-1 ring-[#18352f]/15">
        {uploading ? "Uploading..." : "Upload image"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) {
              void onUpload(file);
            }
          }}
          className="sr-only"
        />
      </label>
    </section>
  );
}

function GalleryUploadPanel({
  gallery,
  uploading,
  onUpload,
  onRemove,
}: {
  gallery: string[];
  uploading: boolean;
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (imageUrl: string) => void;
}) {
  return (
    <section className="grid gap-3 rounded-md border border-[#18352f]/10 bg-[#f8f5ef]/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold">Gallery images</h3>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-semibold ring-1 ring-[#18352f]/15">
          {uploading ? "Uploading..." : "Upload gallery"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            disabled={uploading}
            onChange={(event) => {
              const files = event.target.files;
              event.currentTarget.value = "";
              if (files && files.length > 0) {
                void onUpload(files);
              }
            }}
            className="sr-only"
          />
        </label>
      </div>
      {gallery.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {gallery.map((imageUrl) => (
            <div key={imageUrl} className="overflow-hidden rounded-md bg-white shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image src={imageUrl} alt="Gallery preview" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="truncate text-xs text-[#51635b]">{imageUrl}</p>
                <button type="button" onClick={() => onRemove(imageUrl)} className="text-xs font-semibold text-red-700">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-[#18352f]/20 bg-white text-sm text-[#51635b]">
          No gallery images yet
        </div>
      )}
    </section>
  );
}
