import { useEffect, useMemo, useState } from "react";
import { Users, Lock, ShieldCheck, ShieldAlert, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { apiFetch } from "../lib/api.js";
import { useTheme } from "../context/ThemeContext.js";

type Props = { showToast: (msg: string, type?: "ok" | "err") => void };

const PIE_COLORS = ["#ef4444", "#22c55e"];

function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-900 p-8 text-white shadow-xl shadow-indigo-500/20">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-2xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Nile University</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Security operations overview</h1>
          <p className="mt-3 text-sm leading-relaxed text-indigo-100">
            Monitor locks, residents, and access events across campus from one place. Data refreshes when you open
            this page.
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-[220px] shrink-0 lg:mx-0">
          <svg viewBox="0 0 200 180" className="w-full drop-shadow-lg" aria-hidden>
            <defs>
              <linearGradient id="hero-cap" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fcd34d" />
              </linearGradient>
              <linearGradient id="hero-body" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0e7ff" />
                <stop offset="100%" stopColor="#a5b4fc" />
              </linearGradient>
            </defs>
            <ellipse cx="100" cy="155" rx="70" ry="14" fill="black" opacity="0.15" />
            <rect x="55" y="75" width="90" height="70" rx="16" fill="url(#hero-body)" stroke="white" strokeOpacity="0.4" strokeWidth="2" />
            <path d="M85 75 V55 C85 38 115 38 115 55 V75" fill="none" stroke="url(#hero-cap)" strokeWidth="10" strokeLinecap="round" />
            <circle cx="100" cy="110" r="14" fill="#4f46e5" opacity="0.9" />
            <path d="M94 108 h12 M100 102 v12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <rect x="118" y="52" width="28" height="22" rx="4" fill="#22c55e" opacity="0.9" />
            <path d="M132 52 V44 M128 48 h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

type StatProps = {
  label: string;
  value: number;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  foot?: string;
};

function StatCard({ label, value, icon: Icon, iconBg, iconColor, foot }: StatProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div
        className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-[0.07] transition group-hover:scale-110 ${iconBg}`}
      />
      <div
        className={`relative mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} ${iconColor}`}
      >
        <Icon className="h-8 w-8 stroke-[1.75]" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</p>
      {foot ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{foot}</p> : null}
    </div>
  );
}

export default function DashboardPage({ showToast }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [users, setUsers] = useState(0);
  const [locks, setLocks] = useState({ total: 0, locked: 0, unlocked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [uRes, lRes] = await Promise.all([apiFetch("/api/admin/users"), apiFetch("/api/locks")]);
        if (!uRes.ok || !lRes.ok) {
          if (!cancelled) showToast("Failed to load dashboard", "err");
          return;
        }
        const uJson = (await uRes.json()) as { users?: unknown[] };
        const lJson = (await lRes.json()) as { locks?: { state?: string }[] };
        const list = lJson.locks ?? [];
        const locked = list.filter((x) => x.state === "locked").length;
        const unlocked = list.filter((x) => x.state === "unlocked").length;
        if (!cancelled) {
          setUsers(uJson.users?.length ?? 0);
          setLocks({ total: list.length, locked, unlocked });
        }
      } catch {
        if (!cancelled) showToast("Network error", "err");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const pieData = useMemo(
    () => [
      { name: "Locked", value: locks.locked },
      { name: "Unlocked", value: locks.unlocked },
    ],
    [locks.locked, locks.unlocked],
  );

  const barData = useMemo(
    () => [
      { name: "Users", n: users },
      { name: "Locks", n: locks.total },
    ],
    [users, locks.total],
  );

  const lockRatio =
    locks.total > 0 ? Math.round((locks.unlocked / locks.total) * 100) : 0;

  const axisTick = isDark ? "#94a3b8" : "#64748b";
  const axisTickY = isDark ? "#64748b" : "#94a3b8";
  const tooltipStyle = useMemo(
    () => ({
      borderRadius: "12px",
      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
      background: isDark ? "#0f172a" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#0f172a",
      boxShadow: "0 10px 40px -10px rgb(0 0 0 / 0.2)",
    }),
    [isDark],
  );

  return (
    <div className="space-y-8">
      <DashboardHero />

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Loading metrics…
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total users"
              value={users}
              icon={Users}
              iconBg="bg-sky-100 dark:bg-sky-950/50"
              iconColor="text-sky-600 dark:text-sky-400"
              foot="Staff & residents in the system"
            />
            <StatCard
              label="Locks deployed"
              value={locks.total}
              icon={Lock}
              iconBg="bg-violet-100 dark:bg-violet-950/50"
              iconColor="text-violet-600 dark:text-violet-400"
              foot="Doors registered on campus"
            />
            <StatCard
              label="Locked now"
              value={locks.locked}
              icon={ShieldAlert}
              iconBg="bg-red-100 dark:bg-red-950/50"
              iconColor="text-red-600 dark:text-red-400"
              foot="Secure / closed state"
            />
            <StatCard
              label="Unlocked now"
              value={locks.unlocked}
              icon={ShieldCheck}
              iconBg="bg-emerald-100 dark:bg-emerald-950/50"
              iconColor="text-emerald-600 dark:text-emerald-400"
              foot={`${lockRatio}% of locks open`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lock states</h3>
                <TrendingUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              {locks.total === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No locks yet — add one under Locks.
                </p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={0}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={pieData[i].name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, ""]}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex justify-center gap-6 text-xs">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Locked
                </span>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Unlocked
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Footprint</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisTick }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: axisTickY }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: isDark ? "#1e293b" : "#f1f5f9", radius: 8 }}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="n" radius={[10, 10, 0, 0]} fill="#6366f1" maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">Users vs locks in your organization</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
