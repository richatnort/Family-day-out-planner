"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ActivityFormData {
  name: string;
  category: string;
  costTier: string;
  weather: string;
  setting: string;
  websiteUrl: string;
  lat: string;
  lng: string;
  locationName: string;
  description: string;
  food: string;
  ageMin: string;
  ageMax: string;
  prebookingRequired: boolean;
  imageUrl: string;
}

interface Props {
  initialData?: Partial<ActivityFormData>;
  activityId?: number;
}

const EMPTY: ActivityFormData = {
  name: "",
  category: "nature",
  costTier: "free",
  weather: "both",
  setting: "outdoor",
  websiteUrl: "",
  lat: "",
  lng: "",
  locationName: "",
  description: "",
  food: "unknown",
  ageMin: "",
  ageMax: "",
  prebookingRequired: false,
  imageUrl: "",
};

export default function ActivityForm({ initialData, activityId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ActivityFormData>({ ...EMPTY, ...initialData });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"import" | "manual">(activityId ? "manual" : "import");
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function set(field: keyof ActivityFormData, value: string | boolean) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImport() {
    setIsImporting(true);
    setImportError(null);
    const res = await fetch("/api/activities/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: importUrl }),
    });
    const json = await res.json().catch(() => ({}));
    setIsImporting(false);
    if (!res.ok) {
      setImportError(json.error ?? "Auto-fill unavailable — please fill in manually");
      return;
    }
    setData({ ...EMPTY, ...json });
    setMode("manual");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const body = {
      name: data.name,
      category: data.category,
      costTier: data.costTier,
      weather: data.weather,
      setting: data.setting,
      websiteUrl: data.websiteUrl || null,
      lat: data.lat || null,
      lng: data.lng || null,
      locationName: data.locationName || null,
      description: data.description || null,
      food: data.food,
      ageMin: data.ageMin ? parseInt(data.ageMin, 10) : null,
      ageMax: data.ageMax ? parseInt(data.ageMax, 10) : null,
      prebookingRequired: data.prebookingRequired,
      imageUrl: data.imageUrl || null,
    };

    const url = activityId ? `/api/activities/${activityId}` : "/api/activities";
    const method = activityId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setIsSaving(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json?.error ? JSON.stringify(json.error) : "Save failed — please check all fields");
      return;
    }

    router.push("/admin/activities");
    router.refresh();
  }

  const labelClass = "block text-sm font-medium text-[var(--color-foreground)]/70 mb-1";
  const inputClass = "w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
  const selectClass = inputClass;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Tab switcher — only shown when adding a new activity */}
      {!activityId && (
        <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => setMode("import")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === "import"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-foreground)]/60 hover:bg-[var(--color-muted)]"
            }`}
          >
            Import from URL
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-[var(--color-border)] ${
              mode === "manual"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-foreground)]/60 hover:bg-[var(--color-muted)]"
            }`}
          >
            Enter manually
          </button>
        </div>
      )}

      {/* Import panel */}
      {mode === "import" && (
        <div className="flex flex-col gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]">
          <p className="text-sm text-[var(--color-foreground)]/70">
            Paste the venue website URL and we&apos;ll extract the details automatically.
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleImport(); } }}
              className={inputClass + " flex-1"}
              placeholder="https://www.example-venue.co.uk"
              disabled={isImporting}
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !importUrl}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Fetching details…
                </>
              ) : (
                "Extract details"
              )}
            </button>
          </div>
          {importError && (
            <p className="text-sm text-[var(--color-error)] bg-red-50 px-3 py-2 rounded-[var(--radius-md)]" role="alert">
              {importError}
            </p>
          )}
        </div>
      )}

      {/* Manual entry form */}
      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              required
              value={data.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Harewood House"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className={labelClass}>Category *</label>
              <select value={data.category} onChange={(e) => set("category", e.target.value)} className={selectClass}>
                {["museum","nature","adventure","farm","water","heritage","sport","rainy-day"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Cost tier */}
            <div>
              <label className={labelClass}>Cost Tier *</label>
              <select value={data.costTier} onChange={(e) => set("costTier", e.target.value)} className={selectClass}>
                <option value="free">Free</option>
                <option value="cheap">Cheap (£)</option>
                <option value="moderate">Moderate (££)</option>
                <option value="premium">Premium (£££)</option>
              </select>
            </div>

            {/* Weather */}
            <div>
              <label className={labelClass}>Weather *</label>
              <select value={data.weather} onChange={(e) => set("weather", e.target.value)} className={selectClass}>
                <option value="sunny">Sunny only</option>
                <option value="rainy-friendly">Rainy-friendly</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Setting */}
            <div>
              <label className={labelClass}>Setting *</label>
              <select value={data.setting} onChange={(e) => set("setting", e.target.value)} className={selectClass}>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className={labelClass}>Website URL (OG image auto-fetched if no image URL set)</label>
            <input
              type="url"
              value={data.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>

          {/* Image URL override */}
          <div>
            <label className={labelClass}>Image URL (optional override)</label>
            <input
              type="url"
              value={data.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              className={inputClass}
              placeholder="Leave blank to auto-fetch from website"
            />
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Location Name</label>
            <input
              type="text"
              value={data.locationName}
              onChange={(e) => set("locationName", e.target.value)}
              className={inputClass}
              placeholder="e.g. Harewood, Leeds"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Latitude</label>
              <input
                type="text"
                value={data.lat}
                onChange={(e) => set("lat", e.target.value)}
                className={inputClass}
                placeholder="53.123456"
              />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input
                type="text"
                value={data.lng}
                onChange={(e) => set("lng", e.target.value)}
                className={inputClass}
                placeholder="-1.123456"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Brief description..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Food */}
            <div>
              <label className={labelClass}>Food</label>
              <select value={data.food} onChange={(e) => set("food", e.target.value)} className={selectClass}>
                <option value="unknown">Unknown</option>
                <option value="on-site">On site</option>
                <option value="nearby">Nearby</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Age range */}
            <div>
              <label className={labelClass}>Min age</label>
              <input
                type="number"
                min={0}
                value={data.ageMin}
                onChange={(e) => set("ageMin", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max age</label>
              <input
                type="number"
                min={0}
                value={data.ageMax}
                onChange={(e) => set("ageMax", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Prebooking */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.prebookingRequired}
              onChange={(e) => set("prebookingRequired", e.target.checked)}
              className="w-4 h-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-foreground)]/80">Pre-booking required</span>
          </label>

          {error && (
            <p className="text-sm text-[var(--color-error)] bg-red-50 px-3 py-2 rounded-[var(--radius-md)]" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isSaving ? "Saving…" : activityId ? "Save changes" : "Create activity"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-[var(--color-border)] text-[var(--color-foreground)]/70 rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
