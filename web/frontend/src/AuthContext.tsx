import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Me } from "./types";
import { fetchMe, logout as apiLogout } from "./api";
import LoginModal from "./components/LoginModal";

interface AuthCtx {
  me: Me | null;
  refresh: () => Promise<void>;
  doLogout: () => Promise<void>;
  openLogin: () => void;
}

const Ctx = createContext<AuthCtx>({
  me: null,
  refresh: async () => {},
  doLogout: async () => {},
  openLogin: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const refresh = async () => {
    try {
      setMe(await fetchMe());
    } catch {
      setMe({ authenticated: false });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const doLogout = async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    await refresh();
  };

  return (
    <Ctx.Provider value={{ me, refresh, doLogout, openLogin: () => setShowLogin(true) }}>
      {children}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={async () => {
            await refresh();
            setShowLogin(false);
          }}
        />
      )}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
