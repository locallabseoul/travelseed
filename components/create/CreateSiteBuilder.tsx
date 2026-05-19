"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { postLoginRedirectPath } from "@/components/auth/post-login-redirect";
import { savePreviewResort } from "@/components/create/preview-storage";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { renderResortTemplate, resortTemplateOptions } from "@/components/templates";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Resort, ResortOfferInput } from "@/types/resort";

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

type ServiceDraft = ResortOfferInput & {
  draftId: string;
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

const maxImageDimension = 1800;
const publishedSitePayloadLimit = 3_800_000;

function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function imageFileToOptimizedDataUrl(file: File) {
  if (file.type === "image/gif") {
    return readFileAsDataUrl(file);
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Could not read this image."));
      nextImage.src = imageUrl;
    });
    const scale = Math.min(1, maxImageDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return readFileAsDataUrl(file);
    }

    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));

    return readFileAsDataUrl(blob ?? file);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function createSiteRequest(resort: Resort, services: ServiceDraft[], accessToken: string) {
  return fetch("/api/create-site", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      resort,
      services: services.map((service, index) => ({
        kind: service.kind,
        title: service.title,
        description: service.description,
        price_label: service.price_label,
        capacity: service.capacity,
        image_url: service.image_url,
        highlight: service.highlight,
        duration: service.duration,
        included: service.included,
        cta_label: service.cta_label,
        bed_type: service.bed_type,
        room_size: service.room_size,
        view_type: service.view_type,
        bathroom_info: service.bathroom_info,
        max_guests: service.max_guests,
        room_amenities: service.room_amenities,
        is_active: service.is_active,
        sort_order: index,
      })),
    }),
  });
}

async function readCreateSiteError(response: Response) {
  const fallback = response.statusText || "Could not create the site.";
  const text = await response.text().catch(() => "");

  if (!text) {
    return fallback;
  }

  try {
    const data = JSON.parse(text) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return response.status === 413 ? "Uploaded images are too large. Remove a few photos or upload smaller images." : text;
  }
}

function draftList(value: string[] | undefined) {
  return value?.filter(Boolean).join("\n") ?? "";
}

function draftNumber(value: string | undefined) {
  return value?.match(/\d+/)?.[0] ?? "";
}

function serviceDraftsFromApi(value: unknown): ServiceDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((service, index) => {
    const draft = service as Partial<ResortOfferInput>;
    const kind = draft.kind && ["room", "package", "service"].includes(draft.kind) ? draft.kind : "service";

    return {
      draftId: `ai-service-${Date.now()}-${index}`,
      kind,
      title: String(draft.title ?? "").trim(),
      description: draft.description ? String(draft.description).trim() : null,
      price_label: draft.price_label ? String(draft.price_label).trim() : null,
      capacity: typeof draft.capacity === "number" && Number.isFinite(draft.capacity) ? draft.capacity : null,
      image_url: draft.image_url ? String(draft.image_url).trim() : null,
      highlight: draft.highlight ? String(draft.highlight).trim() : null,
      duration: draft.duration ? String(draft.duration).trim() : null,
      included: Array.isArray(draft.included) ? draft.included.map(String).map((item) => item.trim()).filter(Boolean) : [],
      cta_label: draft.cta_label ? String(draft.cta_label).trim() : null,
      bed_type: kind === "room" && draft.bed_type ? String(draft.bed_type).trim() : null,
      room_size: kind === "room" && draft.room_size ? String(draft.room_size).trim() : null,
      view_type: kind === "room" && draft.view_type ? String(draft.view_type).trim() : null,
      bathroom_info: kind === "room" && draft.bathroom_info ? String(draft.bathroom_info).trim() : null,
      max_guests: kind === "room" && typeof draft.max_guests === "number" && Number.isFinite(draft.max_guests) ? draft.max_guests : null,
      room_amenities: kind === "room" && Array.isArray(draft.room_amenities) ? draft.room_amenities.map(String).map((item) => item.trim()).filter(Boolean) : [],
      is_active: true,
      sort_order: index,
    };
  }).filter((service) => service.title);
}

function createPreviewResort(form: BuilderForm): Resort {
  const gallery = textareaList(form.gallery_images);

  return {
    id: "preview-resort",
    owner_user_id: null,
    owner_email: null,
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
  const { t } = useLanguage();
  const [form, setForm] = useState<BuilderForm>(starterForm);
  const [builderStarted, setBuilderStarted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [building, setBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [serviceDrafts, setServiceDrafts] = useState<ServiceDraft[]>([]);
  const [selectedServiceDrafts, setSelectedServiceDrafts] = useState<Set<string>>(new Set());
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
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
      const nextServiceDrafts = serviceDraftsFromApi(data.servicesDraft);
      setServiceDrafts(nextServiceDrafts);
      setSelectedServiceDrafts(new Set(nextServiceDrafts.map((service) => service.draftId)));
      setBuilderStarted(true);
      setActiveStep(0);
      setImportStatus(data.warning ?? `Draft created${nextServiceDrafts.length ? ` with ${nextServiceDrafts.length} suggested offer items` : ""}. Review each field before publishing.`);
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
    const dataUrl = await imageFileToOptimizedDataUrl(file);
    updateField("hero_image_url", dataUrl);
    setUploadStatus("Hero image added to preview. It will upload to Storage when the site is created.");
  }

  async function handleGalleryFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) {
      return;
    }

    setUploadStatus(`Preparing ${files.length} gallery image${files.length > 1 ? "s" : ""}...`);
    const dataUrls = await Promise.all(files.map((file) => imageFileToOptimizedDataUrl(file)));
    updateField("gallery_images", [...textareaList(form.gallery_images), ...dataUrls].join("\n"));
    setUploadStatus("Gallery images added to preview. They will upload to Storage when the site is created.");
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
      setAuthStatus("Check your email to verify the account. If you already have an account, switch back to sign in.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    if (error) {
      setAuthStatus(error.message);
      return;
    }

    setAuthPassword("");
    setAuthStatus("Checking your sites...");
    const nextPath = await postLoginRedirectPath(data.session?.access_token, "/create");
    if (nextPath !== "/create") {
      router.push(nextPath);
      return;
    }

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

    const { data: sessionData } = await supabase.auth.getSession();
    const { data: refreshedData } = await supabase.auth.refreshSession();
    const activeSession = refreshedData.session ?? sessionData.session;

    if (!activeSession?.access_token) {
      setBuildStatus("Create an account or sign in before building your site.");
      return;
    }

    setSession(activeSession);

    if (!form.name.trim()) {
      setBuildStatus("Add a resort name first. This becomes the site name and URL slug.");
      setActiveStep(0);
      return;
    }

    const slug = slugify(form.slug || form.name);
    const resort = createPreviewResort({ ...form, slug });
    const services = serviceDrafts.filter((service) => selectedServiceDrafts.has(service.draftId));
    const payloadSize = new Blob([JSON.stringify({ resort, services })]).size;

    if (payloadSize > publishedSitePayloadLimit) {
      setBuildStatus("Uploaded images are too large to publish at once. Remove a few photos or upload smaller images.");
      setActiveStep(2);
      return;
    }

    setBuilding(true);
    setBuildStatus("Creating your direct booking site...");

    try {
      let response = await createSiteRequest(resort, services, activeSession.access_token);

      if (response.status === 401) {
        const { data: refreshedData } = await supabase.auth.refreshSession();
        const refreshedSession = refreshedData.session;

        if (refreshedSession?.access_token) {
          setSession(refreshedSession);
          response = await createSiteRequest(resort, services, refreshedSession.access_token);
        }
      }

      if (!response.ok) {
        if (response.status === 409) {
          setBuildStatus(`The URL slug "${slug}" is already taken. Change the site URL slug and try again.`);
          setActiveStep(0);
          return;
        }

        setBuildStatus(await readCreateSiteError(response));
        return;
      }

      setBuildStatus("Site created. Opening your new direct booking page...");
      router.push(`/${slug}`);
    } catch (error) {
      setBuildStatus(error instanceof Error ? error.message : "Could not create the site.");
    } finally {
      setBuilding(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#18352f]">
      <div className="px-5 pt-6 sm:px-6">
        <AppHeader />
      </div>
      <section className="px-5 py-10 sm:px-6 lg:py-14">
        {!authReady ? (
          <p className="mx-auto max-w-3xl text-sm font-medium text-[#51635b]">{t("create.loading.session")}</p>
        ) : null}
        {authReady && isSupabaseConfigured && !session ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72815e]">{t("create.auth.kicker")}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                {t("create.auth.title")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#51635b]">
                {t("create.auth.body")}
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72815e]">{t("create.preview.kicker")}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                {t("create.preview.title")}
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#51635b]">
                {t("create.preview.body")}
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
                  serviceDrafts,
                  selectedServiceDrafts,
                  setSelectedServiceDrafts,
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-[#eadfce] pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
                  disabled={activeStep === 0}
                  className="min-h-[48px] rounded-full border border-[#d8cebb] px-6 text-sm font-semibold text-[#18352f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("create.back")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep((current) => Math.min(current + 1, steps.length - 1))}
                  disabled={isLastStep}
                  className="min-h-[48px] rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("create.next")}
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
                <span className="ml-auto hidden text-xs font-medium text-[#6a675c] sm:inline">{t("create.preview.scrollable")}</span>
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
                  {t("create.preview.full")}
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
  const { t } = useLanguage();

  return (
    <div className="mx-auto mb-10 max-w-3xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72815e]">{t("create.start.kicker")}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          {t("create.start.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#51635b]">
          {t("create.start.body")}
        </p>
      </div>

      <div className="mt-8 rounded-md bg-white p-5 shadow-[0_24px_80px_rgba(54,43,29,0.08)] sm:p-6">
        <div className="grid gap-4">
          <div className="rounded-md border border-[#eadfce] bg-[#fbf8f1] p-4">
            <p className="text-sm font-semibold text-[#18352f]">{t("create.ai.title")}</p>
            <p className="mt-2 text-sm leading-6 text-[#51635b]">
              {t("create.ai.body")}
            </p>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              {t("create.ai.url")}
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
              className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? (
                <>
                  <CircularProgressIcon className="h-4 w-4" />
                  <span>{t("create.ai.loading")}</span>
                </>
              ) : (
                t("create.ai.button")
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onManualStart}
            className="min-h-[52px] rounded-full border border-[#d8cebb] bg-white px-6 text-sm font-semibold text-[#18352f]"
          >
            {t("create.manual")}
          </button>

          {importStatus ? (
            <p className="rounded-md bg-[#f8f5ef] p-3 text-sm leading-6 text-[#51635b]">{importStatus}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CircularProgressIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M22 12a10 10 0 0 1-10 10v-4a6 6 0 0 0 6-6h4Z" />
    </svg>
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
  const { t } = useLanguage();

  if (session) {
    return (
      <div className="mb-5 flex flex-col gap-3 rounded-md border border-[#d8cebb] bg-[#fbf8f1] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#18352f]">{t("create.account.ready")}</p>
          <p className="mt-1 text-sm text-[#51635b]">{session.user.email}</p>
        </div>
        <button type="button" onClick={() => void onSignOut()} className="text-sm font-semibold text-[#0f5f6b]">
          {t("create.account.signOut")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mb-5 grid gap-4 rounded-md border border-[#d8cebb] bg-[#fbf8f1] p-4">
      <div>
        <p className="text-sm font-semibold text-[#18352f]">
          {authMode === "sign-up" ? t("create.account.signUpTitle") : t("create.account.signInTitle")}
        </p>
        <p className="mt-1 text-sm leading-6 text-[#51635b]">
          {authMode === "sign-up"
            ? t("create.account.signUpBody")
            : t("create.account.signInBody")}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("create.account.email")} value={authEmail} onChange={onEmailChange} type="email" />
        <TextField label={t("create.account.password")} value={authPassword} onChange={onPasswordChange} type="password" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="min-h-[48px] rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white">
          {authMode === "sign-up" ? t("create.account.signUp") : t("create.account.signIn")}
        </button>
        <button
          type="button"
          onClick={() => {
            onAuthModeChange(authMode === "sign-up" ? "sign-in" : "sign-up");
          }}
          className="text-sm font-semibold text-[#0f5f6b]"
        >
          {authMode === "sign-up" ? t("create.account.hasAccount") : t("create.account.create")}
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
  serviceDrafts: ServiceDraft[],
  selectedServiceDrafts: Set<string>,
  setSelectedServiceDrafts: (value: Set<string>) => void,
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
    <div className="grid gap-5">
      <ServiceDraftReview
        services={serviceDrafts}
        selectedIds={selectedServiceDrafts}
        onSelectionChange={setSelectedServiceDrafts}
      />
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
    </div>
  );
}

function ServiceDraftReview({
  services,
  selectedIds,
  onSelectionChange,
}: {
  services: ServiceDraft[];
  selectedIds: Set<string>;
  onSelectionChange: (value: Set<string>) => void;
}) {
  if (services.length === 0) {
    return null;
  }

  function toggleService(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  return (
    <section className="rounded-md border border-[#eadfce] bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#18352f]">AI suggested rooms, packages & services</p>
          <p className="mt-1 text-sm leading-6 text-[#51635b]">Selected items will be saved as editable offer inventory when the site is created.</p>
        </div>
        <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#7b5b24]">{selectedIds.size} selected</span>
      </div>
      <div className="mt-4 grid gap-3">
        {services.map((service) => (
          <label key={service.draftId} className="grid gap-2 rounded-md bg-[#fbf8f1] p-3 text-sm ring-1 ring-[#eadfce]">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selectedIds.has(service.draftId)} onChange={() => toggleService(service.draftId)} className="mt-1 h-4 w-4 accent-[#2d6b50]" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-[#1f5a45] ring-1 ring-[#d8cebb]">{service.kind}</span>
                  {service.price_label ? <span className="text-xs font-medium text-[#6f7b74]">{service.price_label}</span> : null}
                </div>
                <p className="mt-2 font-semibold text-[#18352f]">{service.title}</p>
                {service.description ? <p className="mt-1 leading-6 text-[#51635b]">{service.description}</p> : null}
                {service.included?.length ? <p className="mt-1 text-xs text-[#6f7b74]">{service.included.join(" · ")}</p> : null}
              </div>
            </div>
          </label>
        ))}
      </div>
    </section>
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
