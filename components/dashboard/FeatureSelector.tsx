import { useEffect, useMemo, useState } from "react";
import type { FeaturePreset } from "@/types/feature-preset";

const fallbackPresets: FeaturePreset[] = [
  { id: "private-pool", label: "Private Space", category: "Customer Comfort", icon: "waves", property_types: [], sort_order: 10, is_active: true },
  { id: "fast-wifi", label: "Fast Wi-Fi", category: "Customer Comfort", icon: "wifi", property_types: [], sort_order: 20, is_active: true },
  { id: "breakfast", label: "Breakfast Included", category: "Food & Service", icon: "coffee", property_types: [], sort_order: 30, is_active: true },
  { id: "airport-pickup", label: "Airport Pickup", category: "Food & Service", icon: "car", property_types: [], sort_order: 40, is_active: true },
  { id: "family-friendly", label: "Family Friendly", category: "Customer Fit", icon: "users", property_types: [], sort_order: 50, is_active: true },
  { id: "surf-lessons", label: "Surf Lessons", category: "Activities", icon: "waves", property_types: [], sort_order: 60, is_active: true },
];

function normalizeFeature(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function categoryMap(presets: FeaturePreset[]) {
  return presets.reduce<Record<string, FeaturePreset[]>>((groups, preset) => {
    const category = preset.category || "General";
    groups[category] = [...(groups[category] ?? []), preset];
    return groups;
  }, {});
}

export function FeatureSelector({
  features,
  onChange,
}: {
  features: string[];
  onChange: (features: string[]) => void;
}) {
  const [presets, setPresets] = useState<FeaturePreset[]>(fallbackPresets);
  const [status, setStatus] = useState("");
  const [customFeature, setCustomFeature] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPresets() {
      try {
        const response = await fetch("/api/feature-presets");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error ?? "Could not load feature presets.");
        }

        if (!cancelled) {
          setPresets((data.presets ?? []) as FeaturePreset[]);
          setStatus("");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Could not load feature presets.");
        }
      }
    }

    void loadPresets();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSelected = useMemo(() => new Set(features.map((feature) => normalizeFeature(feature).toLowerCase())), [features]);
  const presetLabels = useMemo(() => new Set(presets.map((preset) => preset.label.toLowerCase())), [presets]);
  const customFeatures = features.filter((feature) => !presetLabels.has(feature.toLowerCase()));
  const groupedPresets = categoryMap(presets);

  function toggleFeature(label: string) {
    const normalizedLabel = normalizeFeature(label);
    const selected = normalizedSelected.has(normalizedLabel.toLowerCase());

    if (selected) {
      onChange(features.filter((feature) => normalizeFeature(feature).toLowerCase() !== normalizedLabel.toLowerCase()));
      return;
    }

    onChange([...features, normalizedLabel]);
  }

  function addCustomFeature() {
    const nextFeature = normalizeFeature(customFeature);
    if (!nextFeature || normalizedSelected.has(nextFeature.toLowerCase())) {
      setCustomFeature("");
      return;
    }

    onChange([...features, nextFeature]);
    setCustomFeature("");
  }

  return (
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-950">Choose business features</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">Select ready-made customer-facing highlights, then add any custom feature you need.</p>
      </div>

      <div className="grid gap-5">
        {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{category}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {categoryPresets.map((preset) => {
                const selected = normalizedSelected.has(preset.label.toLowerCase());
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => toggleFeature(preset.label)}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-950 hover:border-emerald-300"
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className={selected ? "text-white/80" : "text-emerald-700"}>{selected ? "Selected" : "Add"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
        <label className="grid gap-2 text-sm font-medium text-slate-950">
          Custom feature
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={customFeature}
              onChange={(event) => setCustomFeature(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomFeature();
                }
              }}
              placeholder="Example: Local delivery"
              className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <button type="button" onClick={addCustomFeature} className="min-h-11 rounded-md bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Add custom
            </button>
          </div>
        </label>

        {customFeatures.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {customFeatures.map((feature) => (
              <button
                key={feature}
                type="button"
                onClick={() => toggleFeature(feature)}
                className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
              >
                Remove {feature}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {features.length > 0 ? (
          features.map((feature) => (
            <span key={feature} className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {feature}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-600">No features selected yet.</p>
        )}
      </div>
      {status ? <p className="text-xs text-red-700">{status} Showing fallback presets.</p> : null}
    </section>
  );
}
