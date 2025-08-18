import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, Droplets, Flame, Calendar, TrendingUp, Award, Zap, Crown, Shield, Heart, Gift, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'weight' | 'nutrition' | 'hydration' | 'consistency' | 'streak' | 'milestone' | 'special';
  category: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  requirement: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: Date;
  color: string;
  xpReward: number;
  tips?: string;
  nextAchievement?: string;
}

interface UserLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  title: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userLevel, setUserLevel] = useState<UserLevel>({ level: 1, currentXP: 0, xpForNextLevel: 100, title: 'Iniciante' });

  useEffect(() => {
    if (dashboardData) {
      calculateAchievements();
    }
  }, [dashboardData, nutritionData, weightData, hydrationData]);

  const calculateAchievements = () => {
    const hydrationStreak = calculateHydrationStreak();
    const nutritionConsistency = calculateNutritionConsistency();
    const weightProgress = calculateWeightProgress();
    const allGoalsStreak = calculateAllGoalsStreak();

    const achievementList: Achievement[] = [
      // BRONZE ACHIEVEMENTS
      {
        id: 'first_step',
        title: 'Primeiro Passo',
        description: 'Registre sua primeira refeição',
        icon: <Calendar className="h-4 w-4" />,
        type: 'milestone',
        category: 'bronze',
        requirement: 1,
        currentValue: dashboardData.registros_nutricao_30_dias || 0,
        unlocked: (dashboardData.registros_nutricao_30_dias || 0) >= 1,
        color: 'from-amber-600 to-amber-500',
        xpReward: 10,
        tips: 'Continue registrando suas refeições diariamente!',
        nextAchievement: 'first_week'
      },
      {
        id: 'first_week',
        title: 'Primeira Semana',
        description: 'Complete 7 dias de registros',
        icon: <Calendar className="h-4 w-4" />,
        type: 'consistency',
        category: 'bronze',
        requirement: 7,
        currentValue: dashboardData.registros_nutricao_30_dias || 0,
        unlocked: (dashboardData.registros_nutricao_30_dias || 0) >= 7,
        color: 'from-amber-600 to-amber-500',
        xpReward: 25,
        tips: 'Mantenha o ritmo! A consistência é fundamental.',
        nextAchievement: 'hydration_starter'
      },
      {
        id: 'hydration_starter',
        title: 'Iniciante da Hidratação',
        description: 'Atinja a meta de água por 3 dias seguidos',
        icon: <Droplets className="h-4 w-4" />,
        type: 'hydration',
        category: 'bronze',
        requirement: 3,
        currentValue: hydrationStreak,
        unlocked: hydrationStreak >= 3,
        color: 'from-cyan-600 to-cyan-500',
        xpReward: 20,
        tips: 'Beba água regularmente durante o dia. Use lembretes!',
        nextAchievement: 'hydration_hero'
      },

      // SILVER ACHIEVEMENTS
      {
        id: 'hydration_hero',
        title: 'Herói da Hidratação',
        description: 'Atinja a meta de água por 7 dias seguidos',
        icon: <Droplets className="h-4 w-4" />,
        type: 'hydration',
        category: 'silver',
        requirement: 7,
        currentValue: hydrationStreak,
        unlocked: hydrationStreak >= 7,
        color: 'from-slate-500 to-slate-400',
        xpReward: 50,
        tips: 'Excelente! Continue assim para se tornar um Mestre da Hidratação.',
        nextAchievement: 'hydration_master'
      },
      {
        id: 'calorie_tracker',
        title: 'Contador de Calorias',
        description: 'Atinja sua meta calórica por 10 dias',
        icon: <Flame className="h-4 w-4" />,
        type: 'nutrition',
        category: 'silver',
        requirement: 10,
        currentValue: nutritionConsistency,
        unlocked: nutritionConsistency >= 10,
        color: 'from-orange-600 to-orange-500',
        xpReward: 50,
        tips: 'Ótimo controle nutricional! Continue monitorando suas calorias.',
        nextAchievement: 'calorie_master'
      },
      {
        id: 'weight_tracker',
        title: 'Monitor de Peso',
        description: 'Registre peso por 10 dias no mês',
        icon: <TrendingUp className="h-4 w-4" />,
        type: 'weight',
        category: 'silver',
        requirement: 10,
        currentValue: dashboardData.registros_peso_30_dias || 0,
        unlocked: (dashboardData.registros_peso_30_dias || 0) >= 10,
        color: 'from-green-600 to-green-500',
        xpReward: 40,
        tips: 'Monitoramento regular do peso é essencial para o progresso.',
        nextAchievement: 'weight_warrior'
      },

      // GOLD ACHIEVEMENTS
      {
        id: 'calorie_master',
        title: 'Mestre das Calorias',
        description: 'Atinja sua meta calórica por 20 dias',
        icon: <Flame className="h-4 w-4" />,
        type: 'nutrition',
        category: 'gold',
        requirement: 20,
        currentValue: nutritionConsistency,
        unlocked: nutritionConsistency >= 20,
        color: 'from-yellow-500 to-yellow-400',
        xpReward: 100,
        tips: 'Incrível disciplina nutricional! Você é um verdadeiro mestre.',
        nextAchievement: 'nutrition_legend'
      },
      {
        id: 'weight_warrior',
        title: 'Guerreiro do Peso',
        description: 'Registre peso por 20 dias no mês',
        icon: <TrendingUp className="h-4 w-4" />,
        type: 'weight',
        category: 'gold',
        requirement: 20,
        currentValue: dashboardData.registros_peso_30_dias || 0,
        unlocked: (dashboardData.registros_peso_30_dias || 0) >= 20,
        color: 'from-yellow-500 to-yellow-400',
        xpReward: 80,
        tips: 'Excelente dedicação! Continue com esse controle rigoroso.',
        nextAchievement: 'consistency_king'
      },
      {
        id: 'goal_crusher',
        title: 'Destruidor de Metas',
        description: 'Atinja todas as metas por 5 dias seguidos',
        icon: <Target className="h-4 w-4" />,
        type: 'streak',
        category: 'gold',
        requirement: 5,
        currentValue: allGoalsStreak,
        unlocked: allGoalsStreak >= 5,
        color: 'from-yellow-500 to-yellow-400',
        xpReward: 120,
        tips: 'Perfeito! Você consegue atingir todas as metas consistentemente.',
        nextAchievement: 'perfect_week'
      },

      // PLATINUM ACHIEVEMENTS  
      {
        id: 'hydration_master',
        title: 'Mestre da Hidratação',
        description: 'Atinja a meta de água por 14 dias seguidos',
        icon: <Droplets className="h-4 w-4" />,
        type: 'hydration',
        category: 'platinum',
        requirement: 14,
        currentValue: hydrationStreak,
        unlocked: hydrationStreak >= 14,
        color: 'from-indigo-600 to-indigo-500',
        xpReward: 150,
        tips: 'Hidratação exemplar! Sua disciplina é inspiradora.',
        nextAchievement: 'hydration_legend'
      },
      {
        id: 'consistency_king',
        title: 'Rei da Consistência',
        description: 'Complete 30 dias de registros',
        icon: <Crown className="h-4 w-4" />,
        type: 'consistency',
        category: 'platinum',
        requirement: 30,
        currentValue: dashboardData.registros_nutricao_30_dias || 0,
        unlocked: (dashboardData.registros_nutricao_30_dias || 0) >= 30,
        color: 'from-indigo-600 to-indigo-500',
        xpReward: 200,
        tips: 'Consistência incomparável! Você é um verdadeiro rei.',
        nextAchievement: 'health_legend'
      },
      {
        id: 'perfect_week',
        title: 'Semana Perfeita',
        description: 'Atinja todas as metas por 7 dias seguidos',
        icon: <Star className="h-4 w-4" />,
        type: 'streak',
        category: 'platinum',
        requirement: 7,
        currentValue: allGoalsStreak,
        unlocked: allGoalsStreak >= 7,
        color: 'from-indigo-600 to-indigo-500',
        xpReward: 250,
        tips: 'Uma semana absolutamente perfeita! Incrível controle.',
        nextAchievement: 'health_legend'
      },

      // LEGENDARY ACHIEVEMENTS
      {
        id: 'nutrition_legend',
        title: 'Lenda da Nutrição',
        description: 'Atinja sua meta calórica por 50 dias',
        icon: <Award className="h-4 w-4" />,
        type: 'nutrition',
        category: 'legendary',
        requirement: 50,
        currentValue: nutritionConsistency,
        unlocked: nutritionConsistency >= 50,
        color: 'from-purple-600 to-purple-500',
        xpReward: 500,
        tips: 'Status lendário alcançado! Você é uma inspiração para todos.',
      },
      {
        id: 'hydration_legend',
        title: 'Lenda da Hidratação',
        description: 'Atinja a meta de água por 30 dias seguidos',
        icon: <Medal className="h-4 w-4" />,
        type: 'hydration',
        category: 'legendary',
        requirement: 30,
        currentValue: hydrationStreak,
        unlocked: hydrationStreak >= 30,
        color: 'from-purple-600 to-purple-500',
        xpReward: 500,
        tips: 'Lendário! Sua hidratação é um exemplo para todos.',
      },
      {
        id: 'health_legend',
        title: 'Lenda da Saúde',
        description: 'Atinja todas as metas por 14 dias seguidos',
        icon: <Heart className="h-4 w-4" />,
        type: 'streak',
        category: 'legendary',
        requirement: 14,
        currentValue: allGoalsStreak,
        unlocked: allGoalsStreak >= 14,
        color: 'from-purple-600 to-purple-500',
        xpReward: 1000,
        tips: 'Você alcançou o status de Lenda da Saúde! Simplesmente incrível.',
      }
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
    
    // Calculate user level and XP
    const totalXP = achievementList.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);
    const level = Math.floor(totalXP / 100) + 1;
    const currentXP = totalXP % 100;
    const xpForNextLevel = 100;
    
    const levelTitles = {
      1: 'Iniciante',
      2: 'Explorador',
      3: 'Dedicado',
      4: 'Disciplinado',
      5: 'Expert',
      6: 'Mestre',
      7: 'Campeão',
      8: 'Lenda',
      9: 'Ícone',
      10: 'Imortal'
    };
    
    setUserLevel({
      level,
      currentXP,
      xpForNextLevel,
      title: levelTitles[Math.min(level, 10) as keyof typeof levelTitles] || 'Imortal'
    });
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
    // More comprehensive calculation for goal streaks
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Check hydration for this date
      const dayHydration = hydrationData.find(h => h.date?.includes(dateStr));
      const hydrationMet = (dayHydration?.quantidade_ml || 0) >= (dashboardData?.meta_agua || 2000) * 0.8;
      
      // Check nutrition for this date
      const dayNutrition = nutritionData.find(n => n.data_registro?.includes(dateStr));
      const nutritionMet = (dayNutrition?.calorias || 0) >= (dashboardData?.meta_calorias || 2000) * 0.8;
      
      if (hydrationMet && nutritionMet) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      bronze: <Medal className="h-4 w-4" />,
      silver: <Shield className="h-4 w-4" />,
      gold: <Star className="h-4 w-4" />,
      platinum: <Crown className="h-4 w-4" />,
      legendary: <Zap className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons];
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      bronze: 'from-amber-600 to-amber-500',
      silver: 'from-slate-500 to-slate-400', 
      gold: 'from-yellow-500 to-yellow-400',
      platinum: 'from-indigo-600 to-indigo-500',
      legendary: 'from-purple-600 to-purple-500'
    };
    return colors[category as keyof typeof colors];
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPercentage = (unlockedCount / achievements.length) * 100;

  return (
    <>
      {/* Enhanced Achievement Summary Card */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20 cursor-pointer hover:from-card/90 hover:to-card/70 transition-all duration-300 shadow-lg"
            onClick={() => setShowAchievements(!showAchievements)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`p-3 rounded-full bg-gradient-to-br ${getCategoryColor(userLevel.level <= 2 ? 'bronze' : userLevel.level <= 4 ? 'silver' : userLevel.level <= 6 ? 'gold' : userLevel.level <= 8 ? 'platinum' : 'legendary')}`}>
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                {unlockedCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground"
                  >
                    {unlockedCount}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Nível {userLevel.level} - {userLevel.title}
                  {getCategoryIcon(userLevel.level <= 2 ? 'bronze' : userLevel.level <= 4 ? 'silver' : userLevel.level <= 6 ? 'gold' : userLevel.level <= 8 ? 'platinum' : 'legendary')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {unlockedCount}/{achievements.length} conquistas • {achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0)} XP total
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-xs text-muted-foreground mb-1">Progresso Geral</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>XP para próximo nível</span>
              <span>{userLevel.currentXP}/{userLevel.xpForNextLevel}</span>
            </div>
            <Progress value={(userLevel.currentXP / userLevel.xpForNextLevel) * 100} className="h-2" />
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {['bronze', 'silver', 'gold', 'platinum'].map((category) => {
              const count = achievements.filter(a => a.category === category && a.unlocked).length;
              const total = achievements.filter(a => a.category === category).length;
              return (
                <div key={category} className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center mb-1`}>
                    {getCategoryIcon(category)}
                  </div>
                  <div className="text-xs font-semibold">{count}/{total}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Detailed Achievements Modal */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAchievements(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-card rounded-xl shadow-2xl border max-w-4xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-gradient-to-br ${getCategoryColor(userLevel.level <= 2 ? 'bronze' : userLevel.level <= 4 ? 'silver' : userLevel.level <= 6 ? 'gold' : userLevel.level <= 8 ? 'platinum' : 'legendary')}`}>
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      Sistema de Conquistas
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Nível {userLevel.level} - {userLevel.title} • {achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0)} XP Total
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowAchievements(false)}>
                    ✕
                  </Button>
                </div>
                
                {/* Level Progress */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso para Nível {userLevel.level + 1}</span>
                    <span>{userLevel.currentXP}/{userLevel.xpForNextLevel} XP</span>
                  </div>
                  <Progress value={(userLevel.currentXP / userLevel.xpForNextLevel) * 100} className="h-3" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                {/* Category Filters */}
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                    <TabsTrigger value="bronze" className="text-xs">Bronze</TabsTrigger>
                    <TabsTrigger value="silver" className="text-xs">Prata</TabsTrigger>
                    <TabsTrigger value="gold" className="text-xs">Ouro</TabsTrigger>
                    <TabsTrigger value="platinum" className="text-xs">Platina</TabsTrigger>
                    <TabsTrigger value="legendary" className="text-xs">Lendário</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group relative p-5 rounded-xl border transition-all duration-300 ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-md hover:shadow-lg' 
                          : 'bg-muted/30 border-muted hover:bg-muted/50'
                      }`}
                    >
                      {/* Category Badge */}
                      <div className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br ${getCategoryColor(achievement.category)} flex items-center justify-center shadow-sm`}>
                        {getCategoryIcon(achievement.category)}
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl transition-all duration-300 ${
                          achievement.unlocked 
                            ? `bg-gradient-to-br ${achievement.color} shadow-lg text-white` 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {achievement.icon}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className={`font-bold text-lg ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {achievement.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>

                          {/* Progress Info */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progresso</span>
                              <span className="font-semibold">
                                {achievement.currentValue}/{achievement.requirement}
                              </span>
                            </div>
                            
                            {!achievement.unlocked && (
                              <Progress 
                                value={Math.min((achievement.currentValue / achievement.requirement) * 100, 100)} 
                                className="h-2"
                              />
                            )}
                          </div>

                          {/* Status and Rewards */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {achievement.unlocked ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                  <Star className="h-3 w-3 mr-1" />
                                  Desbloqueada
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  {Math.round((achievement.currentValue / achievement.requirement) * 100)}% completo
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-primary">
                              +{achievement.xpReward} XP
                            </div>
                          </div>

                          {/* Tips and Next Achievement */}
                          {achievement.tips && !achievement.unlocked && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              💡 {achievement.tips}
                            </div>
                          )}
                          
                          {achievement.nextAchievement && achievement.unlocked && (
                            <div className="text-xs text-primary">
                              ➡️ Próxima: {achievements.find(a => a.id === achievement.nextAchievement)?.title}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conquista encontrada nesta categoria.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Achievement Notifications */}
      <AnimatePresence>
        {newUnlocked.map((achievement, index) => (
          <motion.div
            key={`notification-${achievement.id}`}
            initial={{ x: 400, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 400, opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.2 }}
            className="fixed top-4 right-4 z-50 bg-gradient-to-br from-card to-card/90 border border-primary/50 shadow-2xl rounded-xl p-5 max-w-sm backdrop-blur-sm"
            style={{ marginTop: index * 120 }}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${achievement.color} shadow-lg`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎉</span>
                  <span className="font-bold text-sm bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    CONQUISTA DESBLOQUEADA!
                  </span>
                </div>
                <h4 className="font-bold text-foreground">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                <div className="flex items-center justify-between">
                  <Badge className={`bg-gradient-to-r ${getCategoryColor(achievement.category)} border-0 text-white text-xs`}>
                    {achievement.category.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-bold text-primary">+{achievement.xpReward} XP</span>
                </div>
              </div>
            </div>
            
            {/* Celebration Effect */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, times: [0, 0.6, 1] }}
              className="absolute -top-2 -right-2 text-2xl"
            >
              ⭐
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}