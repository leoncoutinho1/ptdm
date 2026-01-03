import { createContext, useState, ReactNode, useEffect } from "react";
import { getAuthData } from "@/utils/apiHelper";

interface AuthContextType {
  isAuth: boolean;
  setIsAuth: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuth: false,
  setIsAuth: () => { }
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean>(() => !!localStorage.getItem("accessToken"));

  useEffect(() => {
    const syncAuth = async () => {
      const auth = await getAuthData();
      if (auth && !isAuth) {
        setIsAuth(true);
      }
    };
    syncAuth();
  }, [isAuth]);

  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
