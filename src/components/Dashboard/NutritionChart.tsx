import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
}

export function NutritionChart({ data, period, onPeriodChange }: NutritionChartProps) {
  const [activeChart, setActiveChart] = useState<"calories" | "macros">("calories");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const chartData = data.map(item => ({
    date: formatDate(item.data_registro),
    calorias: Math.round(item.calorias),
    proteinas: Math.round(item.proteinas),
    carboidratos: Math.round(item.carboidratos),
    gorduras: Math.round(item.gorduras),
  }));

  return (
    <Card className="bg-card-dark border-primary/20 col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Evolução Nutricional</CardTitle>
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
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === "calories" ? (
              <LineChart data={chartData}>
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
                />
                <Line 
                  type="monotone" 
                  dataKey="calorias" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            ) : (
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
                />
                <Bar dataKey="proteinas" fill="#ef4444" name="Proteínas" />
                <Bar dataKey="carboidratos" fill="#3b82f6" name="Carboidratos" />
                <Bar dataKey="gorduras" fill="#f59e0b" name="Gorduras" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}