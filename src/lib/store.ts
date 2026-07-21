import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Perfil = "gestor" | "tecnico" | "admin";

export interface Usuario {
  id: Perfil;
  nome: string;
  cargo: string;
  iniciais: string;
}

export const USUARIOS: Record<Perfil, Usuario> = {
  gestor: { id: "gestor", nome: "Camila Oliveira", cargo: "Gestora de Operações", iniciais: "CO" },
  tecnico: {
    id: "tecnico",
    nome: "Guilherme Santos",
    cargo: "Operações / Técnico",
    iniciais: "GS",
  },
  admin: { id: "admin", nome: "Marcos Menezes", cargo: "Administrador", iniciais: "MM" },
};

export interface FaixasRisco {
  baixoAte: number;
  medioAte: number;
  altoAte: number;
  criticoAte: number;
}

export const FAIXAS_RISCO_PADRAO: FaixasRisco = {
  baixoAte: 29,
  medioAte: 59,
  altoAte: 79,
  criticoAte: 100,
};

interface AppState {
  theme: "light" | "dark";
  perfil: Perfil | null;
  modo: "demo" | "importado";
  faixasRisco: FaixasRisco;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setPerfil: (p: Perfil | null) => void;
  setModo: (m: "demo" | "importado") => void;
  setFaixasRisco: (f: FaixasRisco) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "light",
      perfil: null,
      modo: "demo",
      faixasRisco: FAIXAS_RISCO_PADRAO,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setPerfil: (perfil) => set({ perfil }),
      setModo: (modo) => set({ modo }),
      setFaixasRisco: (faixasRisco) => set({ faixasRisco }),
    }),
    { name: "data-galaxy-app" },
  ),
);
