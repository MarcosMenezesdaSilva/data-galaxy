import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Cloud,
  Server,
  Boxes,
  MessageSquare,
  Zap,
  GitBranch,
  Cpu,
  LineChart,
  ShieldCheck,
  LayoutDashboard,
  Rocket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Status = "Implementado" | "Simulado no MVP" | "Planejado" | "Integração futura";

const statusColor: Record<Status, string> = {
  Implementado:
    "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/30",
  "Simulado no MVP":
    "bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/30",
  Planejado:
    "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  "Integração futura": "bg-muted text-muted-foreground border-border",
};

interface Comp {
  nome: string;
  status: Status;
  icon?: LucideIcon;
}
interface Camada {
  titulo: string;
  icon: LucideIcon;
  cor: string;
  comps: Comp[];
}

const CAMADAS: Camada[] = [
  {
    titulo: "Fontes de dados",
    icon: Database,
    cor: "var(--info)",
    comps: [
      { nome: "ServiceNow", status: "Integração futura" },
      { nome: "APIs internas", status: "Integração futura" },
      { nome: "Web scraping", status: "Planejado" },
      { nome: "Documentos", status: "Planejado" },
      { nome: "Excel / CSV manual", status: "Implementado" },
      { nome: "Bancos de dados", status: "Integração futura" },
    ],
  },
  {
    titulo: "Orquestração e ingestão",
    icon: Boxes,
    cor: "var(--accent-orange)",
    comps: [
      { nome: "Azure Data Factory", status: "Integração futura" },
      { nome: "Airbyte", status: "Planejado" },
    ],
  },
  {
    titulo: "Streaming",
    icon: Zap,
    cor: "var(--warning)",
    comps: [
      { nome: "Apache Kafka", status: "Integração futura" },
      { nome: "Apache Flink", status: "Integração futura" },
    ],
  },
  {
    titulo: "Processamento e armazenamento",
    icon: Server,
    cor: "var(--brand)",
    comps: [
      { nome: "Apache Spark", status: "Planejado" },
      { nome: "Databricks", status: "Integração futura" },
      { nome: "Delta Lake", status: "Planejado" },
      { nome: "MLflow", status: "Planejado" },
      { nome: "Unity Catalog", status: "Planejado" },
      { nome: "IndexedDB (local)", status: "Implementado" },
    ],
  },
  {
    titulo: "Machine Learning",
    icon: Cpu,
    cor: "var(--info)",
    comps: [
      { nome: "AutoETS (volume)", status: "Simulado no MVP" },
      { nome: "Seasonal Naive (baseline)", status: "Simulado no MVP" },
      { nome: "XGBoost (risco OLA)", status: "Planejado" },
      { nome: "SHAP (explicabilidade)", status: "Planejado" },
      { nome: "K-Means (clusters)", status: "Planejado" },
    ],
  },
  {
    titulo: "Notificação",
    icon: MessageSquare,
    cor: "var(--accent-orange)",
    comps: [
      { nome: "Twilio", status: "Integração futura" },
      { nome: "E-mail", status: "Simulado no MVP" },
      { nome: "Microsoft Teams", status: "Simulado no MVP" },
      { nome: "SMS", status: "Simulado no MVP" },
      { nome: "API", status: "Simulado no MVP" },
    ],
  },
  {
    titulo: "Consumo",
    icon: LineChart,
    cor: "var(--success)",
    comps: [
      { nome: "FastAPI", status: "Planejado" },
      { nome: "Power BI", status: "Integração futura" },
      { nome: "Microsoft Fabric", status: "Integração futura" },
      { nome: "Grafana", status: "Planejado" },
      { nome: "Portal Data Galaxy (este MVP)", status: "Implementado" },
    ],
  },
  {
    titulo: "DevOps e governança",
    icon: ShieldCheck,
    cor: "var(--info)",
    comps: [
      { nome: "Azure DevOps", status: "Integração futura" },
      { nome: "GitHub", status: "Implementado" },
      { nome: "Docker", status: "Planejado" },
    ],
  },
];

const ROADMAP = [
  {
    sprint: "MVP atual",
    titulo: "Portal frontend com IndexedDB, importação e ciclo AIOps demonstrativo",
    icon: LayoutDashboard,
    cor: "var(--brand)",
  },
  {
    sprint: "Próxima",
    titulo: "Integração com ServiceNow e ingestão via Azure Data Factory",
    icon: GitBranch,
    cor: "var(--accent-orange)",
  },
  {
    sprint: "Futura",
    titulo: "Modelos AutoETS/XGBoost em produção (MLflow + Databricks)",
    icon: Cpu,
    cor: "var(--info)",
  },
  {
    sprint: "Escala",
    titulo: "Streaming com Kafka/Flink + notificações Twilio + Power BI",
    icon: Cloud,
    cor: "var(--success)",
  },
  {
    sprint: "Governança",
    titulo: "Unity Catalog, políticas de OLA por produto e observabilidade full-stack",
    icon: ShieldCheck,
    cor: "var(--warning)",
  },
];

export const Route = createFileRoute("/_app/arquitetura")({
  head: () => ({ meta: [{ title: "Arquitetura e Roadmap — Data Galaxy" }] }),
  component: ArqPage,
});

function ArqPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Arquitetura e Roadmap"
        subtitle="Componentes projetados nas sprints anteriores · status atual e evolução planejada"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {CAMADAS.map((c) => (
          <Card key={c.titulo} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="rounded-md p-2"
                style={{
                  background: `color-mix(in oklab, ${c.cor} 15%, transparent)`,
                  color: c.cor,
                }}
              >
                <c.icon className="h-4 w-4" />
              </div>
              <div className="font-semibold text-sm">{c.titulo}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.comps.map((comp) => (
                <div
                  key={comp.nome}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${statusColor[comp.status]}`}
                >
                  {comp.nome}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-4 w-4 text-primary" />
          <div className="font-semibold text-sm">Roadmap</div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {ROADMAP.map((r) => (
            <div key={r.sprint} className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <r.icon className="h-4 w-4" style={{ color: r.cor }} />
                <Badge variant="outline" className="text-[10px]">
                  {r.sprint}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed">{r.titulo}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 bg-muted/40">
        <div className="text-sm font-semibold mb-2">Legenda de status</div>
        <div className="flex flex-wrap gap-2">
          {(["Implementado", "Simulado no MVP", "Planejado", "Integração futura"] as Status[]).map(
            (s) => (
              <div
                key={s}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${statusColor[s]}`}
              >
                {s}
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}
