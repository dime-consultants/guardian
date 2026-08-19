"use client";

declare const process: {
  env: {
    NEXT_PUBLIC_BACKEND_URL?: string;
    NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS?: string;
  };
};

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  phone?: string;
  organization?: number | null;
  organization_name?: string | null;
}

interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  department?: string;
  phone?: string;
}

interface SignupPayload {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  department: string;
  phone: string;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (patch: ProfileUpdatePayload) => Promise<User>;
   apiFetch: (
     path: string,
     options?: { method?: string; body?: any; _retry?: boolean; signal?: AbortSignal },
   ) => Promise<Response>;
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
  backendConnected: boolean;
  setBackendConnected: (value: boolean) => void;
  backendUrl: string;
  setBackendUrl: (value: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  // Mirrors accessToken so functions that set a new token and immediately
  // need it (e.g. login() fetching the profile right after) don't read the
  // stale value still captured in their own closure before React re-renders.
  const accessTokenRef = useRef<string | null>(null);
  const setAccessToken = (token: string | null) => {
    accessTokenRef.current = token;
    setAccessTokenState(token);
  };
  const [demoMode, setDemoMode] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendUrl, setBackendUrl] = useState(
    process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://invoicing.dimeconsultants.africa",
  );
  const [isInitializing, setIsInitializing] = useState(true);

  // Keep browser requests same-origin so preview and production do not depend on
  // the backend allowing every deployment origin through CORS.
  const apiUrl = (path: string) =>
    typeof window === "undefined"
      ? `${backendUrl}/api/${path}`
      : `/api/backend/${path}`;

  // Return the token as well as storing it so callers can use it before React re-renders.
  const refreshToken = async (): Promise<string | null> => {
    try {
      console.log("🔄 Refreshing token...");
      const response = await fetch(apiUrl("auth/refresh/"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log("✅ Token refreshed successfully");
          setAccessToken(data.token);
          return data.token;
        }
      }
      console.log("❌ Token refresh failed");
      return null;
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  };

  // Main API fetch function
  const apiFetch = async (
    path: string,
    options: {
      method?: string;
      body?: any;
      _retry?: boolean;
      signal?: AbortSignal;
    } = {},
  ) => {
    const url = apiUrl(path);
    const headers: Record<string, string> = {};

    // Add Bearer token if available
    if (accessTokenRef.current) {
      headers.Authorization = `Bearer ${accessTokenRef.current}`;
    }

    // Set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body: options.body
        ? options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
      signal: options.signal,
    });

    // If 401 and we haven't retried yet, try to refresh token
    if (response.status === 401 && accessTokenRef.current && !options._retry) {
      console.log("🔐 401 detected, attempting token refresh...");
      const refreshedToken = await refreshToken();
      if (refreshedToken) {
        // Retry with the token returned by refresh, not the stale state value.
        const retryOptions = { ...options, _retry: true };
        const retryHeaders = { ...headers };
        retryHeaders.Authorization = `Bearer ${refreshedToken}`;

        const retryResponse = await fetch(url, {
          method: options.method ?? "GET",
          credentials: "include",
          headers: retryHeaders,
          body: options.body
            ? options.body instanceof FormData
              ? options.body
              : JSON.stringify(options.body)
            : undefined,
        });
        return retryResponse;
      }
    }

    return response;
  };

  // Auth-specific fetch
  const authFetch = async (
    path: string,
    options: {
      method?: string;
      body?: any;
      token?: string;
      _retry?: boolean;
    } = {},
  ) => {
    const url = apiUrl(`auth/${path}`);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const tokenToUse = options.token || accessTokenRef.current;
    if (tokenToUse) {
      headers.Authorization = `Bearer ${tokenToUse}`;
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401 && accessTokenRef.current && !options._retry) {
      console.log("🔐 Auth 401, refreshing token...");
      const refreshedToken = await refreshToken();
      if (refreshedToken) {
        const retryOptions = { ...options, _retry: true };
        const retryHeaders = { ...headers };
        retryHeaders.Authorization = `Bearer ${refreshedToken}`;

        const retryResponse = await fetch(url, {
          method: options.method ?? "GET",
          credentials: "include",
          headers: retryHeaders,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        return retryResponse;
      }
    }

    return response;
  };

  // Fetch user profile
  const fetchUserProfile = async (
    signal?: AbortSignal,
    tokenOverride?: string | null,
  ) => {
    if (demoMode) return;

    try {
      const response = tokenOverride
        ? await fetch(apiUrl("auth/me/"), {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${tokenOverride}`,
              "Content-Type": "application/json",
            },
            signal,
          })
        : await apiFetch("auth/me/", { signal });

      if (response.ok) {
        const data = await response.json();
        setUserState(data);
        setIsAuthenticated(true);
        console.log("✅ User profile loaded");
        return;
      }

      if (response.status === 401) {
        console.log("ℹ️ Not authenticated");
        setUserState(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserState(null);
      setIsAuthenticated(false);
    }
  };

  // Update profile fields (PATCH /api/auth/me/)
  const updateUserProfile = async (
    patch: ProfileUpdatePayload,
  ): Promise<User> => {
    const response = await apiFetch("auth/me/", {
      method: "PATCH",
      body: patch,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const firstFieldError = Object.values(errorData)[0];
      throw new Error(
        errorData.detail ||
          (Array.isArray(firstFieldError) ? firstFieldError[0] : undefined) ||
          "Failed to update profile.",
      );
    }

    const data = await response.json();
    // UserProfileSerializer (PATCH response) omits name/role/status/lastActive —
    // merge onto existing state instead of replacing it, and recompute `name`
    // the same way the backend's UserSerializer.get_name() does.
    const updated: User = {
      ...user,
      ...data,
      name:
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        data.username ||
        user?.name ||
        "",
    };
    setUserState(updated);
    return updated;
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log("🔐 Login attempt for:", email);

      const response = await fetch(apiUrl("auth/login/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      console.log("📊 Response status:", response.status);

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = `Login failed (${response.status})`;

        try {
          const errorData = JSON.parse(responseText);
          const payload = errorData.error ?? errorData;
          const detail = payload.details;
          const fieldMessage = detail
            ? Object.values(detail).flat().find(Boolean)
            : undefined;
          errorMessage =
            payload.detail || payload.message || fieldMessage || errorMessage;
        } catch {
          if (responseText.trim()) {
            errorMessage = responseText.replace(/<[^>]*>/g, " ").trim();
          }
        }

        throw new Error(String(errorMessage));
      }

      const data = await response.json();
      console.log("✅ Login successful");

      let loginToken =
        data.access ?? data.access_token ?? data.token ?? data.tokens?.access ?? null;

      // Some backend versions return only the refresh cookie from login. Exchange
      // it immediately so the first login has an access token as well.
      if (!loginToken) {
        loginToken = await refreshToken();
      } else {
        setAccessToken(loginToken);
      }

      if (data.user) {
        setUserState(data.user);
        setIsAuthenticated(true);
      }

      // Use the token immediately; React state updates are asynchronous.
      await fetchUserProfile(undefined, loginToken);
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  // Signup function
  const signup = async (payload: SignupPayload) => {
    try {
      const response = await authFetch("signup/", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.password?.[0] || "Signup failed",
        );
      }

      await login(payload.email, payload.password);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch(apiUrl("auth/logout/"), {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUserState(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      setDemoMode(false);
      localStorage.setItem("kn-demo-mode", "false");
    }
  };

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    setIsAuthenticated(newUser !== null);
  };

  // Security flag
  const useLocalStorage =
    process.env.NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS === "true";

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedDemoMode = localStorage.getItem("kn-demo-mode");
      const savedBackendUrl = localStorage.getItem("kn-backend-url");

      if (savedDemoMode !== null) {
        setDemoMode(savedDemoMode === "true");
      }
      if (
        savedBackendUrl &&
        savedBackendUrl !== "https://invoicing.dimeconsultants.africa"
      ) {
        setBackendUrl(savedBackendUrl);
      }

      if (savedDemoMode === "true") {
        setUserState({
          id: "1",
          name: "Sarah Kimani",
          email: "s.kimani@kuehne-nagel.com",
          role: "admin",
          username: "sarah.kimani",
        });
        setIsAuthenticated(true);
        setIsInitializing(false);
        return;
      }

      if (!demoMode) {
        const startupToken = await refreshToken();
        await fetchUserProfile(AbortSignal.timeout(5000), startupToken);
      }

      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("kn-demo-mode", String(demoMode));
    if (demoMode && !isAuthenticated) {
      setIsAuthenticated(true);
      setUserState({
        id: "1",
        name: "Sarah Kimani",
        email: "s.kimani@kuehne-nagel.com",
        role: "admin",
        username: "sarah.kimani",
      });
    }
  }, [demoMode, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("kn-backend-url", backendUrl);
  }, [backendUrl]);

  // Check backend connection
  useEffect(() => {
    if (demoMode) {
      setBackendConnected(false);
      return;
    }

    const checkBackend = async () => {
      try {
        const response = await fetch(apiUrl("health/"), {
          method: "GET",
          credentials: "include",
          signal: AbortSignal.timeout(5000),
        });
        const health = await response.json().catch(() => null);
        setBackendConnected(
          response.ok &&
            health?.status !== "degraded" &&
            health?.database !== "error",
        );
      } catch {
        setBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [backendUrl, demoMode]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/15 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading Guardian...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        accessToken,
        login,
        signup,
        logout,
        setUser,
        fetchUserProfile,
        updateUserProfile,
        apiFetch,
        demoMode,
        setDemoMode,
        backendConnected,
        setBackendConnected,
        backendUrl,
        setBackendUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
