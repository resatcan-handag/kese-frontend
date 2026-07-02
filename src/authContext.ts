import { createContext, useContext } from "react";
import type { MeResponse } from "./api";

export interface AuthCtx {
  me: MeResponse | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthCtx>({
  me: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
