import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Activity } from "lucide-react";

interface ActivitySummaryProps {
  registrosPeso30Dias: number;
  registrosNutricao30Dias: number;
  registrosAgua30Dias: number;
}

export function ActivitySummary({
  registrosPeso30Dias,
  registrosNutricao30Dias,
  registrosAgua30Dias
}: ActivitySummaryProps) {
  const getBadgeVariant = (count: number, threshold: number) => {
    if (count >= threshold) return "default";
    if (count >= threshold * 0.7) return "secondary";
    return "destructive";
  };

  const getEngagementLevel = () => {
    const total = registrosPeso30Dias + registrosNutricao30Dias + registrosAgua30Dias;
    if (total >= 50) return { level: "Alto", color: "text-green-500" };
    if (total >= 20) return { level: "Médio", color: "text-yellow-500" };
    return { level: "Baixo", color: "text-red-500" };
  };

  const engagement = getEngagementLevel();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-card-dark border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade (30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Registros de Peso</span>
            <Badge variant={getBadgeVariant(registrosPeso30Dias, 10)}>
              {registrosPeso30Dias}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Registros Nutricionais</span>
            <Badge variant={getBadgeVariant(registrosNutricao30Dias, 30)}>
              {registrosNutricao30Dias}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Dias com Hidratação</span>
            <Badge variant={getBadgeVariant(registrosAgua30Dias, 20)}>
              {registrosAgua30Dias}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-dark border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engajamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${engagement.color}`}>
              {engagement.level}
            </div>
            <p className="text-sm text-muted-foreground">
              Nível de engajamento com o app
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Consistência</span>
              <span className="text-muted-foreground">
                {Math.round((registrosAgua30Dias / 30) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full">
              <div 
                className="h-2 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min((registrosAgua30Dias / 30) * 100, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}