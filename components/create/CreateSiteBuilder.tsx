"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { savePreviewResort } from "@/components/create/preview-storage";
import { renderResortTemplate, resortTemplateOptions } from "@/components/templates";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Resort } from "@/types/resort";

type BuilderForm = {
  name: string;
  slug: string;
  location: string;
  type: string;
  template_id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  gallery_images: string;
  whatsapp_number: string;
  capacity: string;
  bedrooms: string;
  bathrooms: string;
  description: string;
  features: string;
  experiences: string;
};

type ImportDraft = Partial<Omit<BuilderForm, "features" | "experiences" | "gallery_images" | "hero_image_url">> & {
  features?: string[];
  experiences?: string[];
};

const steps = [
  {
    title: "Basic Info",
    eyebrow: "Step 1",
    description: "Name, location, positioning, and WhatsApp contact.",
  },
  {
    title: "Rooms & Capacity",
    eyebrow: "Step 2",
    description: "Set the practical details guests scan first.",
  },
  {
    title: "Photos & Template",
    eyebrow: "Step 3",
    description: "Upload preview images and choose a design direction.",
  },
  {
    title: "Features",
    eyebrow: "Step 4",
    description: "Add amenities and nearby experiences.",
  },
  {
    title: "Launch",
    eyebrow: "Step 5",
    description: "Move from preview into publishing and subscription.",
  },
];

const starterForm: BuilderForm = {
  name: "",
  slug: "",
  location: "",
  type: "",
  template_id: "boutique-villa",
  hero_title: "",
  hero_subtitle: "",
  hero_image_url: "",
  gallery_images: "",
  whatsapp_number: "",
  capacity: "",
  bedrooms: "",
  bathrooms: "",
  description: "",
  features: "",
  experiences: "",
};

function textareaList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: string) {
  return value.trim() ? Number(value) : null;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "preview-resort"
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function draftList(value: string[] | undefined) {
  return value?.filter(Boolean).join("\n") ?? "";
}

function draftNumber(value: string | undefined) {
  return value?.match(/\d+/)?.[0] ?? "";
}

function createPreviewResort(form: BuilderForm): Resort {
  const gallery = textareaList(form.gallery_images);

  return {
    id: "preview-resort",
    slug: slugify(form.slug || form.name),
    name: form.name.trim() || "Your Resort",
    domain: null,
    template_id: form.template_id,
    location: form.location.trim() || "Your destination",
    type: form.type.trim() || null,
    description: form.description.trim() || null,
    hero_title: form.hero_title.trim() || `Direct booking for ${form.name || "your resort"}`,
    hero_subtitle: form.hero_subtitle.trim() || null,
    hero_image_url: form.hero_image_url.trim() || null,
    whatsapp_number: form.whatsapp_number.trim() || "6281234567890",
    capacity: numberOrNull(form.capacity),
    bedrooms: numberOrNull(form.bedrooms),
    bathrooms: numberOrNull(form.bathrooms),
    features: textareaList(form.features),
    gallery,
    experiences: textareaList(form.experiences),
    booking_message_template: `Hello, I would like to make a reservation at ${form.name || "your resort"}.
Check-in:
Check-out:
Guests:
Airport Pickup:`,
    is_active: true,
  };
}

export function CreateSiteBuilder() {
  const router = useRouter();
  const [form, setForm] = useState<BuilderForm>(starterForm);
  const [builderStarted, setBuilderStarted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [building, setBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const previewResort = useMemo(() => createPreviewResort(form), [form]);
  const galleryImages = useMemo(() => textareaList(form.gallery_images), [form.gallery_images]);

  const isLastStep = activeStep === steps.length - 1;

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
    });

    return () => subscription.unsubscribe();
  }, []);

  function updateField<Key extends keyof BuilderForm>(key: Key, value: BuilderForm[Key]) {
    setForm((current) => {
      if (key === "name") {
        const currentSuggestedSlug = slugify(current.name);
        const nextName = String(value);
        const shouldUpdateSlug = !current.slug || current.slug === currentSuggestedSlug;

        return {
          ...current,
          name: nextName,
          slug: shouldUpdateSlug ? slugify(nextName) : current.slug,
        };
      }

      if (key === "slug") {
        return { ...current, slug: slugify(String(value)) };
      }

      return { ...current, [key]: value };
    });
  }

  function applyImportDraft(draft: ImportDraft) {
    setForm((current) => {
      const nextName = draft.name?.trim() || current.name;
      const nextSlug = draft.slug?.trim() || (nextName ? slugify(nextName) : current.slug);

      return {
        ...current,
        name: nextName,
        slug: nextSlug,
        location: draft.location?.trim() || current.location,
        type: draft.type?.trim() || current.type,
        template_id: draft.template_id?.trim() || current.template_id,
        hero_title: draft.hero_title?.trim() || current.hero_title,
        hero_subtitle: draft.hero_subtitle?.trim() || current.hero_subtitle,
        capacity: draftNumber(draft.capacity) || current.capacity,
        bedrooms: draftNumber(draft.bedrooms) || current.bedrooms,
        bathrooms: draftNumber(draft.bathrooms) || current.bathrooms,
        description: draft.description?.trim() || current.description,
        features: draft.features?.length ? draftList(draft.features) : current.features,
        experiences: draft.experiences?.length ? draftList(draft.experiences) : current.experiences,
      };
    });
  }

  async function handleImportListing() {
    setImportStatus("");

    if (!listingUrl.trim()) {
      setImportStatus("Paste a public OTA listing URL first.");
      return;
    }

    setImporting(true);
    setImportStatus("Reading the listing and preparing a direct-booking draft...");

    try {
      const response = await fetch("/api/import-listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        setImportStatus(data?.error ?? "Could not import this listing. You can continue manually.");
        return;
      }

      applyImportDraft(data.draft ?? {});
      setBuilderStarted(true);
      setActiveStep(0);
      setImportStatus(data.warning ?? "Draft created. Review each field before publishing.");
    } catch {
      setImportStatus("Could not import this listing. You can continue manually.");
    } finally {
      setImporting(false);
    }
  }

  async function handleHeroFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) {
      return;
    }

    setUploadStatus("Preparing hero preview...");
    const dataUrl = await readFileAsDataUrl(file);
    updateField("hero_image_url", dataUrl);
    setUploadStatus("Hero image added to preview. Upload to Storage happens after subscription.");
  }

  async function handleGalleryFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) {
      return;
    }

    setUploadStatus(`Preparing ${files.length} gallery image${files.length > 1 ? "s" : ""}...`);
    const dataUrls = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
    updateField("gallery_images", [...textareaList(form.gallery_images), ...dataUrls].join("\n"));
    setUploadStatus("Gallery images added to preview. Upload to Storage happens after subscription.");
  }

  function removeGalleryImage(imageUrl: string) {
    updateField(
      "gallery_images",
      textareaList(form.gallery_images)
        .filter((item) => item !== imageUrl)
        .join("\n"),
    );
  }

  function openFullPreview() {
    savePreviewResort(previewResort);
    window.open("/preview", "_blank", "noopener,noreferrer");
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthStatus(authMode === "sign-in" ? "Signing in..." : "Creating account...");

    if (authMode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/create`,
        },
      });

      if (error) {
        setAuthStatus(error.message);
        return;
      }

      setAuthPassword("");
      setAuthMode("sign-in");
      setAuthStatus("Check your email to verify the account, then sign in.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    if (error) {
      setAuthStatus(error.message);
      return;
    }

    setAuthPassword("");
    setAuthStatus("");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setAuthStatus("");
  }

  async function handleBuildSite() {
    if (!isSupabaseConfigured) {
      setBuildStatus("Supabase is not configured. Connect Supabase before creating a site.");
      return;
    }

    if (!session?.access_token) {
      setBuildStatus("Create an account or sign in before building your site.");
      return;
    }

    if (!form.name.trim()) {
      setBuildStatus("Add a resort name first. This becomes the site name and URL slug.");
      setActiveStep(0);
      return;
    }

    const slug = slugify(form.slug || form.name);
    const resort = createPreviewResort({ ...form, slug });

    setBuilding(true);
    setBuildStatus("Creating your direct booking site...");

    try {
      const response = await fetch("/api/create-site", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ resort }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setBuildStatus(`The URL slug "${slug}" is already taken. Change the site URL slug and try again.`);
          setActiveStep(0);
          return;
        }

        setBuildStatus(data?.error ?? "Could not create the site.");
        return;
      }

      setBuildStatus("Site created. Opening your new direct booking page...");
      router.push(`/sites/${slug}`);
    } catch (error) {
      setBuildStatus(error instanceof Error ? error.message : "Could not create the site.");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#18352f]">
      <header className="px-5 pt-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-[0.22em]">
            TRAVELSEED
          </Link>
          <Link href="/login?next=/create" className="text-sm font-semibold text-[#51635b]">
            Account
          </Link>
        </div>
      </header>
      <section className="px-5 py-10 sm:px-6 lg:py-14">
        {!authReady ? (
          <p className="mx-auto max-w-3xl text-sm font-medium text-[#51635b]">Checking account session...</p>
        ) : null}
        {authReady && isSupabaseConfigured && !session ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72815e]">Create your site</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                Sign in before building your direct booking site.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#51635b]">
                Create a verified account first, then import your listing or start manually.
              </p>
            </div>
            <AccountPanel
              session={session}
              authMode={authMode}
              authEmail={authEmail}
              authPassword={authPassword}
              authStatus={authStatus}
              onAuthModeChange={setAuthMode}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              onSubmit={handleAuthSubmit}
              onSignOut={handleSignOut}
            />
          </div>
        ) : null}
        {authReady && (!isSupabaseConfigured || session) && !builderStarted ? (
          <StartChoice
            listingUrl={listingUrl}
            onListingUrlChange={setListingUrl}
            importing={importing}
            importStatus={importStatus}
            onImportListing={handleImportListing}
            onManualStart={() => {
              setBuilderStarted(true);
              setImportStatus("");
            }}
          />
        ) : null}
        {builderStarted ? (
          <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(460px,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72815e]">Build your preview</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                Try your direct booking website before you subscribe.
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#51635b]">
                Add your resort details step by step, switch templates, and preview how Travelseed can turn
                your listing into a direct booking brand.
              </p>

              <div className="mt-8 rounded-md bg-white p-5 shadow-[0_24px_80px_rgba(54,43,29,0.08)] sm:p-6">
                {importStatus ? (
                  <p className="mb-5 rounded-md bg-[#f8f5ef] p-3 text-sm leading-6 text-[#51635b]">
                    {importStatus}
                  </p>
                ) : null}
                <AccountPanel
                  session={session}
                  authMode={authMode}
                  authEmail={authEmail}
                  authPassword={authPassword}
                  authStatus={authStatus}
                  onAuthModeChange={setAuthMode}
                  onEmailChange={setAuthEmail}
                  onPasswordChange={setAuthPassword}
                  onSubmit={handleAuthSubmit}
                  onSignOut={handleSignOut}
                />
                <StepProgress activeStep={activeStep} onSelect={setActiveStep} />

              <div className="mt-7 border-t border-[#eadfce] pt-7">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72815e]">
                  {steps[activeStep].eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{steps[activeStep].title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#51635b]">{steps[activeStep].description}</p>
              </div>

              <div className="mt-6">
                {renderStep(
                  activeStep,
                  form,
                  updateField,
                  handleHeroFile,
                  handleGalleryFiles,
                  removeGalleryImage,
                  galleryImages,
                  uploadStatus,
                  building,
                  buildStatus,
                  handleBuildSite,
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-[#eadfce] pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
                  disabled={activeStep === 0}
                  className="min-h-[48px] rounded-full border border-[#d8cebb] px-6 text-sm font-semibold text-[#18352f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep((current) => Math.min(current + 1, steps.length - 1))}
                  disabled={isLastStep}
                  className="min-h-[48px] rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-3 shadow-[0_34px_110px_rgba(54,43,29,0.16)] backdrop-blur">
              <div className="flex items-center gap-2 border-b border-[#eee7da] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#d8a87a]" />
                <span className="h-3 w-3 rounded-full bg-[#dbc895]" />
                <span className="h-3 w-3 rounded-full bg-[#78906b]" />
                <span className="ml-3 truncate rounded-full bg-[#f4efe7] px-4 py-1 text-xs text-[#6a675c]">
                  {previewResort.slug}.travelseed.app
                </span>
                <span className="ml-auto hidden text-xs font-medium text-[#6a675c] sm:inline">Scrollable preview</span>
              </div>
              <div className="relative h-[760px] overflow-y-auto overflow-x-hidden rounded-b-[20px] bg-white">
                <div className="site-preview w-full">
                  {renderResortTemplate(previewResort, form.template_id)}
                </div>
              </div>
              <div className="border-t border-[#eee7da] bg-white px-4 py-4">
                <button
                  type="button"
                  onClick={openFullPreview}
                  className="min-h-[48px] w-full rounded-full border border-[#d8cebb] bg-[#f8f5ef] px-6 text-sm font-semibold text-[#18352f]"
                >
                  Open Full Preview
                </button>
              </div>
            </div>
          </aside>
        </div>
        ) : null}
      </section>
    </main>
  );
}

function StartChoice({
  listingUrl,
  onListingUrlChange,
  importing,
  importStatus,
  onImportListing,
  onManualStart,
}: {
  listingUrl: string;
  onListingUrlChange: (value: string) => void;
  importing: boolean;
  importStatus: string;
  onImportListing: () => Promise<void>;
  onManualStart: () => void;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72815e]">Build your site</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Start with AI from your OTA listing, or build manually.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#51635b]">
          Paste a public Booking, Airbnb, Agoda, or resort listing URL to generate a direct-booking
          draft. You can review and edit every field before launch.
        </p>
      </div>

      <div className="mt-8 rounded-md bg-white p-5 shadow-[0_24px_80px_rgba(54,43,29,0.08)] sm:p-6">
        <div className="grid gap-4">
          <div className="rounded-md border border-[#eadfce] bg-[#fbf8f1] p-4">
            <p className="text-sm font-semibold text-[#18352f]">Create with AI</p>
            <p className="mt-2 text-sm leading-6 text-[#51635b]">
              Travelseed will read public listing text and turn it into a website draft with copy,
              amenities, experiences, and a recommended template.
            </p>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              OTA listing URL
              <input
                type="url"
                value={listingUrl}
                onChange={(event) => onListingUrlChange(event.target.value)}
                placeholder="https://www.booking.com/hotel/..."
                className="min-h-12 rounded-md border border-[#d8cebb] bg-white px-3 outline-none focus:border-[#18352f]"
              />
            </label>
            <button
              type="button"
              onClick={() => void onImportListing()}
              disabled={importing}
              className="mt-4 min-h-[52px] w-full rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? "Generating Draft..." : "Generate with AI"}
            </button>
          </div>

          <button
            type="button"
            onClick={onManualStart}
            className="min-h-[52px] rounded-full border border-[#d8cebb] bg-white px-6 text-sm font-semibold text-[#18352f]"
          >
            Enter Details Manually
          </button>

          {importStatus ? (
            <p className="rounded-md bg-[#f8f5ef] p-3 text-sm leading-6 text-[#51635b]">{importStatus}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AccountPanel({
  session,
  authMode,
  authEmail,
  authPassword,
  authStatus,
  onAuthModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSignOut,
}: {
  session: Session | null;
  authMode: "sign-in" | "sign-up";
  authEmail: string;
  authPassword: string;
  authStatus: string;
  onAuthModeChange: (mode: "sign-in" | "sign-up") => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  if (session) {
    return (
      <div className="mb-5 flex flex-col gap-3 rounded-md border border-[#d8cebb] bg-[#fbf8f1] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#18352f]">Account ready</p>
          <p className="mt-1 text-sm text-[#51635b]">{session.user.email}</p>
        </div>
        <button type="button" onClick={() => void onSignOut()} className="text-sm font-semibold text-[#0f5f6b]">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mb-5 grid gap-4 rounded-md border border-[#d8cebb] bg-[#fbf8f1] p-4">
      <div>
        <p className="text-sm font-semibold text-[#18352f]">
          {authMode === "sign-up" ? "Create your Travelseed account" : "Sign in to build"}
        </p>
        <p className="mt-1 text-sm leading-6 text-[#51635b]">
          {authMode === "sign-up"
            ? "Verify your email before publishing your direct booking site."
            : "Use your verified account to create and manage your site."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Email" value={authEmail} onChange={onEmailChange} type="email" />
        <TextField label="Password" value={authPassword} onChange={onPasswordChange} type="password" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="min-h-[48px] rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white">
          {authMode === "sign-up" ? "Create Account" : "Sign In"}
        </button>
        <button
          type="button"
          onClick={() => {
            onAuthModeChange(authMode === "sign-up" ? "sign-in" : "sign-up");
          }}
          className="text-sm font-semibold text-[#0f5f6b]"
        >
          {authMode === "sign-up" ? "Already have an account?" : "Create an account"}
        </button>
      </div>
      {authStatus ? <p className="rounded-md bg-white p-3 text-sm text-[#51635b]">{authStatus}</p> : null}
    </form>
  );
}

function renderStep(
  activeStep: number,
  form: BuilderForm,
  updateField: <Key extends keyof BuilderForm>(key: Key, value: BuilderForm[Key]) => void,
  handleHeroFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>,
  handleGalleryFiles: (event: ChangeEvent<HTMLInputElement>) => Promise<void>,
  removeGalleryImage: (imageUrl: string) => void,
  galleryImages: string[],
  uploadStatus: string,
  building: boolean,
  buildStatus: string,
  handleBuildSite: () => Promise<void>,
) {
  if (activeStep === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Resort name" value={form.name} onChange={(value) => updateField("name", value)} />
        <TextField label="Site URL slug" value={form.slug} onChange={(value) => updateField("slug", value)} />
        <TextField label="Location" value={form.location} onChange={(value) => updateField("location", value)} />
        <TextField label="Property type" value={form.type} onChange={(value) => updateField("type", value)} />
        <TextField label="WhatsApp number" value={form.whatsapp_number} onChange={(value) => updateField("whatsapp_number", value)} />
        <div className="sm:col-span-2">
          <TextareaField label="Short description" value={form.description} onChange={(value) => updateField("description", value)} />
        </div>
        <ExampleBox
          title="Example"
          text="Villa Jeruk · villa-jeruk · Selong Belanak, Lombok · Private tropical villa · WhatsApp +62..."
        />
      </div>
    );
  }

  if (activeStep === 1) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Guests" value={form.capacity} onChange={(value) => updateField("capacity", value)} type="number" />
        <TextField label="Bedrooms" value={form.bedrooms} onChange={(value) => updateField("bedrooms", value)} type="number" />
        <TextField label="Bathrooms" value={form.bathrooms} onChange={(value) => updateField("bathrooms", value)} type="number" />
        <ExampleBox title="Example" text="6 guests · 3 bedrooms · 2 bathrooms" />
      </div>
    );
  }

  if (activeStep === 2) {
    return (
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-medium">
          Template
          <select
            value={form.template_id}
            onChange={(event) => updateField("template_id", event.target.value)}
            className="min-h-11 rounded-md border border-[#d8cebb] bg-white px-3 outline-none focus:border-[#18352f]"
          >
            {resortTemplateOptions.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </label>

        <TextField label="Hero headline" value={form.hero_title} onChange={(value) => updateField("hero_title", value)} />
        <TextField label="Hero subtitle" value={form.hero_subtitle} onChange={(value) => updateField("hero_subtitle", value)} />
        <TextField label="Hero image URL" value={form.hero_image_url} onChange={(value) => updateField("hero_image_url", value)} />

        <div className="grid gap-3 rounded-md bg-[#f8f5ef] p-4">
          <p className="text-sm font-semibold">Upload photos for preview</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FileButton label="Upload hero photo" onChange={handleHeroFile} />
            <FileButton label="Upload gallery photos" onChange={handleGalleryFiles} multiple />
          </div>
          {uploadStatus ? <p className="text-sm leading-6 text-[#51635b]">{uploadStatus}</p> : null}
        </div>

        <GalleryPreview gallery={galleryImages} onRemove={removeGalleryImage} />
        <ExampleBox
          title="Example"
          text="Use a bright pool, villa exterior, room, breakfast, and nearby beach photo. You can upload multiple gallery images at once."
        />
      </div>
    );
  }

  if (activeStep === 3) {
    return (
      <div className="grid gap-5">
        <TextareaField label="Features, one per line" value={form.features} onChange={(value) => updateField("features", value)} />
        <TextareaField
          label="Nearby experiences, one per line"
          value={form.experiences}
          onChange={(value) => updateField("experiences", value)}
        />
        <ExampleBox
          title="Example"
          text="Private Pool, Fast WiFi, Fully Equipped Kitchen, Tropical Garden · Selong Belanak Beach, Surfing, Sunset Beaches"
        />
      </div>
    );
  }

  return (
    <div className="rounded-md bg-[#f8f5ef] p-5">
      <p className="text-sm font-semibold">Ready to turn this preview into a real site?</p>
      <p className="mt-2 text-sm leading-6 text-[#51635b]">
        Review the live preview on the right. Create or sign in to your verified account, then publish
        the direct booking site with hosted images and a dedicated public URL.
      </p>
      <button
        type="button"
        onClick={() => void handleBuildSite()}
        disabled={building}
        className="mt-5 min-h-[52px] w-full rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white"
      >
        {building ? "Creating Site..." : "Build My Site"}
      </button>
      {buildStatus ? (
        <p className="mt-3 rounded-md bg-white p-3 text-sm text-[#51635b]">{buildStatus}</p>
      ) : null}
    </div>
  );
}

function ExampleBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-[#eadfce] bg-[#fbf8f1] p-4 text-sm leading-6 text-[#51635b] sm:col-span-full">
      <span className="font-semibold text-[#18352f]">{title}: </span>
      {text}
    </div>
  );
}

function GalleryPreview({
  gallery,
  onRemove,
}: {
  gallery: string[];
  onRemove: (imageUrl: string) => void;
}) {
  if (gallery.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#d8cebb] bg-white p-6 text-center text-sm text-[#51635b]">
        No gallery images yet. Upload photos to see them in the live preview.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {gallery.map((imageUrl) => (
        <div key={imageUrl} className="overflow-hidden rounded-md border border-[#eadfce] bg-white">
          <div className="relative aspect-[4/3]">
            <Image src={imageUrl} alt="Uploaded gallery preview" fill sizes="(min-width: 768px) 24vw, 100vw" className="object-cover" />
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <p className="truncate text-xs text-[#51635b]">Gallery image</p>
            <button type="button" onClick={() => onRemove(imageUrl)} className="text-xs font-semibold text-red-700">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StepProgress({ activeStep, onSelect }: { activeStep: number; onSelect: (step: number) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => (
        <button
          key={step.title}
          type="button"
          onClick={() => onSelect(index)}
          className={`rounded-md border p-3 text-left transition ${
            activeStep === index
              ? "border-[#18352f] bg-[#18352f] text-white"
              : "border-[#eadfce] bg-[#fbf8f1] text-[#51635b]"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">{step.eyebrow}</p>
          <p className="mt-2 text-sm font-semibold">{step.title}</p>
        </button>
      ))}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-[#d8cebb] bg-white px-3 outline-none focus:border-[#18352f]"
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
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <textarea
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-[#d8cebb] bg-white px-3 py-3 outline-none focus:border-[#18352f]"
      />
    </label>
  );
}

function FileButton({
  label,
  onChange,
  multiple,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  multiple?: boolean;
}) {
  return (
    <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple={multiple}
        onChange={(event) => void onChange(event)}
        className="sr-only"
      />
    </label>
  );
}
