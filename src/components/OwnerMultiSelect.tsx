import { useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

export type OwnerUser = { id: string; fullName: string; email: string };

type Props = {
  users: OwnerUser[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function OwnerMultiSelect({ users, selectedIds, onChange }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [users, query]);

  const selectedUsers = useMemo(
    () => selectedIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as OwnerUser[],
    [users, selectedIds],
  );

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function selectAllFiltered() {
    const ids = new Set(selectedIds);
    filtered.forEach((u) => ids.add(u.id));
    onChange([...ids]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          <Search className="h-3.5 w-3.5" />
          Find users
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            autoComplete="off"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-800"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={selectAllFiltered}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Add all matching ({filtered.length})
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear selection
          </button>
        </div>
      </div>

      {selectedUsers.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Selected ({selectedUsers.length})
          </p>
          <div className="flex flex-wrap gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-2 min-h-[2.5rem] dark:border-indigo-500/20 dark:bg-indigo-950/30">
            {selectedUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 rounded-full bg-white pl-2.5 pr-1 py-1 text-xs font-medium text-slate-800 shadow-sm border border-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {u.fullName}
                <button
                  type="button"
                  aria-label={`Remove ${u.fullName}`}
                  disabled={selectedIds.length <= 1}
                  onClick={() => onChange(selectedIds.filter((x) => x !== u.id))}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Toggle owners ({filtered.length} shown)
        </p>
        <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:divide-slate-700">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">No users match your search.</p>
          ) : (
            filtered.map((u) => {
              const checked = selectedIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    checked ? "bg-indigo-50/80 dark:bg-indigo-950/40" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(u.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-700"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">{u.fullName}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</span>
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
