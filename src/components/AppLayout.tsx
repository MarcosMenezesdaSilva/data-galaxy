import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Bell,
  Wrench,
  CheckCircle2,
  GitBranch,
  RefreshCcw,
  BookOpen,
  Database,
  FileBarChart2,
  Network,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  LogOut,
  User as UserIcon,
  ClipboardCheck,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, USUARIOS } from "@/lib/store";
import { BrandMark, BrandWordmark } from "@/components/Brand";
import { ModoBadge } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { seedIfEmpty } from "@/lib/init";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { podeAcessar } from "@/lib/permissions";
import { useAlertas } from "@/lib/hooks";
import { SeveridadeBadge } from "@/components/Badges";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Central de Operações", icon: LayoutDashboard },
  { to: "/incidentes", label: "Incidentes", icon: AlertTriangle },
  { to: "/previsoes", label: "Previsões", icon: TrendingUp },
  { to: "/riscos-ola", label: "Riscos de OLA", icon: ShieldAlert },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/correcoes", label: "Ações Corretivas", icon: Wrench },
  { to: "/validacao", label: "Validação de Correções", icon: CheckCircle2 },
  { to: "/problemas", label: "Problemas", icon: GitBranch },
  { to: "/mudancas", label: "Mudanças", icon: RefreshCcw },
  { to: "/conhecimento", label: "Conhecimento", icon: BookOpen },
  { to: "/dados", label: "Gestão de Dados", icon: Database },
  { to: "/qualidade-dados", label: "Qualidade de Dados", icon: ClipboardCheck },
  { to: "/linhagem-dados", label: "Linhagem de Dados", icon: Waypoints },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { to: "/arquitetura", label: "Arquitetura", icon: Network },
  { to: "/configuracoes", label: "Configurações", icon: SettingsIcon },
] as const;

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const { theme, toggleTheme, perfil, setPerfil, modo } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const totalIncidentes = useLiveQuery(() => db.incidentes.count(), []);
  const alertas = useAlertas();
  const alertasRecentes = [...alertas]
    .sort((a, b) => +new Date(b.data_criacao) - +new Date(a.data_criacao))
    .slice(0, 6);
  const alertasNovos = alertas.filter((a) => a.status === "Novo").length;

  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true));
  }, []);

  useEffect(() => {
    if (!perfil) navigate({ to: "/login" });
  }, [perfil, navigate]);

  // Bloqueia acesso direto por URL a rotas fora do perfil atual (não basta
  // esconder do menu — também vale para links digitados ou trocar de perfil
  // estando numa tela restrita).
  useEffect(() => {
    if (perfil && !podeAcessar(perfil, pathname)) {
      toast.error("Este perfil não tem acesso a essa tela.");
      navigate({ to: "/dashboard" });
    }
  }, [perfil, pathname, navigate]);

  // Fecha o menu mobile ao navegar para outra tela.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const user = perfil ? USUARIOS[perfil] : USUARIOS.admin;
  const navVisivel = NAV.filter((item) => podeAcessar(perfil, item.to));

  function voltarParaSelecaoDePerfil() {
    setPerfil(null);
    navigate({ to: "/login" });
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Backdrop do menu mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — vira gaveta (drawer) em telas pequenas, fixa a partir de md (tablets/notebooks) */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            "md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 md:transition-[width]",
            collapsed ? "md:w-[68px]" : "md:w-[248px]",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={voltarParaSelecaoDePerfil}
                aria-label="Voltar para seleção de perfil"
                className={cn(
                  "flex items-center h-16 px-3 border-b border-sidebar-border w-full cursor-pointer hover:bg-sidebar-accent transition-colors",
                  collapsed && "justify-center px-0",
                )}
              >
                {collapsed ? <BrandMark /> : <BrandWordmark />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Voltar para seleção de perfil</TooltipContent>
          </Tooltip>
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {navVisivel.map((item) => {
              const active =
                pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
              const Icon = item.icon;
              const content = (
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    collapsed && "justify-center",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
              return collapsed ? (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.to}>{content}</div>
              );
            })}
          </nav>
          <div className="hidden md:block p-2 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-muted-foreground"
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
              {!collapsed && <span className="ml-2 text-xs">Recolher</span>}
            </Button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 backdrop-blur px-4 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 shrink-0 md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden w-full max-w-md sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar incidente, produto, grupo..." className="pl-9 h-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ModoBadge modo={modo} count={modo === "importado" ? totalIncidentes : undefined} />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Alternar tema"
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notificações"
                    className="relative rounded-full"
                  >
                    <Bell className="h-4 w-4" />
                    {alertasNovos > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>
                    Notificações{alertasNovos > 0 ? ` · ${alertasNovos} novas` : ""}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {alertasRecentes.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                      Nenhum alerta por aqui ainda.
                    </div>
                  ) : (
                    alertasRecentes.map((a) => (
                      <DropdownMenuItem
                        key={a.id_alerta}
                        className="flex flex-col items-start gap-1 py-2"
                        onClick={() => navigate({ to: "/alertas" })}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">{a.titulo}</span>
                          <SeveridadeBadge s={a.severidade} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {a.produto} · {fmtDateTime(a.data_criacao)}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/alertas" })}>
                    Ver todos os alertas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 pl-1.5 pr-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.iniciais}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left leading-tight">
                      <div className="text-xs font-medium">{user.nome}</div>
                      <div className="text-[10px] text-muted-foreground">{user.cargo}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Trocar de perfil</DropdownMenuLabel>
                  {Object.values(USUARIOS).map((u) => (
                    <DropdownMenuItem key={u.id} onClick={() => setPerfil(u.id)}>
                      <UserIcon className="h-4 w-4 mr-2" /> {u.nome}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {u.cargo.split("/")[0].trim()}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={voltarParaSelecaoDePerfil}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
            {seeded ? (
              <Outlet />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Carregando dados...
              </div>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
