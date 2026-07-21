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
  const [seeded, setSeeded] = useState(false);
  const { theme, toggleTheme, perfil, setPerfil, modo } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const totalIncidentes = useLiveQuery(() => db.incidentes.count(), []);

  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true));
  }, []);

  useEffect(() => {
    if (!perfil) navigate({ to: "/login" });
  }, [perfil, navigate]);

  const user = perfil ? USUARIOS[perfil] : USUARIOS.admin;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 h-screen shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-[width] duration-200",
            collapsed ? "w-[68px]" : "w-[248px]",
          )}
        >
          <div
            className={cn(
              "flex items-center h-16 px-3 border-b border-sidebar-border",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <BrandMark /> : <BrandWordmark />}
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {NAV.map((item) => {
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
          <div className="p-2 border-t border-sidebar-border">
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
            <div className="relative w-full max-w-md">
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
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notificações"
                className="relative rounded-full"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              </Button>
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
                  <DropdownMenuItem
                    onClick={() => {
                      setPerfil(null);
                      navigate({ to: "/login" });
                    }}
                  >
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
