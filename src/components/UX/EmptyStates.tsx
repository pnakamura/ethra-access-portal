import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { 
  Utensils, 
  Scale, 
  Droplets, 
  TrendingUp, 
  Plus, 
  Sparkles,
  Target,
  BookOpen
} from 'lucide-react';

interface EmptyStateProps {
  type: 'nutrition' | 'weight' | 'hydration' | 'general';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  type, 
  title, 
  description, 
  actionText, 
  onAction,
  className = ""
}: EmptyStateProps) {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'nutrition':
        return {
          icon: <Utensils className="h-16 w-16 text-primary/30" />,
          defaultTitle: "Comece Sua Jornada Nutricional",
          defaultDescription: "Registre sua primeira refeição para começar a acompanhar sua evolução nutricional e receber insights personalizados.",
          defaultAction: "Registrar Primeira Refeição",
          tips: [
            "📸 Tire foto dos pratos para facilitar",
            "🥗 Comece com refeições simples",
            "⏰ Registre logo após comer"
          ],
          gradient: "from-orange-500/20 to-red-500/20"
        };
        
      case 'weight':
        return {
          icon: <Scale className="h-16 w-16 text-primary/30" />,
          defaultTitle: "Acompanhe Sua Evolução",
          defaultDescription: "Registre seu peso regularmente para visualizar seu progresso e identificar tendências ao longo do tempo.",
          defaultAction: "Registrar Peso",
          tips: [
            "⚖️ Pese-se sempre no mesmo horário",
            "📅 Registre semanalmente",
            "📈 Foque na tendência, não no dia"
          ],
          gradient: "from-blue-500/20 to-cyan-500/20"
        };
        
      case 'hydration':
        return {
          icon: <Droplets className="h-16 w-16 text-primary/30" />,
          defaultTitle: "Mantenha-se Hidratado",
          defaultDescription: "Acompanhe seu consumo de água diário para manter uma hidratação adequada e melhorar sua saúde.",
          defaultAction: "Registrar Água",
          tips: [
            "💧 Beba pequenas quantidades regularmente",
            "⏰ Use lembretes para não esquecer",
            "🥤 Varie com chás e águas saborizadas"
          ],
          gradient: "from-cyan-500/20 to-blue-500/20"
        };
        
      default:
        return {
          icon: <TrendingUp className="h-16 w-16 text-primary/30" />,
          defaultTitle: "Inicie Sua Jornada",
          defaultDescription: "Comece registrando seus dados para acompanhar seu progresso e alcançar seus objetivos de saúde.",
          defaultAction: "Começar Agora",
          tips: [
            "🎯 Defina metas realistas",
            "📊 Acompanhe regularmente",
            "🏆 Celebre suas conquistas"
          ],
          gradient: "from-purple-500/20 to-pink-500/20"
        };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <Card className={`bg-card-dark border-primary/20 ${className}`}>
      <CardContent className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          {/* Animated Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50 rounded-lg`} />
          
          {/* Icon with Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {config.icon}
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="h-6 w-6 text-primary/40" />
            </motion.div>
          </motion.div>

          {/* Content */}
          <div className="relative space-y-3">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-foreground"
            >
              {title || config.defaultTitle}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground max-w-md mx-auto leading-relaxed"
            >
              {description || config.defaultDescription}
            </motion.p>
          </div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative space-y-2"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Dicas Rápidas</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
              {config.tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (index * 0.1) }}
                  className="text-xs text-muted-foreground bg-muted/30 rounded-full px-3 py-1"
                >
                  {tip}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Button */}
          {onAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="relative"
            >
              <Button
                onClick={onAction}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                {actionText || config.defaultAction}
              </Button>
            </motion.div>
          )}

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 opacity-20">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="absolute bottom-4 right-4 opacity-20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Specific Empty State Components for easy use
export function NutritionEmptyState(props: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState {...props} type="nutrition" />;
}

export function WeightEmptyState(props: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState {...props} type="weight" />;
}

export function HydrationEmptyState(props: Omit<EmptyStateProps, 'type'>) {
  return <EmptyState {...props} type="hydration" />;
}