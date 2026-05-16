import { useCallback, useEffect, useState } from "react";
import { setUnauthorizedHandler } from "./lib/api.js";
import { disconnectSocket } from "./lib/socket.js";
import { useAuth } from "./hooks/useAuth.js";
import { AdminLayout, type AdminPage } from "./components/AdminLayout.js";
import { AuthGuard } from "./components/AuthGuard.js";
import LoginPage from "./pages/LoginPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import UsersPage from "./pages/UsersPage.js";
import LocksPage from "./pages/LocksPage.js";
import NewLockPage from "./pages/NewLockPage.js";
import EventsPage from "./pages/EventsPage.js";
import SettingsPage from "./pages/SettingsPage.js";

export default function App() {
  const { token, role, isAuthenticated, login, logout } = useAuth();
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  function handleLogout() {
    disconnectSocket();
    logout();
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoggedIn={(access, refresh, r) => {
            login(access, refresh, r);
            if (r === "admin") {
              setPage("dashboard");
            }
          }}
          showToast={showToast}
        />
        {toast ? (
          <div
            className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-white shadow-lg ${
              toast.type === "ok" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.msg}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <AuthGuard token={token} role={role} onNeedLogin={handleLogout}>
        <AdminLayout current={page} onNavigate={setPage} onLogout={handleLogout}>
          {page === "dashboard" ? <DashboardPage showToast={showToast} /> : null}
          {page === "users" ? <UsersPage showToast={showToast} /> : null}
          {page === "locks" ? (
            <LocksPage token={token} showToast={showToast} onNavigateToNewLock={() => setPage("locks-new")} />
          ) : null}
          {page === "locks-new" ? <NewLockPage showToast={showToast} onNavigate={setPage} /> : null}
          {page === "events" ? <EventsPage showToast={showToast} /> : null}
          {page === "settings" ? <SettingsPage /> : null}
        </AdminLayout>
      </AuthGuard>
      {toast ? (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-white shadow-lg ${
            toast.type === "ok" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      ) : null}
    </>
  );
}
