"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { resortTemplateOptions } from "@/components/templates";
import { sampleResorts } from "@/lib/sample-resorts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Resort, ResortUpsert } from "@/types/resort";

type ResortFormState = {
  name: string;
  slug: string;
  domain: string;
  template_id: string;
  location: string;
  type: string;
  description: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  whatsapp_number: string;
  capacity: string;
  bedrooms: string;
  bathrooms: string;
  features: string;
  gallery: string;
  experiences: string;
  booking_message_template: string;
  is_active: boolean;
};

const emptyForm: ResortFormState = {
  name: "",
  slug: "",
  domain: "",
  template_id: "boutique-villa",
  location: "",
  type: "",
  description: "",
  hero_title: "",
  hero_subtitle: "",
  hero_image_url: "",
  whatsapp_number: "",
  capacity: "",
  bedrooms: "",
  bathrooms: "",
  features: "",
  gallery: "",
  experiences: "",
  booking_message_template: "",
  is_active: true,
};

function listToTextarea(items: string[]) {
  return items.join("\n");
}

function textareaToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : null;
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

function formFromResort(resort: Resort): ResortFormState {
  return {
    name: resort.name,
    slug: resort.slug,
    domain: resort.domain ?? "",
    template_id: resort.template_id,
    location: resort.location,
    type: resort.type ?? "",
    description: resort.description ?? "",
    hero_title: resort.hero_title,
    hero_subtitle: resort.hero_subtitle ?? "",
    hero_image_url: resort.hero_image_url ?? "",
    whatsapp_number: resort.whatsapp_number,
    capacity: resort.capacity?.toString() ?? "",
    bedrooms: resort.bedrooms?.toString() ?? "",
    bathrooms: resort.bathrooms?.toString() ?? "",
    features: listToTextarea(resort.features),
    gallery: listToTextarea(resort.gallery),
    experiences: listToTextarea(resort.experiences),
    booking_message_template: resort.booking_message_template ?? "",
    is_active: resort.is_active,
  };
}

function payloadFromForm(form: ResortFormState): ResortUpsert {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    domain: optionalText(form.domain),
    template_id: form.template_id,
    location: form.location.trim(),
    type: optionalText(form.type),
    description: optionalText(form.description),
    hero_title: form.hero_title.trim(),
    hero_subtitle: optionalText(form.hero_subtitle),
    hero_image_url: optionalText(form.hero_image_url),
    whatsapp_number: form.whatsapp_number.trim(),
    capacity: optionalNumber(form.capacity),
    bedrooms: optionalNumber(form.bedrooms),
    bathrooms: optionalNumber(form.bathrooms),
    features: textareaToList(form.features),
    gallery: textareaToList(form.gallery),
    experiences: textareaToList(form.experiences),
    booking_message_template: optionalText(form.booking_message_template),
    is_active: form.is_active,
    updated_at: new Date().toISOString(),
  };
}

const fieldClassName =
  "min-h-11 rounded-md border border-forest/15 bg-white px-3 text-sm outline-none focus:border-forest";

function previewHref(slug: string, templateId: string) {
  return `/sites/${slug}?template=${templateId}`;
}

// Authenticated admin page for managing resort content and uploaded images.
export default function AdminPage() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [selectedResortId, setSelectedResortId] = useState<string | null>(null);
  const [form, setForm] = useState<ResortFormState>(emptyForm);
  const [status, setStatus] = useState<string>("");
  const [uploadingField, setUploadingField] = useState<"hero" | "gallery" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");

  const selectedResort = useMemo(
    () => resorts.find((resort) => resort.id === selectedResortId) ?? null,
    [resorts, selectedResortId],
  );

  async function adminFetch(path: string, init: RequestInit = {}) {
    if (!session?.access_token) {
      throw new Error("Sign in before managing resorts.");
    }

    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${session.access_token}`);

    if (init.body && !(init.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, { ...init, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "Admin request failed.");
    }

    return data;
  }

  async function loadResorts() {
    if (!isSupabaseConfigured) {
      setResorts(sampleResorts);
      setSelectedResortId(sampleResorts[0]?.id ?? null);
      setForm(sampleResorts[0] ? formFromResort(sampleResorts[0]) : emptyForm);
      setStatus("Supabase env is not configured. Editing is preview-only with local sample data.");
      return;
    }

    if (!session?.access_token) {
      return;
    }

    try {
      const data = await adminFetch("/api/admin/resorts");
      const loadedResorts = (data.resorts ?? []) as Resort[];
      setResorts(loadedResorts);

      if (!selectedResortId && loadedResorts[0]) {
        setSelectedResortId(loadedResorts[0].id);
        setForm(formFromResort(loadedResorts[0]));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load resorts.");
      return;
    }
  }

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
        setResorts([]);
        setSelectedResortId(null);
        setForm(emptyForm);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || session?.access_token) {
      void loadResorts();
    }
    // selectedResortId is intentionally excluded so loading does not re-run after every selection change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthStatus(authMode === "sign-in" ? "Signing in..." : "Creating account...");

    if (authMode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email: loginEmail.trim(),
        password: loginPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) {
        setAuthStatus(error.message);
        return;
      }

      setLoginPassword("");
      setAuthStatus("Check your email to verify the account, then sign in.");
      setAuthMode("sign-in");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setAuthStatus(error.message);
      return;
    }

    setLoginPassword("");
    setAuthStatus("");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setStatus("");
    setAuthStatus("");
  }

  function selectResort(resort: Resort) {
    setSelectedResortId(resort.id);
    setForm(formFromResort(resort));
    setStatus("");
  }

  function startNewResort() {
    setSelectedResortId(null);
    setForm(emptyForm);
    setStatus("");
  }

  function updateField<Key extends keyof ResortFormState>(key: Key, value: ResortFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(file: File, folder: "hero" | "gallery") {
    if (!isSupabaseConfigured) {
      setStatus("Connect Supabase before uploading images.");
      return null;
    }

    const resortSlug = form.slug.trim() || selectedResort?.slug || "draft-resort";
    const formData = new FormData();
    formData.set("file", file, sanitizeFileName(file.name));
    formData.set("folder", folder);
    formData.set("slug", resortSlug);

    try {
      const data = await adminFetch("/api/admin/images", {
        method: "POST",
        body: formData,
      });

      return String(data.publicUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image upload failed.");
      return null;
    }
  }

  async function handleHeroUpload(file: File) {
    setUploadingField("hero");
    setStatus("Uploading hero image...");
    const publicUrl = await uploadImage(file, "hero");
    setUploadingField(null);

    if (!publicUrl) {
      return;
    }

    updateField("hero_image_url", publicUrl);
    setStatus("Hero image uploaded. Save changes to publish it.");
  }

  async function handleGalleryUpload(files: FileList) {
    setUploadingField("gallery");
    setStatus(`Uploading ${files.length} gallery image${files.length > 1 ? "s" : ""}...`);

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const publicUrl = await uploadImage(file, "gallery");
      if (publicUrl) {
        uploadedUrls.push(publicUrl);
      }
    }

    setUploadingField(null);

    if (uploadedUrls.length === 0) {
      return;
    }

    const existingUrls = textareaToList(form.gallery);
    updateField("gallery", [...existingUrls, ...uploadedUrls].join("\n"));
    setStatus("Gallery images uploaded. Save changes to publish them.");
  }

  function removeGalleryImage(imageUrl: string) {
    updateField(
      "gallery",
      textareaToList(form.gallery)
        .filter((item) => item !== imageUrl)
        .join("\n"),
    );
  }

  async function handleDeleteSelectedResort() {
    if (!selectedResort) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedResort.name}? This will remove the resort record and uploaded hero/gallery images from Storage. This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    if (!isSupabaseConfigured) {
      setResorts((current) => current.filter((resort) => resort.id !== selectedResort.id));
      setSelectedResortId(null);
      setForm(emptyForm);
      setStatus("Resort removed from local preview data.");
      return;
    }

    setDeleting(true);
    setStatus(`Deleting ${selectedResort.name} and related images...`);

    try {
      await adminFetch(`/api/admin/resorts/${selectedResort.id}`, { method: "DELETE" });
      setSelectedResortId(null);
      setForm(emptyForm);
      setStatus(`${selectedResort.name} deleted with related uploaded images.`);
      await loadResorts();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete this resort.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      const previewPayload = payloadFromForm(form);
      const previewResort: Resort = {
        id: selectedResortId ?? `local-${previewPayload.slug}`,
        ...previewPayload,
      };

      setResorts((current) => {
        const exists = current.some((resort) => resort.id === previewResort.id);
        return exists
          ? current.map((resort) => (resort.id === previewResort.id ? previewResort : resort))
          : [...current, previewResort];
      });
      setSelectedResortId(previewResort.id);
      setStatus("Preview updated locally. Connect Supabase to persist changes.");
      return;
    }

    const payload = payloadFromForm(form);
    setStatus(selectedResort ? "Updating resort..." : "Creating resort...");

    try {
      await adminFetch(selectedResort ? `/api/admin/resorts/${selectedResort.id}` : "/api/admin/resorts", {
        method: selectedResort ? "PUT" : "POST",
        body: JSON.stringify({ resort: payload }),
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save resort.");
      return;
    }

    setStatus(selectedResort ? "Resort updated." : "Resort created.");
    await loadResorts();
  }

  if (isSupabaseConfigured && !authReady) {
    return (
      <main className="min-h-screen bg-sand px-5 py-6 text-forest sm:px-6">
        <HeaderNav />
        <div className="flex min-h-[70vh] items-center justify-center">
          <p className="text-sm font-medium text-forest/70">Checking admin session...</p>
        </div>
      </main>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <main className="min-h-screen bg-sand px-5 py-6 text-forest sm:px-6">
        <HeaderNav />
        <div className="flex min-h-[70vh] items-center justify-center">
          <form onSubmit={handleLogin} className="grid w-full max-w-md gap-5 rounded-md bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest/60">Admin</p>
              <h1 className="mt-3 text-3xl font-semibold text-forest">
                {authMode === "sign-in" ? "Sign in" : "Create account"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-forest/65">
                {authMode === "sign-in"
                  ? "Use your approved admin email and password."
                  : "Create a Supabase Auth account, then verify your email before signing in."}
              </p>
            </div>
            <TextField label="Email" value={loginEmail} onChange={setLoginEmail} type="email" required />
            <TextField label="Password" value={loginPassword} onChange={setLoginPassword} type="password" required />
            <button type="submit" className="min-h-12 rounded-md bg-forest px-5 text-sm font-semibold text-white">
              {authMode === "sign-in" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
                setAuthStatus("");
              }}
              className="text-sm font-semibold text-ocean"
            >
              {authMode === "sign-in" ? "Create an admin account" : "Back to sign in"}
            </button>
            {authStatus ? <p className="text-sm text-forest/70">{authStatus}</p> : null}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sand px-5 py-8 sm:px-6">
      <HeaderNav />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest/60">Admin</p>
              <h1 className="mt-3 text-4xl font-semibold text-forest">Resorts</h1>
            </div>
            <button
              type="button"
              onClick={startNewResort}
              className="min-h-11 rounded-md bg-forest px-4 text-sm font-semibold text-white"
            >
              New resort
            </button>
          </div>
          {isSupabaseConfigured ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-forest/65">
              <span>{session?.user.email}</span>
              <button type="button" onClick={() => void handleSignOut()} className="font-semibold text-ocean">
                Sign out
              </button>
            </div>
          ) : null}

          <div className="mt-8 space-y-3">
            {resorts.map((resort) => (
              <button
                key={resort.id}
                type="button"
                onClick={() => selectResort(resort)}
                className={`w-full rounded-md border p-5 text-left shadow-sm transition ${
                  resort.id === selectedResortId
                    ? "border-forest bg-white"
                    : "border-transparent bg-white/75 hover:border-forest/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-forest">{resort.name}</h2>
                    <p className="mt-1 text-sm text-forest/65">{resort.location}</p>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs text-forest">
                    {resort.template_id}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <a className="font-semibold text-ocean" href={`/sites/${resort.slug}`} target="_blank" rel="noreferrer">
                    View live
                  </a>
                  <a
                    className="font-semibold text-forest/65"
                    href={previewHref(resort.slug, resort.template_id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview current
                  </a>
                  <span className={resort.is_active ? "text-forest/65" : "text-red-700"}>
                    {resort.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-md bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-forest">
                {selectedResort ? `Edit ${selectedResort.name}` : "Create resort"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-forest/65">
                Upload photos to Supabase Storage, then save the resort to publish changes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {selectedResort ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteSelectedResort()}
                  disabled={deleting}
                  className="min-h-10 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete resort"}
                </button>
              ) : null}
              <label className="inline-flex items-center gap-2 text-sm font-medium text-forest">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => updateField("is_active", event.target.checked)}
                  className="h-4 w-4 accent-forest"
                />
                Active
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" value={form.name} onChange={(value) => updateField("name", value)} required />
              <TextField label="Slug" value={form.slug} onChange={(value) => updateField("slug", value)} required />
              <TextField label="Location" value={form.location} onChange={(value) => updateField("location", value)} required />
              <TextField label="Custom domain" value={form.domain} onChange={(value) => updateField("domain", value)} />
              <TextField label="Type" value={form.type} onChange={(value) => updateField("type", value)} />
              <TextField
                label="WhatsApp number"
                value={form.whatsapp_number}
                onChange={(value) => updateField("whatsapp_number", value)}
                required
              />
            </div>

            <label className="grid gap-2 text-sm font-medium text-forest">
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

            <section className="rounded-md border border-forest/10 bg-sand/45 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-forest">Template preview</h3>
                  <p className="mt-1 text-xs leading-5 text-forest/60">
                    Opens the saved resort data with a temporary template override.
                  </p>
                </div>
                {form.slug.trim() ? (
                  <a
                    href={previewHref(form.slug.trim(), form.template_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-forest px-4 text-sm font-semibold text-white"
                  >
                    Preview selected
                  </a>
                ) : null}
              </div>
              {form.slug.trim() ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {resortTemplateOptions.map((template) => (
                    <a
                      key={template.id}
                      href={previewHref(form.slug.trim(), template.id)}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-md border px-3 py-3 text-center text-xs font-semibold ${
                        form.template_id === template.id
                          ? "border-forest bg-white text-forest"
                          : "border-forest/10 bg-white/65 text-forest/65"
                      }`}
                    >
                      {template.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-forest/60">Enter and save a slug before previewing templates.</p>
              )}
            </section>

            <TextField
              label="Hero title"
              value={form.hero_title}
              onChange={(value) => updateField("hero_title", value)}
              required
            />
            <TextField
              label="Hero subtitle"
              value={form.hero_subtitle}
              onChange={(value) => updateField("hero_subtitle", value)}
            />
            <ImageUploadPanel
              label="Hero image"
              imageUrl={form.hero_image_url}
              uploading={uploadingField === "hero"}
              onUpload={handleHeroUpload}
              onClear={() => updateField("hero_image_url", "")}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Capacity" value={form.capacity} onChange={(value) => updateField("capacity", value)} type="number" />
              <TextField label="Bedrooms" value={form.bedrooms} onChange={(value) => updateField("bedrooms", value)} type="number" />
              <TextField label="Bathrooms" value={form.bathrooms} onChange={(value) => updateField("bathrooms", value)} type="number" />
            </div>

            <TextareaField label="Description" value={form.description} onChange={(value) => updateField("description", value)} />
            <TextareaField label="Features" value={form.features} onChange={(value) => updateField("features", value)} />
            <GalleryUploadPanel
              gallery={textareaToList(form.gallery)}
              uploading={uploadingField === "gallery"}
              onUpload={handleGalleryUpload}
              onRemove={removeGalleryImage}
            />
            <TextareaField
              label="Nearby experiences"
              value={form.experiences}
              onChange={(value) => updateField("experiences", value)}
            />
            <TextareaField
              label="Booking message template"
              value={form.booking_message_template}
              onChange={(value) => updateField("booking_message_template", value)}
            />

            <button type="submit" className="min-h-12 rounded-md bg-forest px-5 text-sm font-semibold text-white">
              {selectedResort ? "Save changes" : "Create resort"}
            </button>
            {status ? <p className="text-sm text-forest/70">{status}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}

function HeaderNav() {
  return (
    <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
      <Link href="/" className="text-sm font-semibold tracking-[0.22em] text-forest">
        TRAVELSEED
      </Link>
      <Link href="/create" className="text-sm font-semibold text-forest/65">
        Build My Site
      </Link>
    </header>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-forest">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
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
    <label className="grid gap-2 text-sm font-medium text-forest">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="rounded-md border border-forest/15 bg-white px-3 py-3 text-sm outline-none focus:border-forest"
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
    <section className="grid gap-3 rounded-md border border-forest/10 bg-sand/45 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-forest">{label}</h3>
          <p className="mt-1 text-xs text-forest/60">JPG, PNG, WebP, or GIF. Max 10MB.</p>
        </div>
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
        <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-forest/20 bg-white text-sm text-forest/55">
          No image selected
        </div>
      )}

      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-forest ring-1 ring-forest/15">
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
    <section className="grid gap-3 rounded-md border border-forest/10 bg-sand/45 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-forest">Gallery images</h3>
          <p className="mt-1 text-xs text-forest/60">Upload multiple images. They render as the public gallery.</p>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-forest ring-1 ring-forest/15">
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
                <Image
                  src={imageUrl}
                  alt="Gallery preview"
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="truncate text-xs text-forest/55">{imageUrl}</p>
                <button
                  type="button"
                  onClick={() => onRemove(imageUrl)}
                  className="text-xs font-semibold text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-forest/20 bg-white text-sm text-forest/55">
          No gallery images yet
        </div>
      )}
    </section>
  );
}
