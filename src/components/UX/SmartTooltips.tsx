import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Target, Award } from 'lucide-react';

interface SmartTooltipProps {
  value: number;
  previousValue?: number;
  goal?: number;
  type: 'calories' | 'weight' | 'hydration' | 'nutrition';
  date?: string;
  children: React.ReactNode;
}

export function SmartTooltip({ 
  value, 
  previousValue, 
  goal, 
  type, 
  date, 
  children 
}: SmartTooltipProps) {
  const getTrendIndicator = () => {
    if (previousValue === undefined) return null;
    
    const diff = value - previousValue;
    if (Math.abs(diff) < 0.1) return { icon: <Minus className="h-3 w-3" />, text: "Estável", color: "text-muted-foreground" };
    if (diff > 0) return { icon: <TrendingUp className="h-3 w-3" />, text: `+${diff.toFixed(1)}`, color: "text-green-500" };
    return { icon: <TrendingDown className="h-3 w-3" />, text: `${diff.toFixed(1)}`, color: "text-red-500" };
  };

  const getGoalComparison = () => {
    if (!goal) return null;
    
    const percentage = (value / goal) * 100;
    const diff = value - goal;
    
    return {
      percentage: percentage.toFixed(0),
      diff: diff.toFixed(1),
      status: percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'needs-improvement'
    };
  };

  const getContextualInsight = () => {
    const goalComparison = getGoalComparison();
    
    switch (type) {
      case 'calories':
        if (goalComparison) {
          if (goalComparison.status === 'excellent') return "🎯 Excelente! Meta atingida";
          if (goalComparison.status === 'good') return "👍 Boa! Perto da meta";
          return "💪 Continue! Faltam " + Math.abs(Number(goalComparison.diff)) + " kcal";
        }
        return null;
        
      case 'weight':
        const trend = getTrendIndicator();
        if (trend && goal) {
          const distanceToGoal = Math.abs(value - goal);
          return `${distanceToGoal.toFixed(1)}kg ${value > goal ? 'acima' : 'abaixo'} da meta`;
        }
        return null;
        
      case 'hydration':
        if (goalComparison) {
          if (goalComparison.status === 'excellent') return "💧 Hidratação perfeita!";
          if (goalComparison.status === 'good') return "💧 Quase lá! Continue bebendo";
          return "💧 Beba mais " + Math.abs(Number(goalComparison.diff)) + "ml";
        }
        return null;
        
      default:
        return null;
    }
  };

  const trend = getTrendIndicator();
  const goalComparison = getGoalComparison();
  const insight = getContextualInsight();

  const formatValue = () => {
    switch (type) {
      case 'calories':
        return `${value.toFixed(0)} kcal`;
      case 'weight':
        return `${value.toFixed(1)} kg`;
      case 'hydration':
        return `${value.toFixed(0)} ml`;
      default:
        return value.toString();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-4 bg-card border border-primary/20 shadow-lg"
        >
          <div className="space-y-3">
            {/* Main Value */}
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{formatValue()}</div>
              {date && <div className="text-xs text-muted-foreground">{date}</div>}
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div className="flex items-center justify-center gap-2">
                <span className={trend.color}>{trend.icon}</span>
                <span className={`text-sm ${trend.color}`}>
                  {trend.text} {previousValue !== undefined && `(vs ${previousValue.toFixed(1)})`}
                </span>
              </div>
            )}

            {/* Goal Comparison */}
            {goalComparison && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meta:</span>
                  <span>{goal} {type === 'calories' ? 'kcal' : type === 'weight' ? 'kg' : 'ml'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso:</span>
                  <div className="flex items-center gap-1">
                    <span className={
                      goalComparison.status === 'excellent' ? 'text-green-500' :
                      goalComparison.status === 'good' ? 'text-yellow-500' : 'text-red-500'
                    }>
                      {goalComparison.percentage}%
                    </span>
                    {goalComparison.status === 'excellent' && <Award className="h-3 w-3 text-yellow-500" />}
                  </div>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      goalComparison.status === 'excellent' ? 'bg-green-500' :
                      goalComparison.status === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Number(goalComparison.percentage), 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Contextual Insight */}
            {insight && (
              <div className="text-center p-2 bg-primary/10 rounded-md">
                <div className="text-xs font-medium text-primary">{insight}</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}