import type { ReactNode } from "react";

type Props = {
  token: string | null;
  role: string | null;
  onNeedLogin: () => void;
  children: ReactNode;
};

/** Ensures a Bearer token exists; admin-only gate for this dashboard. */
export function AuthGuard({ token, role, onNeedLogin, children }: Props) {
  if (!token) {
    return null;
  }
  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <h1 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Administrator access only</h1>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">Your account is not an admin.</p>
          <button
            type="button"
            onClick={onNeedLogin}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
