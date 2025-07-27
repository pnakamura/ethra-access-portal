import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

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
  
  // Calculate trend for small datasets
  const getTrendData = () => {
    if (chartData.length < 2) return chartData;
    
    // For small datasets, show trend line
    const trend = chartData.map((point, index) => ({
      ...point,
      trend: firstWeight + (weightChange * index) / (chartData.length - 1)
    }));
    
    return trend;
  };

  const trendData = getTrendData();
  const progressToGoal = metaPeso ? ((currentWeight - metaPeso) / Math.abs(firstWeight - metaPeso)) * 100 : 0;

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
        {chartData.length > 0 && (
          <div className="space-y-1">
            {chartData.length > 1 && (
              <div className="text-sm text-muted-foreground">
                Variação: 
                <span className={`ml-1 font-medium ${weightChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                </span>
              </div>
            )}
            {metaPeso && currentWeight && (
              <div className="text-sm text-muted-foreground">
                Até a meta: 
                <span className={`ml-1 font-medium ${currentWeight > metaPeso ? 'text-red-500' : 'text-green-500'}`}>
                  {(currentWeight - metaPeso).toFixed(1)}kg
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum registro de peso encontrado</p>
              <p className="text-sm">Registre seu peso para acompanhar a evolução</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  className="text-muted-foreground" 
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'peso') return [`${value}kg`, 'Peso Atual'];
                    if (name === 'trend') return [`${value}kg`, 'Tendência'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                {metaPeso && (
                  <ReferenceLine 
                    y={metaPeso} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: `Meta: ${metaPeso}kg`, 
                      position: "top",
                      style: { fontSize: '11px', fill: 'hsl(var(--destructive))' }
                    }}
                  />
                )}
                {/* Trend line for datasets with few points */}
                {chartData.length > 1 && chartData.length < 5 && (
                  <Line 
                    type="linear" 
                    dataKey="trend" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={false}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy } = props;
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={6}
                        fill="hsl(var(--primary))"
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: 'hsl(var(--primary))', 
                    strokeWidth: 3,
                    fill: 'hsl(var(--background))'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}