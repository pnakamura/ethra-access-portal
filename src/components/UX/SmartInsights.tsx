import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  message: string;
  action?: string;
  priority: number;
  icon: React.ReactNode;
  autoHide?: boolean;
}

interface SmartInsightsProps {
  dashboardData: any;
  nutritionData: any[];
  weightData: any[];
  hydrationData: any[];
}

export function SmartInsights({ dashboardData, nutritionData, weightData, hydrationData }: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  useEffect(() => {
    generateInsights();
  }, [dashboardData, nutritionData, weightData, hydrationData]);

  const generateInsights = () => {
    const newInsights: Insight[] = [];

    // Calorie insights
    if (dashboardData?.calorias_hoje && dashboardData?.meta_calorias) {
      const calorieProgress = (dashboardData.calorias_hoje / dashboardData.meta_calorias) * 100;
      
      if (calorieProgress < 50) {
        newInsights.push({
          id: 'low-calories',
          type: 'warning',
          title: 'Calorias Baixas',
          message: `Você consumiu apenas ${calorieProgress.toFixed(0)}% da sua meta calórica hoje. Considere fazer uma refeição nutritiva.`,
          action: 'Registrar Refeição',
          priority: 8,
          icon: <AlertTriangle className="h-4 w-4" />
        });
      } else if (calorieProgress > 120) {
        newInsights.push({
          id: 'high-calories',
          type: 'info',
          title: 'Meta Calórica Superada',
          message: `Você já atingiu ${calorieProgress.toFixed(0)}% da sua meta. Considere atividades físicas ou ajustar as próximas refeições.`,
          priority: 6,
          icon: <TrendingUp className="h-4 w-4" />
        });
      } else if (calorieProgress >= 80 && calorieProgress <= 100) {
        newInsights.push({
          id: 'perfect-calories',
          type: 'success',
          title: 'Perfeito! 🎯',
          message: 'Você está no caminho certo com suas calorias hoje. Continue assim!',
          priority: 3,
          icon: <CheckCircle className="h-4 w-4" />,
          autoHide: true
        });
      }
    }

    // Hydration insights
    if (dashboardData?.agua_hoje !== undefined && dashboardData?.meta_agua) {
      const hydrationProgress = (dashboardData.agua_hoje / dashboardData.meta_agua) * 100;
      
      if (hydrationProgress < 30) {
        newInsights.push({
          id: 'low-hydration',
          type: 'warning',
          title: 'Hidratação Crítica',
          message: `Você bebeu apenas ${dashboardData.agua_hoje}ml hoje. Beba água regularmente!`,
          action: 'Registrar Água',
          priority: 9,
          icon: <AlertTriangle className="h-4 w-4" />
        });
      } else if (hydrationProgress >= 100) {
        newInsights.push({
          id: 'excellent-hydration',
          type: 'success',
          title: 'Hidratação Excelente! 💧',
          message: 'Parabéns! Você atingiu sua meta de hidratação hoje.',
          priority: 2,
          icon: <CheckCircle className="h-4 w-4" />,
          autoHide: true
        });
      }
    }

    // Weight trends
    if (weightData && weightData.length >= 2) {
      const latestWeight = weightData[weightData.length - 1]?.peso_kg;
      const previousWeight = weightData[weightData.length - 2]?.peso_kg;
      
      if (latestWeight && previousWeight) {
        const weightChange = latestWeight - previousWeight;
        
        if (Math.abs(weightChange) >= 1) {
          newInsights.push({
            id: 'weight-change',
            type: weightChange > 0 ? 'info' : 'success',
            title: `Peso ${weightChange > 0 ? 'Aumentou' : 'Diminuiu'}`,
            message: `Variação de ${Math.abs(weightChange).toFixed(1)}kg desde o último registro. ${
              weightChange > 0 ? 'Monitore sua alimentação.' : 'Ótimo progresso!'
            }`,
            priority: 5,
            icon: weightChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
          });
        }
      }
    }

    // Consistency insights
    if (dashboardData?.registros_nutricao_30_dias !== undefined) {
      if (dashboardData.registros_nutricao_30_dias >= 25) {
        newInsights.push({
          id: 'excellent-consistency',
          type: 'success',
          title: 'Consistência Incrível! 🔥',
          message: `${dashboardData.registros_nutricao_30_dias} registros nos últimos 30 dias. Você é um exemplo!`,
          priority: 1,
          icon: <Sparkles className="h-4 w-4" />,
          autoHide: true
        });
      } else if (dashboardData.registros_nutricao_30_dias < 10) {
        newInsights.push({
          id: 'low-consistency',
          type: 'tip',
          title: 'Melhore Sua Consistência',
          message: 'Registros regulares ajudam a alcançar seus objetivos. Tente registrar pelo menos uma refeição por dia.',
          priority: 7,
          icon: <Lightbulb className="h-4 w-4" />
        });
      }
    }

    // Nutrition balance insights
    if (nutritionData && nutritionData.length > 0) {
      const recentDays = nutritionData.slice(-7);
      const avgProteins = recentDays.reduce((sum, day) => sum + (day.proteinas || 0), 0) / recentDays.length;
      
      if (avgProteins < 50) {
        newInsights.push({
          id: 'low-protein',
          type: 'tip',
          title: 'Aumente as Proteínas',
          message: `Sua média de proteínas (${avgProteins.toFixed(0)}g) está baixa. Inclua mais carnes magras, ovos ou leguminosas.`,
          priority: 4,
          icon: <Target className="h-4 w-4" />
        });
      }
    }

    // Filter out dismissed insights and sort by priority
    const filteredInsights = newInsights
      .filter(insight => !dismissedInsights.includes(insight.id))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3); // Show max 3 insights

    setInsights(filteredInsights);

    // Auto-hide insights after 10 seconds
    filteredInsights.forEach(insight => {
      if (insight.autoHide) {
        setTimeout(() => {
          dismissInsight(insight.id);
        }, 10000);
      }
    });
  };

  const dismissInsight = (insightId: string) => {
    setDismissedInsights(prev => [...prev, insightId]);
    setInsights(prev => prev.filter(i => i.id !== insightId));
  };

  const getInsightColors = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300';
      case 'warning':
        return 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'tip':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300';
      default:
        return 'border-muted bg-muted/10';
    }
  };

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className={`relative ${getInsightColors(insight.type)}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1">{insight.title}</div>
                  <AlertDescription className="text-sm">
                    {insight.message}
                  </AlertDescription>
                  {insight.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                    >
                      {insight.action}
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={() => dismissInsight(insight.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}