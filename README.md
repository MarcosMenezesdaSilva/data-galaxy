# Data Galaxy

MVP de AIOps para previsão de incidentes e risco de violação de OLA/SLA, desenvolvido para o **Challenge Locaweb × FIAP 2026** (Enterprise Challenge — Data Science, AI, Analytics, Cloud & Data Platforms).

Time **NexusOps**.

## O problema

A Locaweb registra dezenas de milhares de incidentes de TI por trimestre. O objetivo do Data Galaxy é sair do modelo reativo (corrigir depois que o incidente já quebrou o SLA) para um modelo preditivo: antecipar volume de incidentes (D+1 e D+7), sinalizar risco de violação de OLA antes que aconteça, e apoiar decisões operacionais (onde agir, quais produtos/equipes exigem atenção).

## O que a aplicação faz

Roda 100% no navegador — sem backend, sem envio de dados a serviços externos. Os dados ficam em IndexedDB local (via Dexie).

- **Modo Demonstração**: inicia com ~1.000 incidentes sintéticos, com a mesma estrutura da base real (prioridades, grupos, produtos, sazonalidade set-dez/2025, casos "Sem Intervenção", nulos em campos opcionais).
- **Importação da base real**: aceita o arquivo tratado (`incidentes_tratados.txt`, delimitado por `;`), a base de staging (`.csv`) e o bruto (`.xlsx`, em modo preview). Importação em lotes com barra de progresso, sem travar a interface, com relatório de validação antes de confirmar.
- **Central de Operações / Dashboard**: KPIs, tendência diária, previsão determinística (Seasonal Naive) de volume D+1/D+7.
- **Riscos de OLA**: score 0-100 com faixas Baixo/Médio/Alto/Crítico e explicação por fator (regras locais, sem IA externa).
- **Qualidade dos Dados** (`/qualidade-dados`): cobertura por coluna, duplicidades, datas/durações inválidas, % de registros aptos para análise.
- **Linhagem dos Dados** (`/linhagem-dados`): fluxo Raw → Staging → Processed → IndexedDB → Dashboards, com datas reais de processamento.
- **Configurações**: regras de OLA demonstrativas editáveis (rotuladas como parâmetros sujeitos à validação da Locaweb).
- Backup local (exportar/limpar dados), tema claro/escuro com identidade visual inspirada na Locaweb.

Todo dado sintético é marcado internamente como `origem_dado: "DEMONSTRACAO"`; dados vindos de importação real são `origem_dado: "IMPORTADO"` — nunca são misturados sem identificação.

## Stack

React 19 · TanStack Start/Router · Tailwind CSS v4 + shadcn/ui · Dexie (IndexedDB) · Zustand · Recharts · Papaparse.

## Como rodar localmente

```bash
bun install     # ou npm install
bun run dev     # ou npm run dev
```

Acesse `http://localhost:3000`. Outros comandos: `bun run build`, `bun run lint`, `bun run format`.

## Estrutura

```
src/
  routes/     # páginas (TanStack Router, arquivo = rota)
  lib/        # tipos, regras de negócio, geração de dados demo, Dexie, import/qualidade
  components/ # componentes visuais (layout, cards, gauges, ui/ do shadcn)
```

## Contexto do desafio

Projeto acadêmico do curso de Tecnologia em Data Science (FIAP), parceria com a Locaweb — desafio de AIOps com previsão de incidentes e tendências operacionais. Este repositório contém a parte de aplicação/MVP do projeto; a documentação completa (dicionário de dados, apresentações das sprints, EDA) fica nos entregáveis do grupo em cada sprint.
