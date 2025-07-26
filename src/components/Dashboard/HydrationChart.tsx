import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Droplets } from "lucide-react";

interface HydrationData {
  date: string;
  quantidade_ml: number;
}

interface HydrationChartProps {
  data: HydrationData[];
  metaAgua?: number;
}

export function HydrationChart({ data, metaAgua = 2000 }: HydrationChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Agrupar dados por dia
  const groupedData = data.reduce((acc, item) => {
    const date = item.date.split('T')[0]; // Pegar apenas a data
    const formattedDate = formatDate(date);
    
    if (!acc[formattedDate]) {
      acc[formattedDate] = 0;
    }
    acc[formattedDate] += item.quantidade_ml;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(groupedData).map(([date, quantidade]) => ({
    date,
    quantidade: Math.round(quantidade),
    meta: metaAgua,
  }));

  const averageHydration = chartData.length > 0 ? 
    chartData.reduce((sum, item) => sum + item.quantidade, 0) / chartData.length : 0;

  return (
    <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <CardTitle>Hidratação Semanal</CardTitle>
        <div className="text-sm text-muted-foreground">
          Média diária: {Math.round(averageHydration)}ml
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Droplets className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum registro de hidratação encontrado</p>
              <p className="text-sm">Registre seu consumo de água</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis className="text-muted-foreground" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}ml`, 'Consumo']}
                />
                <ReferenceLine 
                  y={metaAgua} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ value: `Meta: ${metaAgua}ml`, position: "top" }}
                />
                <Bar 
                  dataKey="quantidade" 
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}