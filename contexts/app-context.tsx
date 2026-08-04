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
  type ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  username?: string;
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
  apiFetch: (
    path: string,
    options?: { method?: string; body?: any; _retry?: boolean },
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendUrl, setBackendUrl] = useState(
    process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://invoicing.dimeconsultants.africa",
  );
  const [isInitializing, setIsInitializing] = useState(true);

  // Helper: Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log("🔄 Refreshing token...");
      const response = await fetch(`${backendUrl}/api/auth/refresh/`, {
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
          return true;
        }
      }
      console.log("❌ Token refresh failed");
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  };

  // Main API fetch function
  const apiFetch = async (
    path: string,
    options: {
      method?: string;
      body?: any;
      _retry?: boolean;
    } = {},
  ) => {
    const url = `${backendUrl}/api/${path}`;
    const headers: Record<string, string> = {};

    // Add Bearer token if available
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
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
    });

    // If 401 and we haven't retried yet, try to refresh token
    if (response.status === 401 && accessToken && !options._retry) {
      console.log("🔐 401 detected, attempting token refresh...");
      const refreshed = await refreshToken();
      if (refreshed && accessToken) {
        // Retry with new token
        const retryOptions = { ...options, _retry: true };
        const retryHeaders = { ...headers };
        retryHeaders.Authorization = `Bearer ${accessToken}`;

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
    const url = `${backendUrl}/api/auth/${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const tokenToUse = options.token || accessToken;
    if (tokenToUse) {
      headers.Authorization = `Bearer ${tokenToUse}`;
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      credentials: "include",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401 && accessToken && !options._retry) {
      console.log("🔐 Auth 401, refreshing token...");
      const refreshed = await refreshToken();
      if (refreshed && accessToken) {
        const retryOptions = { ...options, _retry: true };
        const retryHeaders = { ...headers };
        retryHeaders.Authorization = `Bearer ${accessToken}`;

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
  const fetchUserProfile = async () => {
    if (demoMode) return;

    try {
      const response = await apiFetch("auth/profile/");

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

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log("🔐 Login attempt for:", email);

      const response = await fetch(`${backendUrl}/api/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      console.log("📊 Response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.detail || errorData.message || "Login failed";
        } catch (e) {
          console.error("Failed to parse error response");
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Login successful");

      if (data.token) {
        setAccessToken(data.token);
      }

      if (data.user) {
        setUserState(data.user);
        setIsAuthenticated(true);
      }

      // Ensure we have full profile
      await fetchUserProfile();
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
      await fetch(`${backendUrl}/api/auth/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUserState(null);
      setAccessToken(null);
      setIsAuthenticated(false);
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
        await fetchUserProfile();
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
        const response = await fetch(`${backendUrl}/api/health/`, {
          method: "GET",
          credentials: "include",
          signal: AbortSignal.timeout(5000),
        });
        setBackendConnected(response.ok);
      } catch {
        setBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [backendUrl, demoMode]);

  if (isInitializing) {
    return null; // Or a loading spinner
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
