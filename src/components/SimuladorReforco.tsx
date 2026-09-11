// Simulador "e se" — deixa explorar o impacto de reforçar um grupo em
// pessoas na probabilidade de violação de OLA dos riscos ativos daquele
// grupo. É uma SIMULAÇÃO ilustrativa (regra linear simples e explícita),
// não um modelo preditivo — segue o mesmo padrão de honestidade das
// badges "SIMULADO"/"PLANEJADO" já usadas na tela de Previsões: nunca
// aparenta ser um fato calculado sobre a base, sempre rotulado como
// estimativa.
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Users, Info } from "lucide-react";
import { useApp } from "@/lib/store";
import type { RiscoOla } from "@/lib/types";

// Redução linear por pessoa adicionada — estimativa ilustrativa e explícita,
// não derivada de um modelo estatístico. Piso de 5%: nenhuma simulação some
// o risco por completo, só reduz.
const REDUCAO_POR_PESSOA_PP = 6;
const PISO_PROBABILIDADE = 5;

export function SimuladorReforco({ riscosAtivos }: { riscosAtivos: RiscoOla[] }) {
  const faixasRisco = useApp((s) => s.faixasRisco);

  const grupos = useMemo(
    () => Array.from(new Set(riscosAtivos.map((r) => r.grupo))).sort(),
    [riscosAtivos],
  );
  const [grupo, setGrupo] = useState<string>(grupos[0] ?? "");
  const [pessoas, setPessoas] = useState(0);

  const grupoAtual = grupos.includes(grupo) ? grupo : (grupos[0] ?? "");
  const riscosDoGrupo = useMemo(
    () => riscosAtivos.filter((r) => r.grupo === grupoAtual),
    [riscosAtivos, grupoAtual],
  );

  const mediaAtual = riscosDoGrupo.length
    ? riscosDoGrupo.reduce((s, r) => s + r.probabilidade_violacao, 0) / riscosDoGrupo.length
    : 0;
  const criticosAtuais = riscosDoGrupo.filter(
    (r) => r.probabilidade_violacao > faixasRisco.altoAte,
  ).length;

  const reducaoTotal = pessoas * REDUCAO_POR_PESSOA_PP;
  const projetados = riscosDoGrupo.map((r) =>
    Math.max(PISO_PROBABILIDADE, r.probabilidade_violacao - reducaoTotal),
  );
  const mediaProjetada = projetados.length
    ? projetados.reduce((s, v) => s + v, 0) / projetados.length
    : 0;
  const criticosProjetados = projetados.filter((v) => v > faixasRisco.altoAte).length;

  if (grupos.length === 0) return null;

  return (
    <Card lit className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 t-h4">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Simulador — reforço de equipe
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Estimativa do impacto de reforçar um grupo no risco de OLA dos incidentes ativos dele.
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-[color:var(--warning)]/35 bg-[color:var(--warning)]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[color:var(--warning)]">
          Simulação
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Grupo</label>
            <Select value={grupoAtual} onValueChange={setGrupo}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Pessoas adicionais
              </span>
              <span className="font-mono text-foreground">+{pessoas}</span>
            </div>
            <Slider
              value={[pessoas]}
              onValueChange={(v) => setPessoas(v[0])}
              min={0}
              max={5}
              step={1}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CardContent className="rounded-md border border-border bg-[color:var(--surface-02)] p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Hoje — {grupoAtual}
            </div>
            <div className="mt-2 text-2xl font-semibold">{Math.round(mediaAtual)}%</div>
            <div className="text-xs text-muted-foreground">probabilidade média de violação</div>
            <div className="mt-2 text-sm">
              <b style={{ color: criticosAtuais > 0 ? "var(--critical)" : undefined }}>
                {criticosAtuais}
              </b>{" "}
              risco(s) crítico(s) de {riscosDoGrupo.length} ativo(s)
            </div>
          </CardContent>
          <CardContent className="rounded-md border border-[color:var(--brand-orange)]/35 bg-[color:var(--brand-orange-soft)] p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Com +{pessoas} pessoa(s)
            </div>
            <div className="mt-2 text-2xl font-semibold text-primary">
              {Math.round(mediaProjetada)}%
            </div>
            <div className="text-xs text-muted-foreground">probabilidade média estimada</div>
            <div className="mt-2 text-sm">
              <b>{criticosProjetados}</b> risco(s) crítico(s) estimado(s)
            </div>
          </CardContent>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          Estimativa ilustrativa: cada pessoa adicional reduz a probabilidade média de violação em{" "}
          {REDUCAO_POR_PESSOA_PP} pontos percentuais (piso de {PISO_PROBABILIDADE}%). Não é um
          modelo preditivo — serve para dimensionar a ordem de grandeza do impacto de reforçar uma
          equipe, não como um número exato.
        </span>
      </div>
    </Card>
  );
}
