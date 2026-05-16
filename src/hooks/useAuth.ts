import { useCallback, useState } from "react";
import { disconnectSocket } from "../lib/socket.js";

type Role = "admin" | "user" | null;

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("nilelock_token"));
  const [role, setRole] = useState<Role>(() => (localStorage.getItem("nilelock_role") as Role) || null);

  const login = useCallback((accessToken: string, refreshToken: string, userRole: string) => {
    localStorage.setItem("nilelock_token", accessToken);
    localStorage.setItem("nilelock_refresh", refreshToken);
    localStorage.setItem("nilelock_role", userRole);
    setToken(accessToken);
    setRole(userRole as Role);
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.removeItem("nilelock_token");
    localStorage.removeItem("nilelock_refresh");
    localStorage.removeItem("nilelock_role");
    setToken(null);
    setRole(null);
  }, []);

  return {
    token,
    role,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };
}
