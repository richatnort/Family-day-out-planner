"use client";

import { useEffect, useState, useCallback } from "react";

interface Membership {
  id: number;
  name: string;
  description: string | null;
  expiresAt: string | null;
  activityIds: number[];
}

interface ActivityOption {
  id: number;
  name: string;
}

function expiryStatus(expiresAt: string | null): "active" | "soon" | "expired" {
  if (!expiresAt) return "active";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return "expired";
  if (diff < 30 * 24 * 60 * 60 * 1000) return "soon";
  return "active";
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  soon: "bg-amber-400",
  expired: "bg-red-500",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  soon: "Expiring soon",
  expired: "Expired",
};

const EMPTY_FORM = { name: "", description: "", expiresAt: "", activityIds: [] as number[] };

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Membership | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Membership | null>(null);

  const fetchAll = useCallback(async () => {
    const [mRes, aRes] = await Promise.all([
      fetch("/api/memberships"),
      fetch("/api/activities"),
    ]);
    if (mRes.ok) setMemberships(await mRes.json());
    if (aRes.ok) setActivities((await aRes.json()).map((a: { id: number; name: string }) => ({ id: a.id, name: a.name })));
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(m: Membership) {
    setEditing(m);
    setForm({
      name: m.name,
      description: m.description ?? "",
      expiresAt: m.expiresAt ?? "",
      activityIds: m.activityIds,
    });
    setShowForm(true);
  }

  function toggleActivity(id: number) {
    setForm((prev) => ({
      ...prev,
      activityIds: prev.activityIds.includes(id)
        ? prev.activityIds.filter((a) => a !== id)
        : [...prev.activityIds, id],
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    const body = {
      name: form.name,
      description: form.description || null,
      expiresAt: form.expiresAt || null,
      activityIds: form.activityIds,
    };

    const url = editing ? `/api/memberships/${editing.id}` : "/api/memberships";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setIsSaving(false);
    if (res.ok) {
      setShowForm(false);
      fetchAll();
    }
  }

  async function handleDelete(m: Membership) {
    await fetch(`/api/memberships/${m.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchAll();
  }

  const sorted = [...memberships].sort((a, b) => {
    const sa = expiryStatus(a.expiresAt);
    const sb = expiryStatus(b.expiresAt);
    const order = { expired: 0, soon: 1, active: 2 };
    return order[sa] - order[sb];
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Memberships
        </h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Add membership
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-[var(--radius-md)] animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-[var(--radius-lg)] p-8 text-center shadow-[var(--shadow-sm)]">
          <p className="text-[var(--color-foreground)]/50 text-sm">No memberships yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-[var(--color-foreground)]/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Membership</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Expires</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Activities</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const status = expiryStatus(m.expiresAt);
                return (
                  <tr key={m.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                        <span className="font-medium text-[var(--color-foreground)]">{m.name}</span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-[var(--color-foreground)]/50 mt-0.5 pl-4">{m.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--color-foreground)]/70">
                      {m.expiresAt
                        ? new Date(m.expiresAt).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium ${
                        status === "expired" ? "text-red-600" :
                        status === "soon" ? "text-amber-600" :
                        "text-green-600"
                      }`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--color-foreground)]/70">
                      {m.activityIds.length} linked
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(m)}
                          className="text-xs text-[var(--color-primary)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(m)}
                          className="text-xs text-[var(--color-error)] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-[var(--radius-lg)] p-6 w-full max-w-lg shadow-[var(--shadow-lg)] my-auto">
            <h2 className="font-[family-name:var(--font-heading)] font-semibold text-lg mb-4">
              {editing ? "Edit membership" : "Add membership"}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="e.g. National Trust"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="Optional note"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1">Expiry date</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-2">
                  Linked activities ({form.activityIds.length} selected)
                </label>
                <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] max-h-48 overflow-y-auto">
                  {activities.map((a) => (
                    <label key={a.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-muted)] cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={form.activityIds.includes(a.id)}
                        onChange={() => toggleActivity(a.id)}
                        className="w-4 h-4 accent-[var(--color-primary)]"
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.name}
                className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isSaving ? "Saving…" : editing ? "Save changes" : "Add membership"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-[var(--radius-lg)] p-6 w-full max-w-sm shadow-[var(--shadow-lg)]">
            <h2 className="font-[family-name:var(--font-heading)] font-semibold text-lg mb-2">Delete membership?</h2>
            <p className="text-sm text-[var(--color-foreground)]/70 mb-6">
              Remove <strong>{confirmDelete.name}</strong>? This will also unlink it from all activities.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--color-error)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
