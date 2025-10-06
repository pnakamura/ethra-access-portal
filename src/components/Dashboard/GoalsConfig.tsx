import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Save, Edit3, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface GoalsConfigProps {
  userId: string;
  currentGoals: {
    meta_peso?: number;
    meta_calorias?: number;
    meta_agua?: number;
  };
  onGoalsUpdate: () => void;
}

export function GoalsConfig({ userId, currentGoals, onGoalsUpdate }: GoalsConfigProps) {
  const [editing, setEditing] = useState(false);
  const [goals, setGoals] = useState({
    peso_objetivo: currentGoals.meta_peso || 0,
    calorias_diarias: currentGoals.meta_calorias || 2000,
    agua_diaria_ml: currentGoals.meta_agua || 2000,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setGoals({
      peso_objetivo: currentGoals.meta_peso || 0,
      calorias_diarias: currentGoals.meta_calorias || 2000,
      agua_diaria_ml: currentGoals.meta_agua || 2000,
    });
  }, [currentGoals]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('metas_usuario')
        .upsert({
          usuario_id: userId,
          peso_objetivo: goals.peso_objetivo || null,
          calorias_diarias: goals.calorias_diarias || null,
          agua_diaria_ml: goals.agua_diaria_ml || null,
          atualizado_em: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Metas atualizadas com sucesso!",
      });

      setEditing(false);
      onGoalsUpdate();
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar metas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setGoals({
      peso_objetivo: currentGoals.meta_peso || 0,
      calorias_diarias: currentGoals.meta_calorias || 2000,
      agua_diaria_ml: currentGoals.meta_agua || 2000,
    });
    setEditing(false);
  };

  return (
    <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configurar Metas
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  aria-label="Ajuda sobre configurar metas"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">🎯 Configurar Metas</h4>
                  <p className="text-sm text-muted-foreground">
                    Defina suas metas personalizadas para acompanhar seu progresso:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Peso:</strong> Seu objetivo de peso corporal</li>
                    <li><strong>Calorias:</strong> Meta diária de consumo calórico</li>
                    <li><strong>Água:</strong> Meta de hidratação em ml por dia</li>
                  </ul>
                  <p className="text-sm text-primary font-medium mt-2">
                    💡 Suas metas aparecem em todos os gráficos como linhas de referência!
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {!editing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditing(true)}
              aria-label="Editar metas de peso, calorias e água"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="peso">Meta de Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                value={goals.peso_objetivo}
                onChange={(e) => setGoals({ ...goals, peso_objetivo: Number(e.target.value) })}
                placeholder="Ex: 70"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="calorias">Meta de Calorias Diárias</Label>
              <Input
                id="calorias"
                type="number"
                value={goals.calorias_diarias}
                onChange={(e) => setGoals({ ...goals, calorias_diarias: Number(e.target.value) })}
                placeholder="Ex: 2000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agua">Meta de Água Diária (ml)</Label>
              <Input
                id="agua"
                type="number"
                value={goals.agua_diaria_ml}
                onChange={(e) => setGoals({ ...goals, agua_diaria_ml: Number(e.target.value) })}
                placeholder="Ex: 2000"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1" aria-label="Salvar metas configuradas">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving} aria-label="Cancelar edição de metas">
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentGoals.meta_peso ? `${currentGoals.meta_peso}kg` : 'Não definida'}
              </div>
              <div className="text-sm text-muted-foreground">Meta de Peso</div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentGoals.meta_calorias || 2000}
              </div>
              <div className="text-sm text-muted-foreground">Calorias/dia</div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentGoals.meta_agua || 2000}ml
              </div>
              <div className="text-sm text-muted-foreground">Água/dia</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}