import { useEffect, useState } from "react";
import { Plus, Trash2, UserPlus, Mail, Shield } from "lucide-react";
import { apiFetch } from "../lib/api.js";

type UserRow = { id: string; fullName: string; email: string; role: string };

type Props = { showToast: (msg: string, type?: "ok" | "err") => void };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const a = parts[0][0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (a + b).toUpperCase();
}

export default function UsersPage({ showToast }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/users");
      if (!res.ok) {
        showToast("Failed to load users", "err");
        return;
      }
      const data = (await res.json()) as { users?: UserRow[] };
      setUsers(data.users ?? []);
    } catch {
      showToast("Network error", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [showToast]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        json: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        showToast(data.error || "Create failed", "err");
        return;
      }
      showToast("User created", "ok");
      setModal(false);
      setForm({ fullName: "", email: "", password: "", role: "user" });
      await load();
    } catch {
      showToast("Network error", "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!window.confirm(`Delete user ${email}?`)) return;
    const res = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      showToast(data.error || "Delete failed", "err");
      return;
    }
    showToast("User deleted", "ok");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            People who can sign in. Admins have full console access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add user
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500 dark:text-slate-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            No users yet. Add someone with <strong className="text-slate-700 dark:text-slate-200">Add user</strong>.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/90 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 dark:hover:bg-slate-800/40"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-500/25">
                    {initials(u.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{u.fullName}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500 dark:text-slate-400">
                      <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      {u.email}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 pl-16 sm:pl-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    {u.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(u.id, u.email)}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="my-8 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add user</h3>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  They can sign in with email and password.
                </p>
              </div>
            </div>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Full name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Role
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "user" | "admin" }))}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
