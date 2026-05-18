import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/ui";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DashboardConfirmOptions, DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";

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
        : "This will pause the public site and hide it from guests.",
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Business settings</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Central settings for the operator account and direct booking site.</p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.58fr]">
        <Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <EditableField label="Business Name" value={name} onChange={setName} />
            <EditableField label="Location" value={location} onChange={setLocation} />
            <EditableField label="Contact Email" value={contactEmail} onChange={setContactEmail} />
            <EditableField label="Language" value={language} onChange={setLanguage} />
            <EditableField label="Timezone" value={timezone} onChange={setTimezone} />
            <EditableField label="Business Type" value={type} onChange={setType} />
          </div>
          <div className="mt-6">
            <button type="button" onClick={() => void saveSettings()} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
              Save settings
            </button>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Preview & publish</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Review the public URL and control whether the site is visible to guests.</p>
          <div className="mt-5 rounded-2xl bg-[#fbfaf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">Public URL</p>
            <p className="mt-2 break-all text-sm font-semibold text-[#18352f]">/{site.slug}</p>
            <p className="mt-2 text-sm text-[#6f7b74]">{site.isActive ? "Published" : "Paused"}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
              Open preview
            </a>
            <button type="button" onClick={togglePublish} className={`min-h-11 rounded-full px-5 text-sm font-semibold ${site.isActive ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-[#18352f] text-white"}`}>
              {site.isActive ? "Pause site" : "Publish site"}
            </button>
          </div>
        </Panel>

        <Panel className="xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#18352f]">Account security</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Change the password for the signed-in operator account.</p>
            </div>
            <span className="rounded-full bg-[#f8f5ef] px-3 py-1 text-xs font-semibold text-[#52615a]">Email login</span>
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
              className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChangingPassword ? "Changing password..." : "Change password"}
            </button>
            {passwordStatus ? <p className="text-sm text-[#6f7b74]">{passwordStatus}</p> : null}
          </div>
        </Panel>

        <Panel className="xl:col-span-2">
          <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Placeholder for account export and delete workflows. These actions should require confirmation after DB integration.</p>
          <button type="button" className="mt-6 min-h-11 rounded-full bg-red-50 px-5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
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
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]"
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
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
    </label>
  );
}
