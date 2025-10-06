import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Utensils, Calendar, Flame, Apple, Wheat, Droplets } from 'lucide-react';
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
  categoria_nome: string | null;
}

interface RecentMealsProps {
  userId: string;
}

export function RecentMeals({ userId }: RecentMealsProps) {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    console.log('🍽️ RecentMeals useEffect - userId:', userId, 'selectedDate:', selectedDate);
    if (userId) {
      loadMealsForDate();
    }
  }, [userId, selectedDate]);

  const loadMealsForDate = async () => {
    try {
      setLoading(true);
      
      console.log('🍽️ RecentMeals - selectedDate:', selectedDate);
      
      // Buscar pela data UTC direta, igual ao gráfico faz
      const startDateUTC = `${selectedDate}T00:00:00.000Z`;
      const endDateUTC = `${selectedDate}T23:59:59.999Z`;
      
      console.log('🍽️ RecentMeals - Query range:', { startDateUTC, endDateUTC });

      const { data, error } = await supabase
        .from('informacoes_nutricionais')
        .select(`
          id, 
          data_registro, 
          calorias, 
          proteinas, 
          carboidratos, 
          gorduras, 
          descricao_ia, 
          categoria_refeicao_id,
          categorias_refeicao!inner(nome)
        `)
        .eq('usuario_id', userId)
        .is('deletado_em', null)
        .gte('data_registro', startDateUTC)
        .lte('data_registro', endDateUTC)
        .order('data_registro', { ascending: false });
      
      console.log('🍽️ RecentMeals - Results:', data?.length || 0, 'meals found');
      if (data && data.length > 0) {
        console.log('🍽️ RecentMeals - Sample timestamps:', data.map(m => m.data_registro));
      }

      if (!error && data) {
        const mealsWithCategory = data.map(meal => ({
          ...meal,
          categoria_nome: meal.categorias_refeicao?.nome || null
        }));
        setMeals(mealsWithCategory);
      }
    } catch (error) {
      console.error('Erro ao carregar refeições:', error);
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

  const getMealTypeColor = (categoryName: string | null) => {
    if (!categoryName) return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    
    const name = categoryName.toLowerCase();
    if (name.includes('café') || name.includes('manhã')) {
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    }
    if (name.includes('almoço')) {
      return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
    }
    if (name.includes('jantar') || name.includes('ceia')) {
      return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    }
    if (name.includes('lanche')) {
      return 'bg-green-500/20 text-green-700 border-green-500/30';
    }
    return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
  };

  const parseAIDescription = (descricaoIa: string | null) => {
    if (!descricaoIa) return null;

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(descricaoIa);
      if (parsed['resposta openAI']) {
        return parsed['resposta openAI'];
      }
    } catch {
      // If not JSON, return as is
    }

    // Clean up markdown formatting
    return descricaoIa
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/#+\s*/g, '') // Remove headers
      .replace(/\n\n+/g, '\n\n') // Normalize line breaks
      .trim();
  };

  if (loading) {
    return (
      <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Refeições do Dia
          </CardTitle>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-36 h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Refeições do Dia
          </CardTitle>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-36 h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {meals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Utensils className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma refeição registrada para este dia</p>
            <p className="text-xs mt-1">Selecione outro dia para visualizar</p>
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
                        {meal.categoria_nome && (
                          <Badge 
                            variant="outline" 
                            className={getMealTypeColor(meal.categoria_nome)}
                          >
                            {meal.categoria_nome}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {meal.calorias && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-red-500" />
                            <span>{Math.round(meal.calorias)} kcal</span>
                          </div>
                        )}
                        {meal.proteinas && (
                          <div className="flex items-center gap-1">
                            <Apple className="h-3 w-3 text-blue-500" />
                            <span>{Math.round(meal.proteinas)}g prot</span>
                          </div>
                        )}
                        {meal.carboidratos && (
                          <div className="flex items-center gap-1">
                            <Wheat className="h-3 w-3 text-yellow-500" />
                            <span>{Math.round(meal.carboidratos)}g carb</span>
                          </div>
                        )}
                        {meal.gorduras && (
                          <div className="flex items-center gap-1">
                            <Droplets className="h-3 w-3 text-green-500" />
                            <span>{Math.round(meal.gorduras)}g gord</span>
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
                    <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-sm font-semibold mb-2 text-foreground">
                        💡 Análise Nutricional IA
                      </p>
                      <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {parseAIDescription(meal.descricao_ia)}
                      </div>
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