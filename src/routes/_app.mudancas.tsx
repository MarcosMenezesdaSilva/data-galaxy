import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/Brand";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMudancas } from "@/lib/hooks";
import { fmtDate, fmtNumber } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";

export const Route = createFileRoute("/_app/mudancas")({
  head: () => ({ meta: [{ title: "Mudanças — Data Galaxy" }] }),
  component: MudancasPage,
});

function MudancasPage() {
  const mudancas = useMudancas();
  const chartData = mudancas.map((m) => ({
    id: m.id_mudanca,
    antes: m.incidentes_antes,
    depois: m.incidentes_depois,
    tipo: m.tipo,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mudanças"
        subtitle="Cadastro de deploys, releases, expansões e sua correlação com incidentes"
      />

      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Incidentes antes e depois da mudança</div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="id" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="antes"
                name="Antes"
                fill="var(--muted-foreground)"
                radius={[6, 6, 0, 0]}
              >
                <LabelList dataKey="antes" position="top" fontSize={10} fill="var(--foreground)" />
              </Bar>
              <Bar dataKey="depois" name="Depois" fill="var(--brand)" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="depois" position="top" fontSize={10} fill="var(--foreground)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Antes</TableHead>
              <TableHead className="text-right">Depois</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mudancas.map((m) => (
              <TableRow key={m.id_mudanca}>
                <TableCell className="font-mono text-xs">{m.id_mudanca}</TableCell>
                <TableCell>
                  <Badge variant="outline">{m.tipo}</Badge>
                </TableCell>
                <TableCell>{m.produto}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.grupo}</TableCell>
                <TableCell className="max-w-xs truncate text-sm">{m.descricao}</TableCell>
                <TableCell className="text-xs">{fmtDate(m.data)}</TableCell>
                <TableCell className="text-right">{fmtNumber(m.incidentes_antes)}</TableCell>
                <TableCell
                  className="text-right font-semibold"
                  style={{
                    color:
                      m.incidentes_depois > m.incidentes_antes
                        ? "var(--critical)"
                        : "var(--success)",
                  }}
                >
                  {fmtNumber(m.incidentes_depois)}
                </TableCell>
                <TableCell className="text-xs">{m.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
