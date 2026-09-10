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
  // Guarda o id de um dos 3 perfis fixos (Perfil) OU o id de um usuário
  // customizado criado pelo Admin (tabela `usuarios` do IndexedDB) — por
  // isso é `string`, mais largo que `Perfil`. Resolvido pra um dos dois
  // significados via useRotasPermitidas()/useUsuarioAtual() (src/lib/usuarios.ts).
  perfil: string | null;
  modo: "demo" | "importado";
  faixasRisco: FaixasRisco;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setPerfil: (p: string | null) => void;
  setModo: (m: "demo" | "importado") => void;
  setFaixasRisco: (f: FaixasRisco) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      // Escuro é a leitura fiel da identidade ("preto como espaço"); o tema
      // claro continua disponível pelo toggle. Quem já tem preferência salva
      // mantém a dele — o persist do zustand sobrescreve este default.
      theme: "dark",
      perfil: null,
      modo: "importado",
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
