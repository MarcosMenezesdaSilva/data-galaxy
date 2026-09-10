// Catálogo único de itens de navegação do app — usado pela sidebar
// (AppLayout) e pela tela de controle de acesso (Usuários), pra não ter duas
// listas de rotas que podem ficar dessincronizadas.
import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Bell,
  Wrench,
  CheckCircle2,
  GitBranch,
  BookOpen,
  Database,
  Settings as SettingsIcon,
  Bot,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: "/dashboard", label: "Central de Operações", icon: LayoutDashboard },
  { to: "/assistente", label: "Assistente", icon: Bot },
  { to: "/incidentes", label: "Incidentes", icon: AlertTriangle },
  { to: "/previsoes", label: "Previsões", icon: TrendingUp },
  { to: "/riscos-ola", label: "Riscos de OLA", icon: ShieldAlert },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/correcoes", label: "Ações Corretivas", icon: Wrench },
  { to: "/validacao", label: "Validação de Correções", icon: CheckCircle2 },
  { to: "/problemas", label: "Problemas", icon: GitBranch },
  { to: "/conhecimento", label: "Conhecimento", icon: BookOpen },
  { to: "/dados", label: "Dados", icon: Database },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: SettingsIcon },
];

// "/usuarios" fica de fora de propósito: só o Admin (perfil fixo, "todas")
// tem essa tela — nunca é atribuível a um usuário customizado, pra evitar
// que alguém sem ser Admin consiga se auto-promover dando acesso a si mesmo.
export const ROTAS_ATRIBUIVEIS = NAV.filter((item) => item.to !== "/usuarios");
