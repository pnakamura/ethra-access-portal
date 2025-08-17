import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Target, Droplets, Flame, Calendar, TrendingUp, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'weight' | 'nutrition' | 'hydration' | 'consistency' | 'streak';
  requirement: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: Date;
  color: string;
}

interface AchievementSystemProps {
  dashboardData: any;
  nutritionData: any[];
  weightData: any[];
  hydrationData: any[];
}

export function AchievementSystem({ dashboardData, nutritionData, weightData, hydrationData }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newUnlocked, setNewUnlocked] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    if (dashboardData) {
      calculateAchievements();
    }
  }, [dashboardData, nutritionData, weightData, hydrationData]);

  const calculateAchievements = () => {
    const hydrationStreak = calculateHydrationStreak();
    const nutritionConsistency = calculateNutritionConsistency();
    const weightProgress = calculateWeightProgress();

    const achievementList: Achievement[] = [
      {
        id: 'first_week',
        title: 'Primeira Semana',
        description: 'Complete 7 dias de registros',
        icon: <Calendar className="h-4 w-4" />,
        type: 'consistency',
        requirement: 7,
        currentValue: dashboardData.registros_nutricao_30_dias || 0,
        unlocked: (dashboardData.registros_nutricao_30_dias || 0) >= 7,
        color: 'bg-blue-500',
      },
      {
        id: 'hydration_hero',
        title: 'Herói da Hidratação',
        description: 'Atinja a meta de água por 5 dias seguidos',
        icon: <Droplets className="h-4 w-4" />,
        type: 'hydration',
        requirement: 5,
        currentValue: hydrationStreak,
        unlocked: hydrationStreak >= 5,
        color: 'bg-cyan-500',
      },
      {
        id: 'calorie_master',
        title: 'Mestre das Calorias',
        description: 'Atinja sua meta calórica por 10 dias',
        icon: <Flame className="h-4 w-4" />,
        type: 'nutrition',
        requirement: 10,
        currentValue: nutritionConsistency,
        unlocked: nutritionConsistency >= 10,
        color: 'bg-orange-500',
      },
      {
        id: 'weight_warrior',
        title: 'Guerreiro do Peso',
        description: 'Registre peso por 15 dias no mês',
        icon: <TrendingUp className="h-4 w-4" />,
        type: 'weight',
        requirement: 15,
        currentValue: dashboardData.registros_peso_30_dias || 0,
        unlocked: (dashboardData.registros_peso_30_dias || 0) >= 15,
        color: 'bg-green-500',
      },
      {
        id: 'goal_crusher',
        title: 'Destruidor de Metas',
        description: 'Atinja todas as metas por 3 dias seguidos',
        icon: <Trophy className="h-4 w-4" />,
        type: 'streak',
        requirement: 3,
        currentValue: calculateAllGoalsStreak(),
        unlocked: calculateAllGoalsStreak() >= 3,
        color: 'bg-purple-500',
      },
      {
        id: 'consistency_king',
        title: 'Rei da Consistência',
        description: 'Complete 30 dias de registros',
        icon: <Award className="h-4 w-4" />,
        type: 'consistency',
        requirement: 30,
        currentValue: dashboardData.registros_nutricao_30_dias || 0,
        unlocked: (dashboardData.registros_nutricao_30_dias || 0) >= 30,
        color: 'bg-gold-500',
      },
    ];

    // Check for newly unlocked achievements
    const previouslyUnlocked = achievements.filter(a => a.unlocked).map(a => a.id);
    const nowUnlocked = achievementList.filter(a => a.unlocked).map(a => a.id);
    const newlyUnlocked = achievementList.filter(a => 
      nowUnlocked.includes(a.id) && !previouslyUnlocked.includes(a.id)
    );

    if (newlyUnlocked.length > 0) {
      setNewUnlocked(newlyUnlocked);
      // Auto-hide after 5 seconds
      setTimeout(() => setNewUnlocked([]), 5000);
    }

    setAchievements(achievementList);
  };

  const calculateHydrationStreak = () => {
    if (!hydrationData || hydrationData.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayData = hydrationData.find(h => h.date?.includes(dateStr));
      const dailyTotal = dayData?.quantidade_ml || 0;
      
      if (dailyTotal >= (dashboardData?.meta_agua || 2000)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateNutritionConsistency = () => {
    if (!nutritionData || nutritionData.length === 0) return 0;
    
    return nutritionData.filter(n => 
      n.calorias >= (dashboardData?.meta_calorias || 2000) * 0.8
    ).length;
  };

  const calculateWeightProgress = () => {
    if (!weightData || weightData.length < 2) return 0;
    
    const firstWeight = weightData[0]?.peso_kg;
    const lastWeight = weightData[weightData.length - 1]?.peso_kg;
    
    if (!firstWeight || !lastWeight || !dashboardData?.meta_peso) return 0;
    
    const currentProgress = Math.abs(lastWeight - dashboardData.meta_peso);
    const initialProgress = Math.abs(firstWeight - dashboardData.meta_peso);
    
    return initialProgress > currentProgress ? 1 : 0;
  };

  const calculateAllGoalsStreak = () => {
    // Simplified calculation for demo
    const hydrationStreak = calculateHydrationStreak();
    const hasRecentNutrition = (dashboardData?.calorias_hoje || 0) >= (dashboardData?.meta_calorias || 2000) * 0.8;
    const hasRecentHydration = (dashboardData?.agua_hoje || 0) >= (dashboardData?.meta_agua || 2000) * 0.8;
    
    return (hasRecentNutrition && hasRecentHydration) ? Math.min(hydrationStreak, 3) : 0;
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPercentage = (unlockedCount / achievements.length) * 100;

  return (
    <>
      {/* Achievement Summary Card */}
      <Card className="bg-card-dark border-primary/20 cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => setShowAchievements(!showAchievements)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Trophy className="h-6 w-6 text-primary" />
                {unlockedCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unlockedCount}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">Conquistas</h3>
                <p className="text-xs text-muted-foreground">
                  {unlockedCount}/{achievements.length} desbloqueadas
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{Math.round(progressPercentage)}%</div>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Achievements Modal */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAchievements(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Suas Conquistas
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAchievements(false)}>
                  Fechar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    layout
                    className={`p-4 rounded-lg border transition-all ${
                      achievement.unlocked 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/50 border-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${achievement.unlocked ? achievement.color : 'bg-muted'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs">
                            {achievement.currentValue}/{achievement.requirement}
                          </div>
                          {achievement.unlocked && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Desbloqueada
                            </Badge>
                          )}
                        </div>
                        {!achievement.unlocked && (
                          <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((achievement.currentValue / achievement.requirement) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Achievement Notifications */}
      <AnimatePresence>
        {newUnlocked.map((achievement) => (
          <motion.div
            key={`notification-${achievement.id}`}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-4 right-4 z-50 bg-card border border-primary shadow-lg rounded-lg p-4 max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${achievement.color}`}>
                {achievement.icon}
              </div>
              <div>
                <div className="font-semibold text-sm">🎉 Nova Conquista!</div>
                <div className="text-sm text-muted-foreground">{achievement.title}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}