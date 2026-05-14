import { FormEvent, useEffect, useMemo, useState } from "react";
import type { FeaturePreset, FeaturePresetInput } from "@/types/feature-preset";

type FeaturePresetFormState = {
  label: string;
  category: string;
  icon: string;
  propertyTypes: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyPresetForm: FeaturePresetFormState = {
  label: "",
  category: "General",
  icon: "sparkle",
  propertyTypes: "",
  sortOrder: "0",
  isActive: true,
};

const fieldClassName =
  "min-h-11 rounded-md border border-forest/15 bg-white px-3 text-sm outline-none focus:border-forest";

function formFromPreset(preset: FeaturePreset): FeaturePresetFormState {
  return {
    label: preset.label,
    category: preset.category,
    icon: preset.icon,
    propertyTypes: preset.property_types.join(", "),
    sortOrder: preset.sort_order.toString(),
    isActive: preset.is_active,
  };
}

function presetPayloadFromForm(form: FeaturePresetFormState): FeaturePresetInput {
  return {
    label: form.label.trim(),
    category: form.category.trim() || "General",
    icon: form.icon.trim() || "sparkle",
    property_types: form.propertyTypes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    sort_order: Number(form.sortOrder || 0),
    is_active: form.isActive,
  };
}

export function FeaturePresetManager({
  adminFetch,
}: {
  adminFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}) {
  const [presets, setPresets] = useState<FeaturePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [form, setForm] = useState<FeaturePresetFormState>(emptyPresetForm);
  const [status, setStatus] = useState("Loading feature presets...");

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) ?? null,
    [presets, selectedPresetId],
  );

  async function loadPresets() {
    try {
      const data = await adminFetch("/api/admin/feature-presets");
      const loadedPresets = (data as { presets?: FeaturePreset[] }).presets ?? [];
      setPresets(loadedPresets);

      const nextSelectedPreset = selectedPresetId
        ? loadedPresets.find((preset) => preset.id === selectedPresetId)
        : loadedPresets[0];

      if (nextSelectedPreset) {
        setSelectedPresetId(nextSelectedPreset.id);
        setForm(formFromPreset(nextSelectedPreset));
      }

      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load feature presets.");
    }
  }

  useEffect(() => {
    void loadPresets();
    // selectedPresetId is intentionally excluded so loading does not re-run after each selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPreset(preset: FeaturePreset) {
    setSelectedPresetId(preset.id);
    setForm(formFromPreset(preset));
    setStatus("");
  }

  function startNewPreset() {
    setSelectedPresetId(null);
    setForm(emptyPresetForm);
    setStatus("");
  }

  function updateField<Key extends keyof FeaturePresetFormState>(key: Key, value: FeaturePresetFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = presetPayloadFromForm(form);

    setStatus(selectedPreset ? "Updating feature preset..." : "Creating feature preset...");

    try {
      await adminFetch(selectedPreset ? `/api/admin/feature-presets/${selectedPreset.id}` : "/api/admin/feature-presets", {
        method: selectedPreset ? "PUT" : "POST",
        body: JSON.stringify({ preset: payload }),
      });

      setStatus(selectedPreset ? "Feature preset updated." : "Feature preset created.");
      await loadPresets();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save feature preset.");
    }
  }

  async function toggleActive(preset: FeaturePreset) {
    setStatus(`${preset.is_active ? "Disabling" : "Enabling"} ${preset.label}...`);

    try {
      await adminFetch(`/api/admin/feature-presets/${preset.id}`, {
        method: "PUT",
        body: JSON.stringify({
          preset: {
            label: preset.label,
            category: preset.category,
            icon: preset.icon,
            property_types: preset.property_types,
            sort_order: preset.sort_order,
            is_active: !preset.is_active,
          },
        }),
      });
      await loadPresets();
      setStatus(`${preset.label} ${preset.is_active ? "disabled" : "enabled"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update feature preset.");
    }
  }

  const activeCount = presets.filter((preset) => preset.is_active).length;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr]">
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest/60">Admin</p>
            <h1 className="mt-3 text-4xl font-semibold text-forest">Feature presets</h1>
            <p className="mt-2 text-sm text-forest/65">{activeCount} active presets for customer dashboards.</p>
          </div>
          <button type="button" onClick={startNewPreset} className="min-h-11 rounded-md bg-forest px-4 text-sm font-semibold text-white">
            New preset
          </button>
        </div>

        <div className="mt-8 space-y-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`w-full rounded-md border p-5 text-left shadow-sm transition ${
                preset.id === selectedPresetId
                  ? "border-forest bg-white"
                  : "border-transparent bg-white/75 hover:border-forest/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-forest">{preset.label}</h2>
                  <p className="mt-1 text-sm text-forest/65">{preset.category}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${preset.is_active ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                  {preset.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-forest/55">
                <span>Icon: {preset.icon}</span>
                <span>Sort: {preset.sort_order}</span>
                {preset.property_types.length > 0 ? <span>{preset.property_types.join(", ")}</span> : null}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-md bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-forest">
              {selectedPreset ? `Edit ${selectedPreset.label}` : "Create feature preset"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-forest/65">
              Manage the default options that customers can check inside Content &gt; Features.
            </p>
          </div>
          {selectedPreset ? (
            <button
              type="button"
              onClick={() => void toggleActive(selectedPreset)}
              className="min-h-10 rounded-md border border-forest/15 bg-sand/45 px-4 text-sm font-semibold text-forest"
            >
              {selectedPreset.is_active ? "Disable" : "Enable"}
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <TextField label="Label" value={form.label} onChange={(value) => updateField("label", value)} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Category" value={form.category} onChange={(value) => updateField("category", value)} required />
            <TextField label="Icon key" value={form.icon} onChange={(value) => updateField("icon", value)} />
            <TextField label="Sort order" value={form.sortOrder} onChange={(value) => updateField("sortOrder", value)} type="number" />
            <TextField label="Property types, comma-separated" value={form.propertyTypes} onChange={(value) => updateField("propertyTypes", value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-forest">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
              className="h-4 w-4 accent-forest"
            />
            Active
          </label>
          <button type="submit" className="min-h-12 rounded-md bg-forest px-5 text-sm font-semibold text-white">
            {selectedPreset ? "Save preset" : "Create preset"}
          </button>
          {status ? <p className="text-sm text-forest/70">{status}</p> : null}
        </form>
      </section>
    </div>
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
