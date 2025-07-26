import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InsightData {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface NutritionInsightsProps {
  userId: string;
  dashboardData: any;
}

export function NutritionInsights({ userId, dashboardData }: NutritionInsightsProps) {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && dashboardData) {
      generateInsights();
    }
  }, [userId, dashboardData]);

  const generateInsights = async () => {
    try {
      setLoading(true);
      const newInsights: InsightData[] = [];

      // Análise de engajamento
      const totalRecords = dashboardData.registros_peso_30_dias + 
                          dashboardData.registros_nutricao_30_dias + 
                          dashboardData.registros_agua_30_dias;

      if (totalRecords < 10) {
        newInsights.push({
          type: 'warning',
          title: 'Baixo Engajamento',
          description: 'Você tem poucos registros nos últimos 30 dias. Tente registrar suas refeições e atividades mais frequentemente.',
          icon: <AlertTriangle className="h-4 w-4" />
        });
      } else if (totalRecords > 50) {
        newInsights.push({
          type: 'success',
          title: 'Excelente Engajamento!',
          description: 'Parabéns! Você está muito ativo no registro de suas atividades nutricionais.',
          icon: <CheckCircle className="h-4 w-4" />
        });
      }

      // Análise de hidratação
      const waterGoal = dashboardData.meta_agua || 2000;
      const waterToday = dashboardData.agua_hoje;
      const waterPercentage = (waterToday / waterGoal) * 100;

      if (waterPercentage < 50) {
        newInsights.push({
          type: 'warning',
          title: 'Hidratação Insuficiente',
          description: `Você consumiu apenas ${waterToday}ml de água hoje. Tente beber mais para atingir sua meta de ${waterGoal}ml.`,
          icon: <TrendingDown className="h-4 w-4" />
        });
      } else if (waterPercentage >= 100) {
        newInsights.push({
          type: 'success',
          title: 'Meta de Hidratação Atingida!',
          description: 'Parabéns! Você atingiu sua meta de hidratação diária.',
          icon: <CheckCircle className="h-4 w-4" />
        });
      }

      // Análise de calorias
      const calorieGoal = dashboardData.meta_calorias || 2000;
      const caloriesToday = dashboardData.calorias_hoje;
      const caloriePercentage = (caloriesToday / calorieGoal) * 100;

      if (caloriePercentage < 70) {
        newInsights.push({
          type: 'info',
          title: 'Calorias Abaixo da Meta',
          description: `Você consumiu ${Math.round(caloriesToday)} de ${calorieGoal} calorias hoje. Certifique-se de estar comendo o suficiente.`,
          icon: <TrendingDown className="h-4 w-4" />
        });
      } else if (caloriePercentage > 130) {
        newInsights.push({
          type: 'warning',
          title: 'Calorias Acima da Meta',
          description: `Você já consumiu ${Math.round(caloriesToday)} calorias hoje, superando sua meta de ${calorieGoal}.`,
          icon: <TrendingUp className="h-4 w-4" />
        });
      }

      // Análise de peso
      if (dashboardData.peso_atual && dashboardData.meta_peso) {
        const weightDiff = dashboardData.peso_atual - dashboardData.meta_peso;
        if (Math.abs(weightDiff) < 2) {
          newInsights.push({
            type: 'success',
            title: 'Peso Próximo da Meta!',
            description: `Você está muito próximo da sua meta de peso. Continue assim!`,
            icon: <CheckCircle className="h-4 w-4" />
          });
        }
      }

      // Buscar dados nutricionais recentes para análises mais avançadas
      const { data: recentNutrition } = await supabase
        .from('informacoes_nutricionais')
        .select('descricao_ia, calorias, proteinas')
        .eq('usuario_id', userId)
        .gte('data_registro', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .is('deletado_em', null)
        .order('data_registro', { ascending: false })
        .limit(5);

      if (recentNutrition && recentNutrition.length > 0) {
        // Análise de proteína
        const avgProtein = recentNutrition.reduce((sum, meal) => sum + (meal.proteinas || 0), 0) / recentNutrition.length;
        if (avgProtein < 20) {
          newInsights.push({
            type: 'info',
            title: 'Baixo Consumo de Proteína',
            description: `Suas refeições recentes têm uma média de ${Math.round(avgProtein)}g de proteína. Considere incluir mais fontes proteicas.`,
            icon: <TrendingUp className="h-4 w-4" />
          });
        }

        // Análise de consistência
        if (recentNutrition.length < 3) {
          newInsights.push({
            type: 'info',
            title: 'Registre Mais Refeições',
            description: 'Registre suas refeições com mais frequência para obter insights mais precisos sobre sua nutrição.',
            icon: <Brain className="h-4 w-4" />
          });
        }
      }

      setInsights(newInsights);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'destructive';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-700 bg-green-100 border-green-300';
      case 'warning': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'error': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-blue-700 bg-blue-100 border-blue-300';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card-dark border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights Nutricionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Insights Nutricionais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Continue registrando suas refeições para receber insights personalizados!</p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${getBadgeColor(insight.type)}`}>
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                      {insight.type === 'success' ? 'Ótimo' : 
                       insight.type === 'warning' ? 'Atenção' : 
                       insight.type === 'error' ? 'Urgente' : 'Info'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}