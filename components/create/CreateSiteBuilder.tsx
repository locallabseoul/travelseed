"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { TravelseedWordmark } from "@/components/brand/TravelseedWordmark";
import { postLoginRedirectPath } from "@/components/auth/post-login-redirect";
import { savePreviewResort } from "@/components/create/preview-storage";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { renderResortTemplate } from "@/components/templates";
import { businessCategories, businessCategoryFromType, businessTypeOptions } from "@/lib/business-categories";
import { defaultTemplateIdForBusinessType } from "@/lib/category-templates";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { templateCatalogForCategory } from "@/lib/template-catalog";
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

type StepCopy = {
  title: string;
  description: string;
};

type BuilderLabels = {
  back: string;
  next: string;
  search: string;
  workspace: string;
  progress: string;
  complete: string;
  completed: string;
  current: string;
  upcoming: string;
  help: string;
  userGuide: string;
  support: string;
  saveContinue: string;
  continueTemplate: string;
  continuePreview: string;
  editBeforePublish: string;
  publishNow: string;
  openFullPreview: string;
};

const steps = [
  {
    title: "Business Details",
    eyebrow: "Step 1",
    description: "Business type, name, location, description, and WhatsApp contact.",
  },
  {
    title: "Services & Offers",
    eyebrow: "Step 2",
    description: "Review AI-suggested offers and add the practical highlights customers scan first.",
  },
  {
    title: "Template & Style",
    eyebrow: "Step 3",
    description: "Choose a template direction, hero copy, and photos for the public site.",
  },
  {
    title: "Preview & Publish",
    eyebrow: "Step 4",
    description: "Review the live preview, selected offers, SEO basics, and WhatsApp flow.",
  },
];

const starterForm: BuilderForm = {
  name: "",
  slug: "",
  location: "",
  type: "",
  template_id: "minimal-stay",
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
      .replace(/^-+|-+$/g, "") || "preview-business"
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
  const category = businessCategoryFromType(form.type);
  const accommodation = category.id === "accommodation";
  const businessName = form.name.trim() || "Your Business";

  return {
    id: "preview-business",
    owner_user_id: null,
    owner_email: null,
    slug: slugify(form.slug || form.name),
    name: businessName,
    domain: null,
    template_id: form.template_id,
    location: form.location.trim() || "Your area",
    type: form.type.trim() || null,
    description: form.description.trim() || null,
    hero_title: form.hero_title.trim() || category.heroPlaceholder,
    hero_subtitle: form.hero_subtitle.trim() || null,
    hero_image_url: form.hero_image_url.trim() || null,
    whatsapp_number: form.whatsapp_number.trim() || "6281234567890",
    capacity: accommodation ? numberOrNull(form.capacity) : null,
    bedrooms: accommodation ? numberOrNull(form.bedrooms) : null,
    bathrooms: accommodation ? numberOrNull(form.bathrooms) : null,
    features: textareaList(form.features),
    gallery,
    experiences: textareaList(form.experiences),
    booking_message_template: category.defaultBookingMessage(businessName),
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
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const previewResort = useMemo(() => createPreviewResort(form), [form]);
  const galleryImages = useMemo(() => textareaList(form.gallery_images), [form.gallery_images]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("source");
    if (source) {
      setListingUrl(source);
    }
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

      if (key === "type") {
        const nextType = String(value);

        return {
          ...current,
          type: nextType,
          template_id: defaultTemplateIdForBusinessType(nextType),
        };
      }

      return { ...current, [key]: value };
    });
  }

  function applyImportDraft(draft: ImportDraft) {
    setForm((current) => {
      const nextName = draft.name?.trim() || current.name;
      const nextSlug = draft.slug?.trim() || (nextName ? slugify(nextName) : current.slug);
      const nextType = draft.type?.trim() || current.type;

      return {
        ...current,
        name: nextName,
        slug: nextSlug,
        location: draft.location?.trim() || current.location,
        type: nextType,
        template_id: defaultTemplateIdForBusinessType({ type: nextType, templateId: draft.template_id?.trim() || current.template_id }),
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
      setImportStatus("Paste a public website, Instagram, OTA, marketplace, or social link first.");
      return;
    }

    setImporting(true);
    setImportStatus("Reading the source and preparing a WhatsApp-ready website draft...");

    try {
      const response = await fetch("/api/import-listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        setImportStatus(data?.error ?? "Could not import this source. You can continue manually.");
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
      setImportStatus("Could not import this source. You can continue manually.");
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
      setBuildStatus("Add a business name first. This becomes the site name and URL slug.");
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
    setBuildStatus("Creating your business website...");

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

      setBuildStatus("Site created. Opening your new business website...");
      router.push(`/${slug}`);
    } catch (error) {
      setBuildStatus(error instanceof Error ? error.message : "Could not create the site.");
    } finally {
      setBuilding(false);
    }
  }

  if (!builderStarted) {
    return (
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
    );
  }

  const stepCopies = [
    { title: t("create.step.business.title"), description: t("create.step.business.body") },
    { title: t("create.step.services.title"), description: t("create.step.services.body") },
    { title: t("create.step.template.title"), description: t("create.step.template.body") },
    { title: t("create.step.publish.title"), description: t("create.step.publish.body") },
  ];
  const builderLabels = {
    back: t("create.back"),
    next: t("create.next"),
    search: t("create.builder.search"),
    workspace: t("create.builder.workspace"),
    progress: t("create.builder.progress"),
    complete: t("create.builder.complete"),
    completed: t("create.builder.completed"),
    current: t("create.builder.current"),
    upcoming: t("create.builder.upcoming"),
    help: t("create.builder.help"),
    userGuide: t("create.builder.userGuide"),
    support: t("create.builder.support"),
    saveContinue: t("create.builder.saveContinue"),
    continueTemplate: t("create.builder.continueTemplate"),
    continuePreview: t("create.builder.continuePreview"),
    editBeforePublish: t("create.builder.editBeforePublish"),
    publishNow: t("create.builder.publishNow"),
    openFullPreview: t("create.builder.openFull"),
  };
  const accountPanel = (
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
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 selection:bg-emerald-500 selection:text-white">
      <div className="flex w-full items-center justify-center gap-3 bg-neutral-900 px-4 py-2.5 text-center text-xs text-white sm:text-sm">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t("create.announcement")}
        </span>
        <button
          type="button"
          onClick={() => setActiveStep(0)}
          className="hidden items-center gap-1 font-medium text-emerald-300 transition hover:text-emerald-200 sm:flex"
        >
          {t("create.announcement.cta")}
          <ArrowIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/75 backdrop-blur-xl">
        <AppHeader className="h-16 px-6" />
      </div>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
        <BuilderUtilityBar labels={builderLabels} session={session} />
        {importStatus ? (
          <p className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm">
            {importStatus}
          </p>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <StepProgress activeStep={activeStep} onSelect={setActiveStep} stepCopies={stepCopies} labels={builderLabels} />
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
            previewResort,
            openFullPreview,
            accountPanel,
            stepCopies,
            builderLabels,
            () => setActiveStep((current) => Math.max(current - 1, 0)),
            () => setActiveStep((current) => Math.min(current + 1, steps.length - 1)),
            () => setActiveStep(2),
          )}
        </div>
      </main>
    </div>
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 selection:bg-emerald-500 selection:text-white">
      <div className="flex w-full items-center justify-center gap-3 bg-neutral-900 px-4 py-2.5 text-center text-xs text-white sm:text-sm">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t("create.announcement")}
        </span>
        <a href="#create-import-url" className="hidden items-center gap-1 font-medium text-emerald-300 transition hover:text-emerald-200 sm:flex">
          {t("create.announcement.cta")}
          <ArrowIcon className="h-3 w-3" />
        </a>
      </div>

      <div className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/75 backdrop-blur-xl">
        <AppHeader className="h-16 px-6" />
      </div>

      <main className="flex-1 bg-[radial-gradient(circle_at_top_center,rgba(34,197,94,0.08)_0%,rgba(248,250,252,1)_58%)] px-6 pb-24 pt-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
              {t("create.start.titleLead")} <span className="bg-gradient-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{t("create.start.titleAccent")}</span> {t("create.start.titleTail")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              {t("create.start.body")}
            </p>
          </div>

          <div className="mb-16 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <section className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-emerald-100 bg-white p-8 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_20px_40px_-10px_rgba(0,0,0,0.08)] transition hover:border-emerald-300">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-emerald-500/5" />
              <div className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MagicIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">{t("create.ai.title")}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {t("create.ai.body")}
              </p>
              <div className="mt-8 space-y-4">
                <label className="sr-only" htmlFor="create-import-url">
                  {t("create.ai.url")}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="create-import-url"
                    type="url"
                    value={listingUrl}
                    onChange={(event) => onListingUrlChange(event.target.value)}
                    placeholder="https://your-existing-link.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm text-slate-950 shadow-inner shadow-black/[0.02] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void onImportListing()}
                  disabled={importing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <CircularProgressIcon className="h-4 w-4" />
                      <span>{t("create.ai.loading")}</span>
                    </>
                  ) : (
                    <>
                      {t("create.ai.button")}
                      <ArrowIcon className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
              {importStatus ? (
                <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">{importStatus}</p>
              ) : null}
            </section>

            <section className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_20px_40px_-10px_rgba(0,0,0,0.08)] transition hover:border-slate-300">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <PenIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-950">{t("create.manual.title")}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {t("create.manual.body")}
              </p>
              <button
                type="button"
                onClick={onManualStart}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-4 text-sm font-medium text-white shadow-md transition hover:bg-neutral-800"
              >
                {t("create.manual")}
                <ArrowIcon className="h-4 w-4" />
              </button>
            </section>
          </div>

          <section className="w-full max-w-4xl rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_20px_40px_-10px_rgba(0,0,0,0.08)]">
            <div className="mb-8 text-center">
              <h3 className="text-lg font-semibold text-slate-950">{t("create.process.title")}</h3>
              <p className="mt-2 text-sm text-slate-500">{t("create.process.body")}</p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <ProcessStep icon={<SearchIcon className="h-5 w-5" />} title={t("create.process.scan.title")} body={t("create.process.scan.body")} />
              <ProcessStep icon={<DocumentIcon className="h-5 w-5" />} title={t("create.process.extract.title")} body={t("create.process.extract.body")} />
              <ProcessStep icon={<LayersIcon className="h-5 w-5" />} title={t("create.process.draft.title")} body={t("create.process.draft.body")} />
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white pb-8 pt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="mb-6 inline-flex items-center">
                <TravelseedWordmark className="text-xl" />
              </Link>
              <p className="max-w-xs text-sm leading-6 text-slate-500">{t("create.footer.description")}</p>
            </div>
            <FooterColumn title="Product" links={["Features", "Templates", "Pricing", "Showcase"]} />
            <FooterColumn title="Resources" links={["Help Center", "Blog", "Community", "Partners"]} />
            <FooterColumn title="Company" links={["About Us", "Careers", "Privacy Policy", "Terms of Service"]} />
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 md:flex-row">
            <p>© 2026 Travelseed. All rights reserved.</p>
            <p>Made in Bali, Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProcessStep({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        {icon}
      </div>
      <h4 className="mb-1 text-sm font-semibold text-slate-950">{title}</h4>
      <p className="text-xs leading-5 text-slate-500">{body}</p>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="mb-4 font-semibold text-slate-950">{title}</h4>
      <ul className="space-y-3 text-sm text-slate-600">
        {links.map((link) => (
          <li key={link}>
            <Link href={link === "Pricing" ? "/pricing" : "#"} className="transition hover:text-emerald-600">
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M4.2 10h11.1M11 5.8l4.2 4.2-4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M8.3 11.7a3.3 3.3 0 0 0 4.7 0l2.1-2.1a3.3 3.3 0 0 0-4.7-4.7l-.7.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.7 8.3a3.3 3.3 0 0 0-4.7 0l-2.1 2.1a3.3 3.3 0 0 0 4.7 4.7l.7-.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MagicIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="m14.3 4.7 5 5M4.5 19.5l9.8-9.8M16.8 2.2l5 5-12 12a2.8 2.8 0 0 1-4 0l-1-1a2.8 2.8 0 0 1 0-4l12-12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 4.5h2.5M6.25 3.25v2.5M18 16.5h2.5M19.25 15.25v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PenIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 20h8M4 20l4.2-1.1L19.6 7.5a2.2 2.2 0 0 0 0-3.1 2.2 2.2 0 0 0-3.1 0L5.1 15.8 4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14.8 6.1 3.1 3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="m20 20-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3.5V8h4M9 12h6M9 15.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LayersIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7.5-2.5 7.5h17S18 16 18 9ZM9.8 20a2.4 2.4 0 0 0 4.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v10A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m4 16 4.2-4.2a1.4 1.4 0 0 1 2 0l1.1 1.1 2.4-2.4a1.4 1.4 0 0 1 2 0L20 14.8M8.5 9h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M15.8 10H4.7M9 5.8 4.8 10 9 14.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="m4.5 10.4 3.4 3.3 7.6-7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GripIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M7 4.5h.01M13 4.5h.01M7 10h.01M13 10h.01M7 15.5h.01M13 15.5h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.8-2.3 2-2.3 3.6M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RocketIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M14 4.5c2.2-.7 4-.5 5.5 0 .5 1.5.7 3.3 0 5.5-.8 2.6-2.9 5.3-6.3 8.1l-3.3-3.3C8 12.9 6.8 11.7 5.9 10.8 8.7 7.4 11.4 5.3 14 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 14.5 4.5 19.5 9.5 18M15.8 8.2h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SitemapIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 5v5M7 19v-4h10v4M12 10H6a2 2 0 0 0-2 2v3M12 10h6a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 3.5h5v3h-5v-3ZM2.5 17.5h5v3h-5v-3ZM16.5 17.5h5v3h-5v-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 12h17M12 3c2.3 2.4 3.4 5.4 3.4 9S14.3 18.6 12 21M12 3c-2.3 2.4-3.4 5.4-3.4 9s1.1 6.6 3.4 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{t("create.account.ready")}</p>
          <p className="mt-1 text-sm text-slate-600">{session.user.email}</p>
        </div>
        <button type="button" onClick={() => void onSignOut()} className="text-sm font-semibold text-emerald-700">
          {t("create.account.signOut")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-950">
          {authMode === "sign-up" ? t("create.account.signUpTitle") : t("create.account.signInTitle")}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
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
        <button type="submit" className="min-h-12 rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800">
          {authMode === "sign-up" ? t("create.account.signUp") : t("create.account.signIn")}
        </button>
        <button
          type="button"
          onClick={() => {
            onAuthModeChange(authMode === "sign-up" ? "sign-in" : "sign-up");
          }}
          className="text-sm font-semibold text-emerald-700"
        >
          {authMode === "sign-up" ? t("create.account.hasAccount") : t("create.account.create")}
        </button>
      </div>
      {authStatus ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{authStatus}</p> : null}
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
  previewResort: Resort,
  openFullPreview: () => void,
  accountPanel: ReactNode,
  stepCopies: StepCopy[],
  labels: BuilderLabels,
  onBack: () => void,
  onNext: () => void,
  onEditBeforePublish: () => void,
) {
  const category = businessCategoryFromType(form.type);

  if (activeStep === 0) {
    return (
      <section className="flex-1">
        <div className="relative rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{stepCopies[0].title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{stepCopies[0].description}</p>
            </div>
            <button
              type="button"
              onClick={onBack}
              disabled
              aria-label="Close"
              className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full bg-slate-100 text-slate-400"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <HeroUploadCard imageUrl={form.hero_image_url} onChange={handleHeroFile} uploadStatus={uploadStatus} />

          <div className="mt-10 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 sm:p-6">
            <BusinessTypeSelector value={form.type} onChange={(value) => updateField("type", value)} />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <TextField label="Business Name" value={form.name} onChange={(value) => updateField("name", value)} placeholder="e.g. Sunset Villa Bali" />
              <TextField label="Location / City" value={form.location} onChange={(value) => updateField("location", value)} placeholder="e.g. Ubud, Bali" />
              <TextField
                label="WhatsApp Number"
                value={form.whatsapp_number}
                onChange={(value) => updateField("whatsapp_number", value)}
                placeholder="+62 812 3456 7890"
                prefix={<span className="text-xs font-bold text-emerald-600">WA</span>}
              />
              <TextField label="Site URL Slug" value={form.slug} onChange={(value) => updateField("slug", value)} placeholder="sunset-villa-bali" />
              <div className="md:col-span-2">
                <TextareaField
                  label="Short Description"
                  value={form.description}
                  onChange={(value) => updateField("description", value)}
                  placeholder="Describe your business in a few sentences..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <StepFooter
            labels={labels}
            primaryLabel={labels.saveContinue}
            onBack={onBack}
            onPrimary={onNext}
            backDisabled
          />
        </div>
      </section>
    );
  }

  if (activeStep === 1) {
    const accommodation = category.id === "accommodation";
    const presets = category.quickPresets;
    const addPreset = (preset: string) => {
      const current = textareaList(form.experiences);
      updateField("experiences", [...current, preset].join("\n"));
    };

    return (
      <section className="grid flex-1 grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="flex min-h-[680px] flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-950">{stepCopies[1].title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{stepCopies[1].description}</p>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-slate-950">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, index) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addPreset(preset)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    index === 0
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            <ServiceDraftReview
              services={serviceDrafts}
              selectedIds={selectedServiceDrafts}
              onSelectionChange={setSelectedServiceDrafts}
              categoryId={category.id}
            />
            <TextareaField
              label="Business highlights, one per line"
              value={form.features}
              onChange={(value) => updateField("features", value)}
              placeholder={category.featurePlaceholder}
            />
            <TextareaField
              label={category.servicesLabel}
              value={form.experiences}
              onChange={(value) => updateField("experiences", value)}
              placeholder={category.servicesPlaceholder}
            />
            {accommodation ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-4 text-sm font-semibold text-slate-950">Accommodation capacity</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField label="Guests" value={form.capacity} onChange={(value) => updateField("capacity", value)} type="number" />
                  <TextField label="Bedrooms" value={form.bedrooms} onChange={(value) => updateField("bedrooms", value)} type="number" />
                  <TextField label="Bathrooms" value={form.bathrooms} onChange={(value) => updateField("bathrooms", value)} type="number" />
                </div>
              </div>
            ) : null}
          </div>

          <StepFooter labels={labels} primaryLabel={labels.continueTemplate} onBack={onBack} onPrimary={onNext} />
        </div>

        <MobileOfferPreview form={form} services={serviceDrafts} selectedIds={selectedServiceDrafts} />
      </section>
    );
  }

  if (activeStep === 2) {
    const categoryTemplates = templateCatalogForCategory(category.id).filter((template) => template.planType === "seed");

    return (
      <section className="grid flex-1 grid-cols-1 gap-8 xl:grid-cols-12 xl:items-start">
        <div className="flex min-h-[760px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm xl:col-span-5">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-2xl font-bold text-slate-950">{stepCopies[2].title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{stepCopies[2].description}</p>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto p-6">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-950">Site Structure</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{category.shortLabel}</span>
              </div>
              <div className="grid gap-4">
                {categoryTemplates.map((template) => {
                  const selected = form.template_id === template.templateId;
                  return (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => updateField("template_id", template.templateId)}
                      className="group text-left"
                    >
                      <div
                        className={`relative overflow-hidden rounded-2xl border-2 bg-white p-4 shadow-sm transition ${
                          selected ? "border-emerald-500" : "border-transparent group-hover:border-emerald-300"
                        }`}
                      >
                        <div className="rounded-xl bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 ring-1 ring-slate-100">
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">{category.icon}</span>
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-100">{template.tags[0]}</span>
                          </div>
                          <div className="mt-5 space-y-2">
                            <div className="h-3 w-3/4 rounded bg-slate-900/80" />
                            <div className="h-2 w-full rounded bg-slate-200" />
                            <div className="h-2 w-2/3 rounded bg-slate-200" />
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              {category.pageLabels.slice(1, 4).map((label) => (
                                <span key={label} className="rounded-lg bg-white px-2 py-3 text-center text-[10px] font-semibold text-slate-500 ring-1 ring-slate-100">{label}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {selected ? (
                          <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">Selected</span>
                        ) : null}
                        <h4 className={`mt-4 text-sm font-semibold ${selected ? "text-slate-950" : "text-slate-700"}`}>{template.name}</h4>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{template.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <TextField label="Hero headline" value={form.hero_title} onChange={(value) => updateField("hero_title", value)} placeholder={category.heroPlaceholder} />
              <TextareaField
                label="Hero subtitle"
                value={form.hero_subtitle}
                onChange={(value) => updateField("hero_subtitle", value)}
                placeholder="A short line that tells customers what makes your business special."
                rows={3}
              />
              <TextField label="Hero image URL" value={form.hero_image_url} onChange={(value) => updateField("hero_image_url", value)} placeholder="https://..." />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-950">Upload photos for preview</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FileButton label="Upload hero photo" onChange={handleHeroFile} />
                <FileButton label="Upload gallery photos" onChange={handleGalleryFiles} multiple />
              </div>
              {uploadStatus ? <p className="mt-3 text-sm leading-6 text-slate-600">{uploadStatus}</p> : null}
            </div>

            <StylePreviewControls />
            <GalleryPreview gallery={galleryImages} onRemove={removeGalleryImage} />
          </div>

          <div className="border-t border-slate-100 bg-white p-6">
            <StepFooter labels={labels} primaryLabel={labels.continuePreview} onBack={onBack} onPrimary={onNext} compact />
          </div>
        </div>

        <DesktopPreviewFrame previewResort={previewResort} templateId={form.template_id} onOpenFullPreview={openFullPreview} label={labels.openFullPreview} />
      </section>
    );
  }

  if (activeStep === 3) {
    return (
      <PublishReviewPanel
        form={form}
        previewResort={previewResort}
        services={serviceDrafts}
        selectedIds={selectedServiceDrafts}
        accountPanel={accountPanel}
        building={building}
        buildStatus={buildStatus}
        onPublish={handleBuildSite}
        onEdit={onEditBeforePublish}
        onOpenFullPreview={openFullPreview}
        labels={labels}
        stepCopy={stepCopies[3]}
      />
    );
  }

  return null;
}

function BuilderUtilityBar({ labels, session }: { labels: BuilderLabels; session: Session | null }) {
  return (
    <div className="mb-6 flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <SearchIcon className="h-4 w-4" />
        </div>
        <input
          type="text"
          readOnly
          placeholder={labels.search}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-500 outline-none"
        />
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          <BellIcon className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-slate-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-emerald-600 text-sm font-bold text-white">
            T
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-950">{session?.user.email?.split("@")[0] || labels.workspace}</p>
            <p className="text-xs text-slate-500">{session?.user.email || "draft@travelseed.app"}</p>
          </div>
          <ChevronDownIcon className="h-3 w-3 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

function HeroUploadCard({
  imageUrl,
  onChange,
  uploadStatus,
}: {
  imageUrl: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadStatus: string;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-950">Hero Image</p>
      <label
        className="group relative flex h-32 w-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-emerald-500 hover:bg-slate-100"
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
      >
        {imageUrl ? <span className="absolute inset-0 bg-neutral-900/20" /> : null}
        <span className="relative flex flex-col items-center">
          <ImageIcon className={`mb-2 h-6 w-6 ${imageUrl ? "text-white" : "text-slate-400 group-hover:text-emerald-500"}`} />
          <span className={`text-xs font-medium ${imageUrl ? "text-white" : "text-slate-500 group-hover:text-emerald-600"}`}>Upload</span>
        </span>
        <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
          <PenIcon className="h-3.5 w-3.5" />
        </span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void onChange(event)} className="sr-only" />
      </label>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        {uploadStatus || "High quality image of your venue, storefront, product, or team. Recommended size: 1200x800px."}
      </p>
    </div>
  );
}

function StepFooter({
  labels,
  primaryLabel,
  onBack,
  onPrimary,
  backDisabled = false,
  compact = false,
}: {
  labels: BuilderLabels;
  primaryLabel: string;
  onBack: () => void;
  onPrimary: () => void;
  backDisabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "" : "mt-8"} flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between`}>
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        {labels.back}
      </button>
      <button
        type="button"
        onClick={onPrimary}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-medium text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function MobileOfferPreview({
  form,
  services,
  selectedIds,
}: {
  form: BuilderForm;
  services: ServiceDraft[];
  selectedIds: Set<string>;
}) {
  const category = businessCategoryFromType(form.type);
  const serviceItems = services.filter((service) => selectedIds.has(service.draftId));
  const fallbackItems = textareaList(form.experiences).map((title, index) => ({
    draftId: `fallback-${index}`,
    title,
    description: form.description || "Customer-ready offer with a direct WhatsApp inquiry path.",
    price_label: index === 0 ? category.pricingFallback : null,
    cta_label: category.primaryCta,
  }));
  const items = (serviceItems.length ? serviceItems : fallbackItems).slice(0, 3);
  const previewItems = items.length
    ? items
    : [
        {
          draftId: "empty-offer",
          title: form.name || "Signature Offer",
          description: category.emptyOfferDescription,
          price_label: category.pricingFallback,
          cta_label: category.primaryCta,
        },
      ];

  return (
    <div className="relative flex min-h-[680px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 p-6">
      <div className="relative z-10 flex h-[600px] w-full max-w-sm flex-col overflow-hidden rounded-[32px] border-[8px] border-slate-800 bg-white shadow-2xl">
        <div className="flex h-6 w-full items-end justify-center bg-slate-800 pb-1">
          <div className="h-4 w-16 rounded-b-xl bg-black" />
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          <h3 className="mb-4 text-center text-lg font-bold text-slate-950">{category.offerSectionTitle}</h3>
          <div className="space-y-4">
            {previewItems.map((item, index) => (
              <div key={item.draftId} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div
                  className="relative h-32 bg-gradient-to-br from-emerald-100 via-white to-slate-200"
                  style={form.hero_image_url ? { backgroundImage: `url("${form.hero_image_url}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
                >
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Featured</span>
                  ) : null}
                </div>
                <div className="p-4">
                  <h4 className="mb-1 text-sm font-bold text-slate-950">{item.title}</h4>
                  <p className="mb-3 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-950">{item.price_label || category.pricingFallback}</span>
                    <button type="button" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
                      {item.cta_label || category.primaryCta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-400">Live Mobile Preview</p>
    </div>
  );
}

function StylePreviewControls() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-950">Typography Pairing</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-emerald-500 bg-emerald-50 p-3">
            <div>
              <span className="block text-sm font-semibold text-slate-950">Inter Display</span>
              <span className="mt-0.5 block text-xs text-slate-500">Clean & modern</span>
            </div>
            <span className="h-5 w-5 rounded-full border-4 border-emerald-500 bg-white" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div>
              <span className="block text-sm font-semibold text-slate-950">Editorial Contrast</span>
              <span className="mt-0.5 block text-xs text-slate-500">Boutique & premium</span>
            </div>
            <span className="h-5 w-5 rounded-full border border-slate-300" />
          </div>
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-950">Color Accent</h3>
        <div className="grid grid-cols-4 gap-3">
          {["bg-emerald-500", "bg-slate-900", "bg-amber-600", "bg-sky-500"].map((color, index) => (
            <button
              key={color}
              type="button"
              className={`aspect-square rounded-xl ${color} shadow-sm ${index === 0 ? "ring-2 ring-slate-900 ring-offset-2" : "ring-1 ring-slate-200"}`}
              aria-label={`Color option ${index + 1}`}
            >
              {index === 0 ? <CheckIcon className="mx-auto h-4 w-4 text-white" /> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopPreviewFrame({
  previewResort,
  templateId,
  onOpenFullPreview,
  label,
}: {
  previewResort: Resort;
  templateId: string;
  onOpenFullPreview: () => void;
  label: string;
}) {
  return (
    <div className="flex min-h-[760px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 p-6 xl:col-span-7">
      <div className="relative z-20 mb-6 flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button type="button" className="rounded-md border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-950 shadow-sm">
            Desktop
          </button>
          <button type="button" className="px-4 py-1.5 text-xs font-medium text-slate-500">
            Mobile
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenFullPreview}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          {label}
        </button>
      </div>
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden rounded-t-xl border border-b-0 border-slate-200 bg-white shadow-lg">
        <div className="flex h-10 items-center gap-4 border-b border-slate-200 bg-slate-100 px-4">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-auto flex h-6 max-w-md flex-1 items-center justify-center rounded-md border border-slate-200 bg-white font-mono text-[10px] text-slate-400">
            {previewResort.slug}.travelseed.app
          </div>
        </div>
        <div className="site-preview min-h-0 flex-1 overflow-y-auto bg-white">
          {renderResortTemplate(previewResort, templateId)}
        </div>
      </div>
    </div>
  );
}

function PublishReviewPanel({
  form,
  previewResort,
  services,
  selectedIds,
  accountPanel,
  building,
  buildStatus,
  onPublish,
  onEdit,
  onOpenFullPreview,
  labels,
  stepCopy,
}: {
  form: BuilderForm;
  previewResort: Resort;
  services: ServiceDraft[];
  selectedIds: Set<string>;
  accountPanel: ReactNode;
  building: boolean;
  buildStatus: string;
  onPublish: () => Promise<void>;
  onEdit: () => void;
  onOpenFullPreview: () => void;
  labels: BuilderLabels;
  stepCopy: StepCopy;
}) {
  const category = businessCategoryFromType(form.type);
  const selectedServices = services.filter((service) => selectedIds.has(service.draftId));
  const offerNames = selectedServices.length
    ? selectedServices.map((service) => service.title)
    : textareaList(form.experiences);
  const pages = category.pageLabels;
  const sections = category.sectionLabels;

  return (
    <section className="flex-1 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-slate-950">{stepCopy.title}</h2>
          <p className="text-sm leading-6 text-slate-500">{stepCopy.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {labels.editBeforePublish}
          </button>
          <button
            type="button"
            onClick={() => void onPublish()}
            disabled={building}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {building ? "Creating Site..." : labels.publishNow}
            <RocketIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-240px)] overflow-y-auto bg-slate-50 p-6 sm:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {accountPanel}
          {buildStatus ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm">{buildStatus}</p>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-950">
              <SitemapIcon className="h-5 w-5 text-emerald-500" />
              Site Architecture Map
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <ReviewListCard title="Homepage Sections" count={sections.length} items={sections} />
              <ReviewListCard title="Generated Pages" count={pages.length} items={pages} />
              <ReviewListCard title={category.offerSectionTitle} count={offerNames.length || 1} items={offerNames.length ? offerNames : ["Signature offer"]} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-950">
              <span className="text-emerald-500">WA</span>
              WhatsApp Integration Preview
            </h3>
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="flex-1 space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  Floating action buttons will appear on your site so customers can message your business number instantly.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-xs text-slate-500">Connected Number</div>
                  <div className="flex items-center gap-2 font-medium text-slate-950">
                    {previewResort.whatsapp_number}
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="relative flex h-40 flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-6">
                <button type="button" className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-sm font-bold text-white shadow-lg">
                  WA
                </button>
                <button type="button" className="absolute bottom-4 left-4 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-lg">
                  Contact via WhatsApp
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-950">
              <GlobeIcon className="h-5 w-5 text-emerald-500" />
              SEO & Domain Readiness
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-slate-950">SEO Basics Configured</h4>
                  <p className="mb-3 text-sm leading-6 text-slate-600">Meta title, description, and social preview copy are generated from your business details.</p>
                  <div className="rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                    <div className="mb-1 font-medium text-blue-600">{previewResort.name} | WhatsApp-ready business website</div>
                    <div className="mb-1 text-xs text-green-700">https://{previewResort.slug}.travelseed.app</div>
                    <div className="line-clamp-2 text-xs leading-5 text-slate-600">{previewResort.description || previewResort.hero_title}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-slate-950">Domain Settings</h4>
                  <p className="text-sm leading-6 text-slate-600">Your site will be published to a free Travelseed subdomain.</p>
                  <div className="mt-2 inline-block rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800">
                    {previewResort.slug}.travelseed.app
                  </div>
                </div>
                <button type="button" onClick={onOpenFullPreview} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                  {labels.openFullPreview}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewListCard({ title, count, items }: { title: string; count: number; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h4 className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-950">
        {title}
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{count}</span>
      </h4>
      <ul className="space-y-3 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <GripIcon className="h-3.5 w-3.5 text-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceDraftReview({
  services,
  selectedIds,
  onSelectionChange,
  categoryId,
}: {
  services: ServiceDraft[];
  selectedIds: Set<string>;
  onSelectionChange: (value: Set<string>) => void;
  categoryId: keyof typeof businessCategories;
}) {
  const category = businessCategories[categoryId];

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-slate-950">No AI offer cards yet</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {category.serviceDraftEmpty}
        </p>
      </div>
    );
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
    <section>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{category.serviceDraftTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">Selected items will be saved as editable offer inventory when the site is created.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{selectedIds.size} selected</span>
      </div>
      <div className="space-y-4">
        {services.map((service) => (
          <label
            key={service.draftId}
            className="group flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300"
          >
            <span className="mt-1 text-slate-400 group-hover:text-slate-600">
              <GripIcon className="h-4 w-4" />
            </span>
            <span
              className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-emerald-100 via-white to-slate-200"
              style={service.image_url ? { backgroundImage: `url("${service.image_url}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
            />
            <input
              type="checkbox"
              checked={selectedIds.has(service.draftId)}
              onChange={() => toggleService(service.draftId)}
              className="sr-only"
            />
            <span className="min-w-0 flex-1">
              <span className="mb-1 flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-slate-950">{service.title}</span>
                <span className="flex items-center gap-2">
                  {selectedIds.has(service.draftId) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Selected</span>
                  ) : null}
                  <span className="text-slate-400">
                    <PenIcon className="h-3.5 w-3.5" />
                  </span>
                </span>
              </span>
              {service.description ? <span className="mb-2 line-clamp-1 block text-xs leading-5 text-slate-500">{service.description}</span> : null}
              <span className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-950">{service.price_label || "Ask on WhatsApp"}</span>
                <span className="rounded bg-slate-200 px-2 py-1 text-[10px] text-slate-500">CTA: {service.cta_label || "Inquire"}</span>
              </span>
              {service.included?.length ? <span className="mt-2 block truncate text-xs text-slate-500">{service.included.join(" · ")}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </section>
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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No gallery images yet. Upload photos to see them in the live preview.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {gallery.map((imageUrl) => (
        <div key={imageUrl} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="relative aspect-[4/3]">
            <Image src={imageUrl} alt="Uploaded gallery preview" fill sizes="(min-width: 768px) 24vw, 100vw" className="object-cover" />
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <p className="truncate text-xs text-slate-500">Gallery image</p>
            <button type="button" onClick={() => onRemove(imageUrl)} className="text-xs font-semibold text-red-700">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StepProgress({
  activeStep,
  onSelect,
  stepCopies,
  labels,
}: {
  activeStep: number;
  onSelect: (step: number) => void;
  stepCopies: StepCopy[];
  labels: BuilderLabels;
}) {
  const progress = Math.round(((activeStep + 1) / steps.length) * 100);

  return (
    <aside className="hidden flex-col gap-6 lg:flex">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-950">{labels.progress}</h3>
        <div className="mb-2 h-1.5 w-full rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mb-6 text-xs text-slate-500">
          {progress}% {labels.complete}
        </p>

        <div className="relative pl-2">
          {stepCopies.map((step, index) => {
            const completed = index < activeStep;
            const current = index === activeStep;

            return (
              <button
                key={step.title}
                type="button"
                onClick={() => onSelect(index)}
                className="relative mb-8 flex w-full gap-4 text-left last:mb-0"
              >
                {index < stepCopies.length - 1 ? <span className="absolute bottom-[-32px] left-[15px] top-8 w-0.5 bg-slate-100" /> : null}
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                    completed
                      ? "bg-emerald-500 text-white"
                      : current
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white text-slate-400 ring-1 ring-slate-300"
                  }`}
                >
                  {completed ? <CheckIcon className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                </span>
                <span>
                  <span className={`block text-sm ${current || completed ? "font-semibold text-slate-950" : "font-medium text-slate-600"}`}>
                    {step.title}
                  </span>
                  <span className={`mt-0.5 block text-xs ${current ? "text-emerald-600" : "text-slate-500"}`}>
                    {completed ? labels.completed : current ? labels.current : labels.upcoming}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{labels.help}</p>
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            <DocumentIcon className="h-4 w-4" />
            {labels.userGuide}
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            <HelpIcon className="h-4 w-4" />
            {labels.support}
          </a>
        </nav>
      </div>
    </aside>
  );
}

function BusinessTypeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-950">Business Type</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Object.values(businessCategories).map((category) => {
          const option = category.label;
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`relative min-h-[96px] overflow-hidden rounded-xl p-4 text-left shadow-sm transition ${
                selected
                  ? "border-2 border-emerald-500 bg-white text-slate-950"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {selected ? (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
              ) : null}
              <span className={`mb-2 flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${selected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {category.icon}
              </span>
              <span className={`block text-xs leading-tight ${selected ? "font-semibold text-slate-950" : "font-medium text-slate-600"}`}>{option}</span>
              <span className="mt-1 block text-[10px] leading-4 text-slate-400">{category.shortLabel}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 max-w-sm">
        <TextField label="Custom business type" value={businessTypeOptions.includes(value) ? "" : value} onChange={onChange} placeholder="e.g. Dental Clinic" />
      </div>
    </div>
  );
}

/*
 * Keep the input primitives intentionally small. The builder shell gives them
 * the visual system; these only encode consistent focus and spacing behavior.
 */
function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-950">
      {label}
      <span className="relative">
        {prefix ? <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">{prefix}</span> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-950 shadow-inner shadow-black/[0.02] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
            prefix ? "pl-12" : ""
          }`}
        />
      </span>
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-950">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-950 shadow-inner shadow-black/[0.02] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
    <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50">
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
