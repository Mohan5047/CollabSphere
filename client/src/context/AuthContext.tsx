import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authService,
  getAuthToken,
  setAuthToken,
  ApiClientError,
} from "../services/api";
import type { AuthResponse, User, UserRole } from "../types";

// ============================================================================
// STORAGE KEYS & JWT HELPER
// ============================================================================

const USER_STORAGE_KEY = "collabsphere_user";

interface JwtPayload {
  id?: number;
  email?: string;
  role?: UserRole;
  exp?: number;
  iat?: number;
}

/**
 * Safely decodes a JWT payload on the client solely to check token expiration
 * and basic identity claims. Actual authorization is enforced by the backend.
 */
const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  if (!payload.exp) return false;
  // exp is in seconds; add a 5-second safety buffer
  return Date.now() >= (payload.exp - 5) * 1000;
};

const sanitizeUser = (rawUser: User | undefined | null): User | null => {
  if (!rawUser || typeof rawUser.id === "undefined") return null;
  return {
    id: Number(rawUser.id),
    full_name: rawUser.full_name || "",
    email: rawUser.email || "",
    role: rawUser.role || "student",
    profile_picture: rawUser.profile_picture ?? null,
    created_at: rawUser.created_at,
  };
};

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeUser(JSON.parse(raw) as User);
  } catch {
    return null;
  }
};

const setStoredUser = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitizeUser(user)));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
};

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUserState] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAuthToken(null);
    setStoredUser(null);
    setTokenState(null);
    setUserState(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const activeToken = getAuthToken();

    if (!activeToken || isTokenExpired(activeToken)) {
      logout();
      return null;
    }

    try {
      const response = await authService.getProfile();
      const fetchedUser = sanitizeUser(response.profile || response.user);

      if (fetchedUser) {
        setUserState(fetchedUser);
        setStoredUser(fetchedUser);
        setTokenState(activeToken);
        return fetchedUser;
      }

      logout();
      return null;
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
        return null;
      }

      // If network error occurs while offline, fallback to decoded/cached user
      const cached = getStoredUser();
      if (cached) {
        setUserState(cached);
        return cached;
      }

      const decoded = decodeJwtPayload(activeToken);
      if (decoded?.id && decoded?.email) {
        const fallbackUser = sanitizeUser({
          id: decoded.id,
          full_name: decoded.email.split("@")[0],
          email: decoded.email,
          role: decoded.role || "student",
        });
        setUserState(fallbackUser);
        return fallbackUser;
      }

      logout();
      return null;
    }
  }, [logout]);

  // Initialize and verify session on application mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = getAuthToken();

      if (!storedToken) {
        if (isMounted) {
          setUserState(null);
          setTokenState(null);
          setIsLoading(false);
        }
        return;
      }

      if (isTokenExpired(storedToken)) {
        if (isMounted) {
          logout();
          setIsLoading(false);
        }
        return;
      }

      await refreshUser();

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [logout, refreshUser]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.login({
          email: credentials.email.trim(),
          password: credentials.password,
        });

        if (!response.success || !response.token) {
          const message = response.message || "Login failed. Please try again.";
          setError(message);
          throw new ApiClientError(message, 401);
        }

        const cleanUser = sanitizeUser(response.user || response.profile);
        setAuthToken(response.token);
        setTokenState(response.token);

        if (cleanUser) {
          setUserState(cleanUser);
          setStoredUser(cleanUser);
        } else {
          await refreshUser();
        }

        return response;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to sign in. Please check your credentials.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUser]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.register({
          full_name: data.full_name.trim(),
          email: data.email.trim(),
          password: data.password,
          role: data.role || "student",
        });

        if (!response.success) {
          const message =
            response.message || "Registration failed. Please try again.";
          setError(message);
          throw new ApiClientError(message, 400);
        }

        // If backend returns a token directly on registration, persist session
        if (response.token) {
          const cleanUser = sanitizeUser(response.user || response.profile);
          setAuthToken(response.token);
          setTokenState(response.token);
          if (cleanUser) {
            setUserState(cleanUser);
            setStoredUser(cleanUser);
          }
        }

        return response;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to complete registration.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const isAuthenticated = Boolean(
    token && user && !isTokenExpired(token)
  );

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      loading: isLoading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
    }),
    [
      user,
      token,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK: useAuth()
// ============================================================================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
