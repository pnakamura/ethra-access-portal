import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Plus, Save, HelpCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WeightData {
  data_registro: string;
  peso_kg: number;
}

interface WeightChartProps {
  data: WeightData[];
  metaPeso?: number;
  period: "7d" | "30d" | "90d";
  onPeriodChange: (period: "7d" | "30d" | "90d") => void;
  userId: string;
  onWeightAdded?: () => void;
}

export function WeightChart({ data, metaPeso, period, onPeriodChange, userId, onWeightAdded }: WeightChartProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleAddWeight = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) {
      toast({
        title: "Erro",
        description: "Digite um peso válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('registro_peso')
        .insert({
          usuario_id: userId,
          peso_kg: parseFloat(newWeight),
          data_registro: `${selectedDate}T12:00:00.000Z`,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Peso registrado com sucesso!",
      });

      setIsAddDialogOpen(false);
      setNewWeight("");
      setSelectedDate(new Date().toISOString().split('T')[0]);
      
      if (onWeightAdded) {
        onWeightAdded();
      }
    } catch (error) {
      console.error('Erro ao registrar peso:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar peso",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const chartData = data.map(item => ({
    date: formatDate(item.data_registro),
    peso: Number(item.peso_kg),
  }));

  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].peso : 0;
  const firstWeight = chartData.length > 0 ? chartData[0].peso : 0;
  const weightChange = currentWeight - firstWeight;
  
  // Calculate trend for small datasets
  const getTrendData = () => {
    if (chartData.length < 2) return chartData;
    
    // For small datasets, show trend line
    const trend = chartData.map((point, index) => ({
      ...point,
      trend: firstWeight + (weightChange * index) / (chartData.length - 1)
    }));
    
    return trend;
  };

  const trendData = getTrendData();
  const progressToGoal = metaPeso ? ((currentWeight - metaPeso) / Math.abs(firstWeight - metaPeso)) * 100 : 0;

  return (
    <Card className="bg-card-dark border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Evolução do Peso</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  aria-label="Ajuda sobre evolução do peso"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">📊 Evolução do Peso</h4>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe sua jornada de peso ao longo do tempo. Este gráfico mostra:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Linha azul:</strong> Seu peso registrado</li>
                    <li><strong>Linha vermelha tracejada:</strong> Sua meta de peso</li>
                    <li><strong>Variação:</strong> Mudança total no período</li>
                  </ul>
                  <p className="text-sm text-primary font-medium mt-2">
                    💡 Dica: Registre seu peso regularmente para ver tendências mais claras!
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
              aria-label="Registrar novo peso"
            >
              <Plus className="h-4 w-4" />
              Registrar
            </Button>
            <Button
              variant={period === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("7d")}
              aria-label="Visualizar últimos 7 dias"
              aria-pressed={period === "7d"}
            >
              7d
            </Button>
            <Button
              variant={period === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("30d")}
              aria-label="Visualizar últimos 30 dias"
              aria-pressed={period === "30d"}
            >
              30d
            </Button>
            <Button
              variant={period === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("90d")}
              aria-label="Visualizar últimos 90 dias"
              aria-pressed={period === "90d"}
            >
              90d
            </Button>
          </div>
        </div>
        {chartData.length > 0 && (
          <div className="space-y-1">
            {chartData.length > 1 && (
              <div className="text-sm text-muted-foreground">
                Variação: 
                <span className={`ml-1 font-medium ${weightChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                </span>
              </div>
            )}
            {metaPeso && currentWeight && (
              <div className="text-sm text-muted-foreground">
                Até a meta: 
                <span className={`ml-1 font-medium ${currentWeight > metaPeso ? 'text-red-500' : 'text-green-500'}`}>
                  {(currentWeight - metaPeso).toFixed(1)}kg
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum registro de peso encontrado</p>
              <p className="text-sm">Registre seu peso para acompanhar a evolução</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-muted-foreground"
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  className="text-muted-foreground" 
                  fontSize={11}
                  tick={{ fontSize: 11 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'peso') return [`${value}kg`, 'Peso Atual'];
                    if (name === 'trend') return [`${value}kg`, 'Tendência'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                {metaPeso && (
                  <ReferenceLine 
                    y={metaPeso} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: `Meta: ${metaPeso}kg`, 
                      position: "top",
                      style: { fontSize: '11px', fill: 'hsl(var(--destructive))' }
                    }}
                  />
                )}
                {/* Trend line for datasets with few points */}
                {chartData.length > 1 && chartData.length < 5 && (
                  <Line 
                    type="linear" 
                    dataKey="trend" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={false}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    return (
                      <circle 
                        key={`dot-${index}`}
                        cx={cx} 
                        cy={cy} 
                        r={6}
                        fill="hsl(var(--primary))"
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ 
                    r: 8, 
                    stroke: 'hsl(var(--primary))', 
                    strokeWidth: 3,
                    fill: 'hsl(var(--background))'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      
      {/* Dialog para adicionar peso */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Peso</DialogTitle>
            <DialogDescription>
              Registre seu peso em uma data específica para acompanhar sua evolução.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                aria-label="Peso em quilogramas"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Data do Registro</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                aria-label="Data do registro de peso"
              />
              <p className="text-xs text-muted-foreground">
                Por padrão, a data atual está selecionada
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddWeight}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Peso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}