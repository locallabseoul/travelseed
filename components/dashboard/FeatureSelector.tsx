import { useEffect, useMemo, useState } from "react";
import type { FeaturePreset } from "@/types/feature-preset";

const fallbackPresets: FeaturePreset[] = [
  { id: "private-pool", label: "Private Pool", category: "Stay Comfort", icon: "waves", property_types: [], sort_order: 10, is_active: true },
  { id: "fast-wifi", label: "Fast Wi-Fi", category: "Stay Comfort", icon: "wifi", property_types: [], sort_order: 20, is_active: true },
  { id: "breakfast", label: "Breakfast Included", category: "Food & Service", icon: "coffee", property_types: [], sort_order: 30, is_active: true },
  { id: "airport-pickup", label: "Airport Pickup", category: "Food & Service", icon: "car", property_types: [], sort_order: 40, is_active: true },
  { id: "family-friendly", label: "Family Friendly", category: "Guest Fit", icon: "users", property_types: [], sort_order: 50, is_active: true },
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
    <section className="grid gap-5 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div>
        <h3 className="text-sm font-semibold text-[#18352f]">Choose property features</h3>
        <p className="mt-1 text-xs leading-5 text-[#6f7b74]">Select ready-made guest-facing highlights, then add any custom feature you need.</p>
      </div>

      <div className="grid gap-5">
        {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#72815e]">{category}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {categoryPresets.map((preset) => {
                const selected = normalizedSelected.has(preset.label.toLowerCase());
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => toggleFeature(preset.label)}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "border-[#18352f] bg-[#18352f] text-white shadow-sm"
                        : "border-[#eadfce] bg-white text-[#18352f] hover:border-[#2d6b50]"
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className={selected ? "text-white/80" : "text-[#72815e]"}>{selected ? "Selected" : "Add"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-3 ring-1 ring-[#eadfce]">
        <label className="grid gap-2 text-sm font-medium text-[#18352f]">
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
              placeholder="Example: BBQ Area"
              className="min-h-11 flex-1 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]"
            />
            <button type="button" onClick={addCustomFeature} className="min-h-11 rounded-xl bg-[#e6f0e7] px-4 text-sm font-semibold text-[#1f5a45]">
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
                className="rounded-full bg-[#fff7f5] px-3 py-1 text-xs font-semibold text-[#9d3323]"
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
            <span key={feature} className="rounded-full bg-[#e6f0e7] px-3 py-1 text-xs font-semibold text-[#1f5a45]">
              {feature}
            </span>
          ))
        ) : (
          <p className="text-sm text-[#6f7b74]">No features selected yet.</p>
        )}
      </div>
      {status ? <p className="text-xs text-[#9d3323]">{status} Showing fallback presets.</p> : null}
    </section>
  );
}
