import { useEffect, useState } from "react";
import { ArrowLeft, Link2, Lock as LockIcon, MapPin } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { OwnerMultiSelect } from "../components/OwnerMultiSelect.js";
import type { AdminPage } from "../components/AdminLayout.js";

type UserOpt = { id: string; fullName: string; email: string };

type Props = {
  showToast: (msg: string, type?: "ok" | "err") => void;
  onNavigate: (p: AdminPage) => void;
};

export default function NewLockPage({ showToast, onNavigate }: Props) {
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "", location: "", ownerIds: [] as string[] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      try {
        const res = await apiFetch("/api/admin/users");
        if (!res.ok) {
          if (!cancelled) showToast("Failed to load users", "err");
          return;
        }
        const data = (await res.json()) as { users?: UserOpt[] };
        const list = data.users ?? [];
        if (!cancelled) {
          setUsers(list);
          setForm((f) => ({
            ...f,
            ownerIds: list[0]?.id ? [list[0].id] : [],
          }));
        }
      } catch {
        if (!cancelled) showToast("Network error", "err");
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
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
      if (slug) body.slug = slug;
      const res = await apiFetch("/api/locks", {
        method: "POST",
        json: body,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error || "Create failed", "err");
        return;
      }
      showToast("Lock created", "ok");
      onNavigate("locks");
    } catch {
      showToast("Network error", "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate("locks")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to locks
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <LockIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create a new lock</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add details and assign owners. Search helps when you have many users.
            </p>
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 dark:text-slate-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Loading users…
          </div>
        ) : (
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="min-w-0 sm:col-span-1">
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
              <div className="min-w-0 sm:col-span-1">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Link2 className="h-3.5 w-3.5" />
                  Slug <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm lowercase text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
                  placeholder="exam-hall-door"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                  }
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-2 -mt-1">
                If you leave slug blank, it is generated from the name when you save.
              </p>
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
              <OwnerMultiSelect
                users={users}
                selectedIds={form.ownerIds}
                onChange={(ids) => setForm((f) => ({ ...f, ownerIds: ids }))}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-6 dark:border-slate-700 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onNavigate("locks")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create lock"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
