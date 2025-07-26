import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Utensils, Calendar, Flame, Apple } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MealData {
  id: string;
  data_registro: string;
  calorias: number | null;
  proteinas: number | null;
  carboidratos: number | null;
  gorduras: number | null;
  descricao_ia: string | null;
  categoria_refeicao_id: string | null;
}

interface RecentMealsProps {
  userId: string;
}

export function RecentMeals({ userId }: RecentMealsProps) {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadRecentMeals();
    }
  }, [userId]);

  const loadRecentMeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('informacoes_nutricionais')
        .select('id, data_registro, calorias, proteinas, carboidratos, gorduras, descricao_ia, categoria_refeicao_id')
        .eq('usuario_id', userId)
        .is('deletado_em', null)
        .order('data_registro', { ascending: false })
        .limit(10);

      if (!error && data) {
        setMeals(data);
      }
    } catch (error) {
      console.error('Erro ao carregar refeições recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMealTypeColor = (categoria: string | null) => {
    switch (categoria) {
      case 'café_da_manhã': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'almoço': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'jantar': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'lanche': return 'bg-green-500/20 text-green-700 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getMealTypeName = (categoria: string | null) => {
    switch (categoria) {
      case 'café_da_manhã': return 'Café da Manhã';
      case 'almoço': return 'Almoço';
      case 'jantar': return 'Jantar';
      case 'lanche': return 'Lanche';
      default: return 'Refeição';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card-dark border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Refeições Recentes
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
          <Utensils className="h-5 w-5" />
          Refeições Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {meals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Utensils className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma refeição registrada ainda</p>
          </div>
        ) : (
          meals.map((meal) => (
            <Collapsible key={meal.id}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                  onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatDate(meal.data_registro)}</span>
                        {meal.categoria_refeicao_id && (
                          <Badge 
                            variant="outline" 
                            className={getMealTypeColor(meal.categoria_refeicao_id)}
                          >
                            {getMealTypeName(meal.categoria_refeicao_id)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {meal.calorias && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            <span>{Math.round(meal.calorias)} kcal</span>
                          </div>
                        )}
                        {meal.proteinas && (
                          <div className="flex items-center gap-1">
                            <Apple className="h-3 w-3" />
                            <span>{Math.round(meal.proteinas)}g prot</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${
                      expandedMeal === meal.id ? 'rotate-180' : ''
                    }`} 
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="mt-3 space-y-3">
                  {meal.descricao_ia && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1 font-medium">
                        Análise Nutricional:
                      </p>
                      <p className="text-sm">{meal.descricao_ia}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {meal.calorias && (
                      <div className="text-center p-2 bg-red-500/10 rounded">
                        <div className="text-lg font-bold text-red-600">{Math.round(meal.calorias)}</div>
                        <div className="text-xs text-muted-foreground">Calorias</div>
                      </div>
                    )}
                    {meal.proteinas && (
                      <div className="text-center p-2 bg-blue-500/10 rounded">
                        <div className="text-lg font-bold text-blue-600">{Math.round(meal.proteinas)}g</div>
                        <div className="text-xs text-muted-foreground">Proteínas</div>
                      </div>
                    )}
                    {meal.carboidratos && (
                      <div className="text-center p-2 bg-yellow-500/10 rounded">
                        <div className="text-lg font-bold text-yellow-600">{Math.round(meal.carboidratos)}g</div>
                        <div className="text-xs text-muted-foreground">Carboidratos</div>
                      </div>
                    )}
                    {meal.gorduras && (
                      <div className="text-center p-2 bg-green-500/10 rounded">
                        <div className="text-lg font-bold text-green-600">{Math.round(meal.gorduras)}g</div>
                        <div className="text-xs text-muted-foreground">Gorduras</div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
}