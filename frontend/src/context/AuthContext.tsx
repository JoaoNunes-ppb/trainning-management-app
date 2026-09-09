import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { client } from "@/api/client";
import { toast } from "sonner";

interface AuthState {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USERNAME_KEY = "auth_username";

function readStoredAuth(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USERNAME_KEY);
    if (token && username) {
      return { token, username, isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return { token: null, username: null, isAuthenticated: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedAuth] = useState(readStoredAuth);
  const [authState, setAuthState] = useState<AuthState>(storedAuth);
  const [isLoading, setIsLoading] = useState(storedAuth.token !== null);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setAuthState({ token: null, username: null, isAuthenticated: false });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = "/login";
  }, [clearAuth]);

  useEffect(() => {
    if (!storedAuth.token) return;

    client
      .get("/auth/me", {
        headers: { Authorization: `Bearer ${storedAuth.token}` },
      })
      .then((res) => {
        setAuthState({
          token: storedAuth.token,
          username: res.data.username,
          isAuthenticated: true,
        });
      })
      .catch(() => {
        clearAuth();
        toast.error("Sessão expirada");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clearAuth, storedAuth]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await client.post("/auth/login", { username, password });
    const { token, username: user } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, user);
    setAuthState({ token, username: user, isAuthenticated: true });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...authState, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
