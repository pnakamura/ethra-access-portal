import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Droplets, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  pesoAtual?: number;
  metaPeso?: number;
  caloriasHoje?: number;
  metaCalorias?: number;
  aguaHoje?: number;
  metaAgua?: number;
}

export function StatsCards({
  pesoAtual,
  metaPeso,
  caloriasHoje = 0,
  metaCalorias = 2000,
  aguaHoje = 0,
  metaAgua = 2000
}: StatsCardsProps) {
  const calorieProgress = metaCalorias > 0 ? (caloriasHoje / metaCalorias) * 100 : 0;
  const waterProgress = metaAgua > 0 ? (aguaHoje / metaAgua) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-card-dark border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peso Atual</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pesoAtual ? `${pesoAtual}kg` : "Não registrado"}</div>
          {metaPeso && (
            <p className="text-xs text-muted-foreground">
              Meta: {metaPeso}kg
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card-dark border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calorias Hoje</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(caloriasHoje)}</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(calorieProgress)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Meta: {metaCalorias} kcal
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card-dark border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hidratação Hoje</CardTitle>
          <Droplets className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aguaHoje}ml</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(waterProgress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(waterProgress)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Meta: {metaAgua}ml
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card-dark border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta de Peso</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metaPeso ? `${metaPeso}kg` : "Não definida"}</div>
          {pesoAtual && metaPeso && (
            <p className="text-xs text-muted-foreground">
              {pesoAtual > metaPeso ? "Faltam" : "Sobram"} {Math.abs(pesoAtual - metaPeso).toFixed(1)}kg
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}