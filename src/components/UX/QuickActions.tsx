import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Scale, 
  Utensils, 
  Droplets, 
  X, 
  Check,
  Camera,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  userId: string;
  onDataUpdate?: () => void;
}

type ActionType = 'weight' | 'water' | 'meal' | null;

export function QuickActions({ userId, onDataUpdate }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form states
  const [weight, setWeight] = useState('');
  const [water, setWater] = useState('');
  const [mealDescription, setMealDescription] = useState('');

  const handleQuickAction = async (type: ActionType) => {
    if (activeAction === type) {
      setActiveAction(null);
      return;
    }
    setActiveAction(type);
  };

  const handleSubmitWeight = async () => {
    if (!weight.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('registro_peso')
        .insert({
          usuario_id: userId,
          peso_kg: parseFloat(weight),
          data_registro: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Peso registrado!",
        description: `${weight}kg adicionado com sucesso`,
      });

      setWeight('');
      setActiveAction(null);
      onDataUpdate?.();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao registrar peso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWater = async () => {
    if (!water.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('registro_hidratacao')
        .insert({
          usuario_id: userId,
          quantidade_ml: parseInt(water),
          horario: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Hidratação registrada!",
        description: `${water}ml adicionados`,
      });

      setWater('');
      setActiveAction(null);
      onDataUpdate?.();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao registrar hidratação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMeal = async () => {
    if (!mealDescription.trim()) return;
    
    setLoading(true);
    try {
      // For demo purposes, we'll add a simple meal record
      const { error } = await supabase
        .from('informacoes_nutricionais')
        .insert({
          usuario_id: userId,
          data_registro: new Date().toISOString(),
          calorias: 0, // Would be calculated by AI in real implementation
          proteinas: 0,
          carboidratos: 0,
          gorduras: 0,
          descricao_ia: mealDescription
        });

      if (error) throw error;

      toast({
        title: "Refeição registrada!",
        description: "Aguarde o processamento nutricional",
      });

      setMealDescription('');
      setActiveAction(null);
      onDataUpdate?.();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao registrar refeição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const actions = [
    {
      type: 'weight' as ActionType,
      icon: <Scale className="h-5 w-5" />,
      label: 'Peso',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      type: 'water' as ActionType,
      icon: <Droplets className="h-5 w-5" />,
      label: 'Água',
      color: 'bg-cyan-500 hover:bg-cyan-600',
    },
    {
      type: 'meal' as ActionType,
      icon: <Utensils className="h-5 w-5" />,
      label: 'Refeição',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {/* Quick Form */}
        {activeAction && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4"
          >
            <Card className="w-80 bg-card border border-primary/20 shadow-xl">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    {actions.find(a => a.type === activeAction)?.icon}
                    Registrar {actions.find(a => a.type === activeAction)?.label}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveAction(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {activeAction === 'weight' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="70.5"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleSubmitWeight}
                      disabled={!weight.trim() || loading}
                      className="w-full"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Registrar Peso'}
                    </Button>
                  </div>
                )}

                {activeAction === 'water' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="water">Quantidade (ml)</Label>
                      <Input
                        id="water"
                        type="number"
                        placeholder="250"
                        value={water}
                        onChange={(e) => setWater(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[250, 500, 750].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setWater(amount.toString())}
                          className="flex-1"
                        >
                          {amount}ml
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleSubmitWater}
                      disabled={!water.trim() || loading}
                      className="w-full"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Registrar Água'}
                    </Button>
                  </div>
                )}

                {activeAction === 'meal' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="meal">Descrição da Refeição</Label>
                      <Textarea
                        id="meal"
                        placeholder="Ex: 2 fatias de pão integral, 1 ovo, café com leite..."
                        value={mealDescription}
                        onChange={(e) => setMealDescription(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {getCurrentTime()}
                    </div>
                    <Button
                      onClick={handleSubmitMeal}
                      disabled={!mealDescription.trim() || loading}
                      className="w-full"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Registrar Refeição'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {isOpen && (
            <>
              {actions.map((action, index) => (
                <motion.div
                  key={action.type}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20, 
                    scale: 0.8,
                    transition: { delay: (actions.length - 1 - index) * 0.1 }
                  }}
                >
                  <Button
                    onClick={() => handleQuickAction(action.type)}
                    className={`h-12 w-12 rounded-full shadow-lg transition-all ${action.color} ${
                      activeAction === action.type ? 'scale-110 shadow-xl' : ''
                    }`}
                    size="sm"
                  >
                    {action.icon}
                  </Button>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main Toggle Button */}
        <motion.div
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className={`h-14 w-14 rounded-full shadow-lg transition-all ${
              isOpen 
                ? 'bg-red-500 hover:bg-red-600 rotate-45' 
                : 'bg-primary hover:bg-primary/90'
            }`}
            size="sm"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}