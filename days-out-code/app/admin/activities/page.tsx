"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Activity {
  id: number;
  name: string;
  category: string;
  costTier: string;
  isActive: boolean;
  isConsidering: boolean;
  isPlan: boolean;
  isMystery: boolean;
  locationName: string | null;
}

type FilterKey = "all" | "active" | "inactive" | "considering" | "plan";

const COST_LABEL: Record<string, string> = {
  free: "Free",
  cheap: "£",
  moderate: "££",
  premium: "£££",
};

export default function AdminActivities() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("active");
  const [confirmDelete, setConfirmDelete] = useState<Activity | null>(null);

  const fetchActivities = useCallback(async () => {
    const res = await fetch("/api/activities?all=true");
    if (res.ok) {
      const data: Activity[] = await res.json();
      setActivities(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  async function toggleFlag(id: number, field: "isConsidering" | "isPlan" | "isMystery", value: boolean) {
    const body: Record<string, boolean> = { [field]: value };
    // Clear mystery if plan is being turned off
    if (field === "isPlan" && !value) body.isMystery = false;

    await fetch(`/api/activities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...body } : a))
    );
  }

  async function deactivate(activity: Activity) {
    await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
    setActivities((prev) => prev.map((a) => (a.id === activity.id ? { ...a, isActive: false } : a)));
    setConfirmDelete(null);
  }

  const filtered = activities.filter((a) => {
    if (filter === "active") return a.isActive;
    if (filter === "inactive") return !a.isActive;
    if (filter === "considering") return a.isConsidering && a.isActive;
    if (filter === "plan") return a.isPlan && a.isActive;
    return true;
  });

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: "active", label: `Active (${activities.filter((a) => a.isActive).length})` },
    { key: "considering", label: `Considering (${activities.filter((a) => a.isConsidering && a.isActive).length})` },
    { key: "plan", label: `In Plan (${activities.filter((a) => a.isPlan && a.isActive).length})` },
    { key: "inactive", label: `Inactive (${activities.filter((a) => !a.isActive).length})` },
    { key: "all", label: `All (${activities.length})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Activities
        </h1>
        <Link
          href="/admin/activities/new"
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Add activity
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === key
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white text-[var(--color-foreground)]/70 border-[var(--color-border)] hover:border-[var(--color-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-[var(--radius-md)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-[var(--color-foreground)]/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Cost</th>
                <th className="text-center px-2 py-3">Considering</th>
                <th className="text-center px-2 py-3">Plan</th>
                <th className="text-center px-2 py-3">Mystery</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-foreground)]/40">
                    No activities in this filter
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className={`border-t border-[var(--color-border)] ${!a.isActive ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                    {a.name}
                    {a.locationName && (
                      <span className="block text-xs text-[var(--color-foreground)]/50 font-normal">
                        {a.locationName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell capitalize text-[var(--color-foreground)]/70">
                    {a.category}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[var(--color-foreground)]/70">
                    {COST_LABEL[a.costTier] ?? a.costTier}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={a.isConsidering}
                      disabled={!a.isActive}
                      onChange={(e) => toggleFlag(a.id, "isConsidering", e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={a.isPlan}
                      disabled={!a.isActive}
                      onChange={(e) => toggleFlag(a.id, "isPlan", e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={a.isMystery}
                      disabled={!a.isActive || !a.isPlan}
                      onChange={(e) => toggleFlag(a.id, "isMystery", e.target.checked)}
                      className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer disabled:opacity-30"
                      title={!a.isPlan ? "Only available when activity is in the plan" : ""}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => router.push(`/admin/activities/${a.id}/edit`)}
                        className="text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Edit
                      </button>
                      {a.isActive && (
                        <button
                          onClick={() => setConfirmDelete(a)}
                          className="text-xs text-[var(--color-error)] hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-[var(--radius-lg)] p-6 w-full max-w-sm shadow-[var(--shadow-lg)]">
            <h2 className="font-[family-name:var(--font-heading)] font-semibold text-lg mb-2">
              Deactivate activity?
            </h2>
            <p className="text-sm text-[var(--color-foreground)]/70 mb-6">
              Remove <strong>{confirmDelete.name}</strong> from browse? It can be reactivated later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deactivate(confirmDelete)}
                className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--color-error)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
