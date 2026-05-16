import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock as LockIcon, MapPin, Pencil, Plus, Trash2, Link2 } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { connectSocket } from "../lib/socket.js";
import { OwnerMultiSelect } from "../components/OwnerMultiSelect.js";

type LockRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  state: "locked" | "unlocked";
  batteryLevel: number;
  ownerIds: string[];
};

type UserOpt = { id: string; fullName: string; email: string };

type Props = {
  token: string | null;
  showToast: (msg: string, type?: "ok" | "err") => void;
  onNavigateToNewLock: () => void;
};

function ownersLabel(users: UserOpt[], ownerIds: string[]): string {
  if (!ownerIds.length) return "—";
  return ownerIds
    .map((id) => {
      const u = users.find((x) => x.id === id);
      return u ? u.fullName : id;
    })
    .join(", ");
}

export default function LocksPage({ token, showToast, onNavigateToNewLock }: Props) {
  const [locks, setLocks] = useState<LockRow[]>([]);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<LockRow | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", location: "", ownerIds: [] as string[] });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, uRes] = await Promise.all([apiFetch("/api/locks"), apiFetch("/api/admin/users")]);
      if (lRes.ok) {
        const data = (await lRes.json()) as { locks?: LockRow[] };
        const rows = (data.locks ?? []) as LockRow[];
        setLocks(
          rows.map((r) => ({
            ...r,
            ownerIds: r.ownerIds ?? ((r as unknown as { ownerId?: string }).ownerId ? [(r as unknown as { ownerId: string }).ownerId] : []),
          })),
        );
      }
      if (uRes.ok) {
        const data = (await uRes.json()) as { users?: UserOpt[] };
        setUsers(data.users ?? []);
      }
      if (!lRes.ok) showToast("Failed to load locks", "err");
    } catch {
      showToast("Network error", "err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const lockIds = useMemo(() => locks.map((l) => l.id).sort().join(","), [locks]);

  useEffect(() => {
    if (!token || !lockIds) return;
    const sock = connectSocket(token);
    const onState = (p: { lockId?: string; state?: string }) => {
      if (!p.lockId || (p.state !== "locked" && p.state !== "unlocked")) return;
      setLocks((prev) =>
        prev.map((l) => (l.id === p.lockId ? { ...l, state: p.state as "locked" | "unlocked" } : l)),
      );
    };
    const onDeleted = (p: { lockId?: string }) => {
      if (!p.lockId) return;
      setLocks((prev) => prev.filter((l) => l.id !== p.lockId));
    };
    sock.on("lock:state", onState);
    sock.on("lock:deleted", onDeleted);
    lockIds.split(",").forEach((id) => {
      if (id) sock.emit("lock:subscribe", id, () => {});
    });
    return () => {
      sock.off("lock:state", onState);
      sock.off("lock:deleted", onDeleted);
    };
  }, [token, lockIds]);

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    if (form.ownerIds.length < 1) {
      showToast("Select at least one owner", "err");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        location: form.location.trim(),
        ownerIds: form.ownerIds,
      };
      const slug = form.slug.trim().toLowerCase();
      if (slug && slug !== editRow.slug) body.slug = slug;
      const res = await apiFetch(`/api/locks/${encodeURIComponent(editRow.id)}`, {
        method: "PATCH",
        json: body,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error || "Update failed", "err");
        return;
      }
      showToast("Lock updated", "ok");
      setEditRow(null);
      await load();
    } catch {
      showToast("Network error", "err");
    } finally {
      setSaving(false);
    }
  }

  async function toggleLock(row: LockRow) {
    const action = row.state === "locked" ? "unlock" : "lock";
    const path = `/api/locks/${encodeURIComponent(row.id)}/command`;
    const res = await apiFetch(path, {
      method: "POST",
      headers: { "x-client-channel": "dashboard" },
      json: { action },
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; state?: string };
    if (!res.ok) {
      showToast(data.error || "Command failed", "err");
      return;
    }
    if (data.state === "locked" || data.state === "unlocked") {
      setLocks((prev) => prev.map((l) => (l.id === row.id ? { ...l, state: data.state as "locked" | "unlocked" } : l)));
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete lock "${name}"?`)) return;
    const res = await apiFetch(`/api/locks/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      showToast(data.error || "Delete failed", "err");
      return;
    }
    showToast("Lock deleted", "ok");
    await load();
  }

  function openEdit(row: LockRow) {
    setEditRow(row);
    setForm({
      name: row.name,
      slug: row.slug,
      location: row.location,
      ownerIds: [...row.ownerIds],
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Locks</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Register doors, assign owners with search, and control access from the console.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToNewLock}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add lock
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                <th className="px-5 py-4">Lock</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Owners</th>
                <th className="px-5 py-4">State</th>
                <th className="px-5 py-4">Battery</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      Loading locks…
                    </span>
                  </td>
                </tr>
              ) : locks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400">
                    No locks yet. Use <strong className="text-slate-700 dark:text-slate-200">Add lock</strong> to create one.
                  </td>
                </tr>
              ) : (
                locks.map((row) => (
                  <tr
                    key={row.id}
                    className="transition hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            row.state === "locked"
                              ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          }`}
                        >
                          <LockIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                          <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">{row.slug || row.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{row.location || "—"}</td>
                    <td
                      className="max-w-[200px] px-5 py-4 text-xs text-slate-600 dark:text-slate-400"
                      title={ownersLabel(users, row.ownerIds)}
                    >
                      <span className="line-clamp-2">{ownersLabel(users, row.ownerIds)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.state === "locked"
                            ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {row.state}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full rounded-full ${
                              row.batteryLevel <= 20
                                ? "bg-red-500"
                                : row.batteryLevel <= 50
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, row.batteryLevel))}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-700 dark:text-slate-300">{row.batteryLevel}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleLock(row)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          {row.state === "locked" ? "Unlock" : "Lock"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id, row.name)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editRow ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="my-8 w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit lock</h3>
                <p className="mt-0.5 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{editRow.slug}</p>
              </div>
            </div>
            <form onSubmit={(e) => void handleEditSave(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <LockIcon className="h-3.5 w-3.5" />
                  Name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Link2 className="h-3.5 w-3.5" />
                  New slug <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm lowercase text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  placeholder={editRow.slug}
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                  Each owner sets their passcode in the mobile app. Use search when you have many users.
                </p>
                <OwnerMultiSelect
                  users={users}
                  selectedIds={form.ownerIds}
                  onChange={(ids) => setForm((f) => ({ ...f, ownerIds: ids }))}
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditRow(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
