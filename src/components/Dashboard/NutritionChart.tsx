import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, Area, AreaChart } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Target } from "lucide-react";

interface NutritionData {
  data_registro: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}

interface NutritionChartProps {
  data: NutritionData[];
  period: "7d" | "30d";
  onPeriodChange: (period: "7d" | "30d") => void;
  metaCalorias?: number;
}

export function NutritionChart({ data, period, onPeriodChange, metaCalorias = 2000 }: NutritionChartProps) {
  const [activeChart, setActiveChart] = useState<"calories" | "macros">("calories");

  const formatDate = (dateStr: string) => {
    // Somar 1 dia para compensar o timezone UTC
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      weekday: 'short'
    });
  };

  // Improved data processing with better grouping and filling missing days
  const processChartData = () => {
    if (!data || data.length === 0) return [];

    // Create a complete date range for the period using UTC dates
    const days = period === "7d" ? 7 : 30;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0); // Start of the first day
    
    const dateRange = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Use local date string (YYYY-MM-DD) consistently
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateRange.push(`${year}-${month}-${day}`);
    }

    // Group existing data by date (extracting UTC date part)
    const groupedData = data.reduce((acc, item) => {
      const dateStr = item.data_registro.includes('T') 
        ? item.data_registro.split('T')[0] 
        : item.data_registro;
      
      if (!acc[dateStr]) {
        acc[dateStr] = { 
          calorias: 0, 
          proteinas: 0, 
          carboidratos: 0, 
          gorduras: 0 
        };
      }
      
      acc[dateStr].calorias += Number(item.calorias) || 0;
      acc[dateStr].proteinas += Number(item.proteinas) || 0;
      acc[dateStr].carboidratos += Number(item.carboidratos) || 0;
      acc[dateStr].gorduras += Number(item.gorduras) || 0;
      
      return acc;
    }, {} as Record<string, any>);

    // Create complete dataset with all dates
    return dateRange.map(dateStr => {
      const dayData = groupedData[dateStr] || { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
      
      return {
        date: formatDate(dateStr),
        fullDate: dateStr,
        calorias: Math.round(dayData.calorias),
        proteinas: Math.round(dayData.proteinas),
        carboidratos: Math.round(dayData.carboidratos),
        gorduras: Math.round(dayData.gorduras),
        meta: metaCalorias,
        atingiuMeta: dayData.calorias >= metaCalorias * 0.8 // 80% da meta
      };
    });
  };

  const chartData = processChartData();
  
  // Calculate statistics
  const totalDays = chartData.length;
  const daysWithData = chartData.filter(d => d.calorias > 0).length;
  const averageCalories = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, item) => sum + item.calorias, 0) / totalDays)
    : 0;
  const metaPercentage = metaCalorias > 0 ? Math.round((averageCalories / metaCalorias) * 100) : 0;

  return (
    <Card className="bg-card-dark border-primary/20 col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Evolução Nutricional
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={period === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("7d")}
            >
              7 dias
            </Button>
            <Button
              variant={period === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("30d")}
            >
              30 dias
            </Button>
          </div>
        </div>
        
        {/* Statistics Row */}
        {chartData.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-primary" />
              <span>Média: {averageCalories} kcal</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Meta: {metaPercentage}%</span>
            </div>
            <div className="text-muted-foreground">
              {daysWithData}/{totalDays} dias com registro
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant={activeChart === "calories" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("calories")}
          >
            Calorias
          </Button>
          <Button
            variant={activeChart === "macros" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("macros")}
          >
            Macronutrientes
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum dado nutricional encontrado</p>
              <p className="text-sm">Registre suas refeições para ver os gráficos</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === "calories" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'calorias') return [`${value} kcal`, 'Calorias'];
                      if (name === 'meta') return [`${value} kcal`, 'Meta'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <ReferenceLine 
                    y={metaCalorias} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: `Meta: ${metaCalorias} kcal`, 
                      position: "top",
                      style: { fontSize: '11px', fill: 'hsl(var(--destructive))' }
                    }}
                  />
                  <Area
                    type="monotone" 
                    dataKey="calorias" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fill="url(#caloriesGradient)"
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      return (
                        <circle 
                          key={`nutrition-dot-${index}`}
                          cx={cx} 
                          cy={cy} 
                          r={payload.calorias > 0 ? 5 : 0}
                          fill={payload.atingiuMeta ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ 
                      r: 7, 
                      stroke: 'hsl(var(--primary))', 
                      strokeWidth: 2,
                      fill: 'hsl(var(--background))'
                    }}
                  />
                </AreaChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="proteinGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="carbGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
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
                    formatter={(value: number, name: string) => [`${value}g`, name]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="proteinas"
                    stackId="1"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#proteinGradient)"
                    strokeWidth={2}
                    name="Proteínas"
                  />
                  <Area
                    type="monotone"
                    dataKey="carboidratos"
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fill="url(#carbGradient)"
                    strokeWidth={2}
                    name="Carboidratos"
                  />
                  <Area
                    type="monotone"
                    dataKey="gorduras"
                    stackId="1"
                    stroke="hsl(var(--chart-3))"
                    fill="url(#fatGradient)"
                    strokeWidth={2}
                    name="Gorduras"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}