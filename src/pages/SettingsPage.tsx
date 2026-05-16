import { useEffect, useState } from "react";
import { Activity, Server, Shield } from "lucide-react";
import { getApiBase } from "../lib/api.js";

export default function SettingsPage() {
  const [health, setHealth] = useState<{ ok?: boolean; database?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/health`);
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; database?: string };
        if (!cancelled) setHealth(json);
      } catch {
        if (!cancelled) setHealth({ ok: false, database: "unknown" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Console preferences and system status.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">API</h3>
            <p className="text-xs font-mono break-all text-slate-500 dark:text-slate-400">{getApiBase()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Health</h3>
        </div>
        {health ? (
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${health.ok ? "animate-pulse bg-emerald-500" : "bg-red-500"}`}
            />
            <span className="text-slate-700 dark:text-slate-300">
              {health.ok ? "API reachable" : "API unreachable"}
              {health.database ? ` · DB: ${health.database}` : ""}
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Checking…</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/20">
        <div className="mb-2 flex items-center gap-3">
          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Security</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Sessions use secure HTTP-only patterns on the API. Always use strong passwords for admin accounts
          and restrict production CORS origins.
        </p>
      </div>
    </div>
  );
}
