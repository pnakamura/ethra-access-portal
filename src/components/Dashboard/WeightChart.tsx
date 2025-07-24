import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";

interface WeightData {
  data_registro: string;
  peso_kg: number;
}

interface WeightChartProps {
  data: WeightData[];
  metaPeso?: number;
  period: "7d" | "30d" | "90d";
  onPeriodChange: (period: "7d" | "30d" | "90d") => void;
}

export function WeightChart({ data, metaPeso, period, onPeriodChange }: WeightChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const chartData = data.map(item => ({
    date: formatDate(item.data_registro),
    peso: Number(item.peso_kg),
  }));

  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].peso : 0;
  const firstWeight = chartData.length > 0 ? chartData[0].peso : 0;
  const weightChange = currentWeight - firstWeight;

  return (
    <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Evolução do Peso</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={period === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("7d")}
            >
              7d
            </Button>
            <Button
              variant={period === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("30d")}
            >
              30d
            </Button>
            <Button
              variant={period === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("90d")}
            >
              90d
            </Button>
          </div>
        </div>
        {chartData.length > 1 && (
          <div className="text-sm text-muted-foreground">
            Variação: 
            <span className={`ml-1 font-medium ${weightChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)}kg
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis 
                className="text-muted-foreground" 
                fontSize={12}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value}kg`, 'Peso']}
              />
              {metaPeso && (
                <ReferenceLine 
                  y={metaPeso} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ value: `Meta: ${metaPeso}kg`, position: "top" }}
                />
              )}
              <Line 
                type="monotone" 
                dataKey="peso" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}