import { useEffect, useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
import { businessTypeOptions } from "@/lib/business-categories";
import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DashboardConfirmOptions, DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";

const languageOptions = ["English", "Bahasa Indonesia"];

export function SettingsView({
  site,
  onSiteUpdate,
  onUnsavedChangesChange,
  requestConfirmation,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
  requestConfirmation?: (options: DashboardConfirmOptions, onConfirm: () => void) => void;
}) {
  const [name, setName] = useState(site.name);
  const [location, setLocation] = useState(site.location);
  const [contactEmail, setContactEmail] = useState(site.contactEmail);
  const [language, setLanguage] = useState(site.language);
  const [timezone, setTimezone] = useState(site.timezone);
  const [type, setType] = useState(site.type);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const selectedTypeCopy = dashboardCategoryCopyFor({ type, template: site.template });

  useEffect(() => {
    setName(site.name);
    setLocation(site.location);
    setContactEmail(site.contactEmail);
    setLanguage(site.language);
    setTimezone(site.timezone);
    setType(site.type);
  }, [site.contactEmail, site.id, site.language, site.location, site.name, site.timezone, site.type]);

  const isDirty = name !== site.name ||
    location !== site.location ||
    contactEmail !== site.contactEmail ||
    language !== site.language ||
    timezone !== site.timezone ||
    type !== site.type;

  useEffect(() => {
    onUnsavedChangesChange?.({
      isDirty,
      title: "Discard settings changes?",
      description: "You have business settings that have not been saved. Continue without saving them?",
    });

    return () => onUnsavedChangesChange?.({ isDirty: false, title: "", description: "" });
  }, [isDirty, onUnsavedChangesChange]);

  async function saveSettings() {
    await onSiteUpdate({ ...site, name, location, contactEmail, language, timezone, type });
  }

  async function changePassword() {
    setPasswordStatus("");

    if (!isSupabaseConfigured) {
      setPasswordStatus("Supabase is not configured.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus("Enter your current password and new password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus("New password confirmation does not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordStatus("New password must be different from your current password.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus("Checking current password...");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData.user?.email;

      if (userError || !email) {
        throw new Error(userError?.message ?? "Could not confirm the signed-in account.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect.");
      }

      setPasswordStatus("Updating password...");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus("Password changed.");
    } catch (error) {
      setPasswordStatus(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  function togglePublish() {
    const nextIsActive = !site.isActive;
    const run = () => {
      void onSiteUpdate({
        ...site,
        isActive: nextIsActive,
        status: nextIsActive ? "Published" : "Paused",
      });
    };

    requestConfirmation?.({
      title: nextIsActive ? "Publish site?" : "Pause site?",
      description: nextIsActive
        ? "This will make the public site available when the URL is visited."
        : "This will pause the public site and hide it from customers.",
      confirmLabel: nextIsActive ? "Publish site" : "Pause site",
      cancelLabel: "Cancel",
      tone: nextIsActive ? "default" : "danger",
    }, run);

    if (!requestConfirmation) {
      run();
    }
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Business settings</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Central settings for the operator account and WhatsApp-ready business site.</p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.58fr]">
        <Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <EditableField label="Business Name" value={name} onChange={setName} />
            <EditableField label="Location" value={location} onChange={setLocation} />
            <EditableField label="Contact Email" value={contactEmail} onChange={setContactEmail} />
            <SelectField label="Language" value={language} onChange={setLanguage} options={languageOptions} />
            <EditableField label="Timezone" value={timezone} onChange={setTimezone} />
            <SelectField label="Business Type" value={type} onChange={setType} options={businessTypeOptions} helper={selectedTypeCopy.settings.typeHelper} />
          </div>
          <div className="mt-6">
            <button type="button" onClick={() => void saveSettings()} className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm">
              Save settings
            </button>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-slate-950">Preview & publish</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Review the public URL and control whether the site is visible to customers.</p>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Public URL</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-950">/{site.slug}</p>
            <p className="mt-2 text-sm text-slate-500">{site.isActive ? "Published" : "Paused"}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
              Open preview
            </a>
            <button type="button" onClick={togglePublish} className={`min-h-11 rounded-md px-5 text-sm font-semibold ${site.isActive ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-slate-950 text-white"}`}>
              {site.isActive ? "Pause site" : "Publish site"}
            </button>
          </div>
        </Panel>

        <Panel className="xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Account security</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Change the password for the signed-in operator account.</p>
            </div>
            <Badge tone="gray">Email login</Badge>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <PasswordField label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={isChangingPassword}
              onClick={() => void changePassword()}
              className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? "Changing password..." : "Change password"}
            </button>
            {passwordStatus ? <p className="text-sm text-slate-600">{passwordStatus}</p> : null}
          </div>
        </Panel>

        <Panel className="xl:col-span-2">
          <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Placeholder for account export and delete workflows. These actions should require confirmation after DB integration.</p>
          <button type="button" className="mt-6 min-h-11 rounded-md bg-red-50 px-5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
            Delete workflow coming soon
          </button>
        </Panel>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  helper?: string;
}) {
  const normalizedOptions = options.includes(value) ? options : [value, ...options].filter((option, index, list) => list.indexOf(option) === index);

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
        {normalizedOptions.map((option) => (
          <option key={option} value={option}>
            {option || "Not specified"}
          </option>
        ))}
      </select>
      {helper ? <span className="text-xs font-normal leading-5 text-slate-500">{helper}</span> : null}
    </label>
  );
}
