import { useCallback, useEffect, useState } from "react";
import { Activity, Radio } from "lucide-react";
import { apiFetch } from "../lib/api.js";

type EventRow = {
  id: string;
  lockId: string;
  lockName: string;
  userEmail: string;
  action: string;
  outcome: string;
  channel: string;
  createdAt?: string;
};

type Props = { showToast: (msg: string, type?: "ok" | "err") => void };

export default function EventsPage({ showToast }: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/events?limit=50");
      if (!res.ok) {
        showToast("Failed to load events", "err");
        return;
      }
      const data = (await res.json()) as { events?: EventRow[] };
      setEvents(data.events ?? []);
    } catch {
      showToast("Network error", "err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Events</h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Activity className="h-3 w-3" />
            Live
          </span>
          Most recent 50 events · auto-refresh every 30s
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95 dark:text-slate-400">
                <th className="px-5 py-4">Lock</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Outcome</th>
                <th className="px-5 py-4">Channel</th>
                <th className="px-5 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      Loading…
                    </span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400">
                    No events yet.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="transition hover:bg-slate-50/90 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Radio className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">{ev.lockName || ev.lockId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{ev.userEmail}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {ev.action}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          ev.outcome === "success"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                      >
                        {ev.outcome}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{ev.channel}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-400">
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
