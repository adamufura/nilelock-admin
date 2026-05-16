import type { ReactNode } from "react";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Lock,
  ScrollText,
  Settings,
  LogOut,
  KeyRound,
  Sun,
  Moon,
} from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { useTheme } from "../context/ThemeContext.js";

export type AdminPage =
  | "dashboard"
  | "users"
  | "locks"
  | "locks-new"
  | "events"
  | "settings";

type Props = {
  current: AdminPage;
  onNavigate: (p: AdminPage) => void;
  onLogout: () => void;
  children: ReactNode;
};

const nav: { id: AdminPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "locks", label: "Locks", icon: Lock },
  { id: "events", label: "Events", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
];

const pageTitle: Record<AdminPage, string> = {
  dashboard: "Dashboard",
  users: "Users",
  locks: "Locks",
  "locks-new": "New lock",
  events: "Events",
  settings: "Settings",
};

function navItemActive(itemId: AdminPage, current: AdminPage) {
  if (itemId === "locks") return current === "locks" || current === "locks-new";
  return current === itemId;
}

export function AdminLayout({ current, onNavigate, onLogout, children }: Props) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-svh bg-slate-100/80 dark:bg-slate-950">
      <aside className="sticky top-0 flex h-svh max-h-svh w-64 shrink-0 flex-col self-start border-r border-slate-200/80 bg-slate-900 text-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-700/80 px-5 py-5 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 shadow-lg shadow-indigo-500/30">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">NileLock</p>
            <h1 className="text-sm font-bold leading-tight text-white">Admin Console</h1>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = navItemActive(item.id, current);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-medium transition-all ${
                  active
                    ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    active ? "text-indigo-300" : "text-slate-500 group-hover:text-indigo-300"
                  }`}
                  strokeWidth={active ? 2.25 : 2}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-700/80 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-400 transition-colors hover:bg-red-950/50 hover:text-red-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{pageTitle[current]}</h2>
          <span className="ml-3 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Live
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        message="You will need to sign in again to access the admin console."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="danger"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          onLogout();
        }}
      />
    </div>
  );
}
