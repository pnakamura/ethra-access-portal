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
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      weekday: 'short'
    });
  };

  // Calculate consecutive days streak
  const calculateStreak = (chartData: any[]) => {
    let currentStreak = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].atingiuMeta) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  };

  // Create complete 7-day data with proper grouping
  const processHydrationData = () => {
    // Create last 7 days date range
    const endDate = new Date();
    const dateRange = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      dateRange.push(date);
    }

    // Group existing data by date
    const groupedData = data.reduce((acc, item) => {
      const dateStr = item.date.includes('T') 
        ? item.date.split('T')[0] 
        : item.date.split(' ')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = 0;
      }
      acc[dateStr] += item.quantidade_ml;
      return acc;
    }, {} as Record<string, number>);

    // Create complete dataset for all 7 days
    return dateRange.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const quantidade = groupedData[dateStr] || 0;
      
      return {
        date: formatDate(dateStr),
        fullDate: dateStr,
        quantidade: Math.round(quantidade),
        meta: metaAgua,
        atingiuMeta: quantidade >= metaAgua,
        percentualMeta: metaAgua > 0 ? Math.round((quantidade / metaAgua) * 100) : 0
      };
    });
  };

  const chartData = processHydrationData();
  
  // Calculate statistics
  const totalDays = chartData.length;
  const daysWithData = chartData.filter(d => d.quantidade > 0).length;
  const averageHydration = chartData.length > 0 ? 
    Math.round(chartData.reduce((sum, item) => sum + item.quantidade, 0) / totalDays) : 0;
  const daysMetaReached = chartData.filter(d => d.atingiuMeta).length;
  const streak = calculateStreak(chartData);

  return (
    <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Hidratação Semanal
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span>Média: {averageHydration}ml</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Meta atingida: {daysMetaReached}/{totalDays} dias</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-primary font-medium">
              🔥 {streak} dias seguidos
            </div>
          )}
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
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
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
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const percentage = props.payload?.percentualMeta || 0;
                    return [
                      `${value}ml (${percentage}%)`, 
                      props.payload?.atingiuMeta ? '✅ Meta Atingida' : '💧 Consumo'
                    ];
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <ReferenceLine 
                  y={metaAgua} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ 
                    value: `Meta: ${metaAgua}ml`, 
                    position: "top",
                    style: { fontSize: '11px', fill: 'hsl(var(--destructive))' }
                  }}
                />
                <Bar 
                  dataKey="quantidade" 
                  fill="url(#waterGradient)"
                  radius={[4, 4, 0, 0]}
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}