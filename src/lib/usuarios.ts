// Usuários demonstrativos criados pelo Admin — mesmo modelo dos 3 perfis
// fixos (gestor/tecnico/admin definidos em store.ts): sem senha, escolhidos
// na tela de login. A diferença é que a lista de telas que cada um acessa é
// configurável pelo Admin em vez de fixa no código, e fica persistida no
// IndexedDB (tabela `usuarios`) em vez de hardcoded.
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { USUARIOS, type Perfil } from "./store";
import { ROTAS_POR_PERFIL } from "./permissions";
import type { UsuarioCustom } from "./types";

// Deriva "CO" de "Camila Oliveira" — primeira letra do primeiro e do último
// nome, mesmo padrão já usado nos 3 perfis fixos.
export function gerarIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function gerarId(): string {
  return `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface CriarUsuarioInput {
  nome: string;
  cargo: string;
  rotas: string[];
}

export async function criarUsuario(input: CriarUsuarioInput): Promise<UsuarioCustom> {
  const usuario: UsuarioCustom = {
    id: gerarId(),
    nome: input.nome.trim(),
    cargo: input.cargo.trim(),
    iniciais: gerarIniciais(input.nome),
    rotas: input.rotas,
    criadoEm: new Date().toISOString(),
  };
  await db.usuarios.add(usuario);
  return usuario;
}

export async function excluirUsuario(id: string): Promise<void> {
  await db.usuarios.delete(id);
}

export async function atualizarRotasUsuario(id: string, rotas: string[]): Promise<void> {
  await db.usuarios.update(id, { rotas });
}

/** `undefined` enquanto a tabela ainda não carregou pela primeira vez. */
export function useUsuariosCustom(): UsuarioCustom[] | undefined {
  return useLiveQuery(() => db.usuarios.orderBy("nome").toArray(), []);
}

function ehPerfilFixo(perfil: string): perfil is Perfil {
  return perfil in ROTAS_POR_PERFIL;
}

/**
 * Resolve o conjunto de rotas acessíveis pro `perfil` logado agora.
 *
 * - "todas" / lista fixa → perfil fixo (gestor/tecnico/admin), resolvido na
 *   hora, sem depender do IndexedDB.
 * - lista salva → usuário customizado encontrado na tabela `usuarios`.
 * - `null` → resolvido e SEM acesso (perfil customizado que não existe mais,
 *   ou ninguém logado). Só nesse caso vale bloquear/redirecionar.
 * - `undefined` → ainda não sabemos (tabela `usuarios` carregando pela
 *   primeira vez) — não deve ser tratado como "sem acesso".
 */
export function useRotasPermitidas(perfil: string | null): string[] | "todas" | null | undefined {
  const customUsers = useUsuariosCustom();
  if (!perfil) return null;
  if (ehPerfilFixo(perfil)) return ROTAS_POR_PERFIL[perfil];
  if (customUsers === undefined) return undefined;
  const custom = customUsers.find((u) => u.id === perfil);
  return custom ? custom.rotas : null;
}

export interface UsuarioDisplay {
  nome: string;
  cargo: string;
  iniciais: string;
}

/** Resolve nome/cargo/iniciais pra exibir no header — perfil fixo ou customizado. */
export function useUsuarioAtual(perfil: string | null): UsuarioDisplay | null | undefined {
  const customUsers = useUsuariosCustom();
  if (!perfil) return null;
  if (ehPerfilFixo(perfil)) return USUARIOS[perfil];
  if (customUsers === undefined) return undefined;
  const custom = customUsers.find((u) => u.id === perfil);
  return custom ? { nome: custom.nome, cargo: custom.cargo, iniciais: custom.iniciais } : null;
}
