import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Download, TrendingUp, TrendingDown, Activity, Droplets, Target, Flame, Scale, Heart, Calendar } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  id: string;
  usuario_id: string;
  data_inicio: string;
  data_fim: string;
  dados_nutricionais: any;
  insights: string | null;
  status_envio: string;
  criado_em: string;
  enviado_em: string | null;
  comparacao_semanal: any;
}

interface ReportViewProps {
  report: ReportData;
  onExport: () => void;
}

export function ReportView({ report, onExport }: ReportViewProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'enviado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'falha':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'enviado':
        return 'Enviado';
      case 'pendente':
        return 'Pendente';
      case 'falha':
        return 'Falha';
      default:
        return 'Desconhecido';
    }
  };

  // Process nutrition data for charts
  const nutritionData = report.dados_nutricionais?.diarios || [];
  const totalNutrition = report.dados_nutricionais?.total || {};
  const averageNutrition = report.dados_nutricionais?.media || {};

  // Prepare data for pie chart
  const macroData = [
    { name: 'Proteínas', value: averageNutrition.proteinas || 0, color: 'hsl(var(--ethra-primary))' },
    { name: 'Carboidratos', value: averageNutrition.carboidratos || 0, color: 'hsl(var(--ethra-secondary))' },
    { name: 'Gorduras', value: averageNutrition.gorduras || 0, color: 'hsl(var(--ethra-accent))' },
  ];

  // Enhanced nutrition data with multiple metrics
  const enhancedNutritionData = nutritionData.map((day, index) => ({
    ...day,
    dia: `Dia ${index + 1}`,
    data_formatada: formatDate(day.data),
    meta_calorias: 2000, // Could be dynamic based on user goals
    eficiencia: ((day.calorias || 0) / 2000) * 100,
  }));

  // Radar chart data for nutritional balance
  const radarData = [
    { metric: 'Calorias', atual: Math.min((averageNutrition.calorias || 0) / 25, 100), meta: 80 },
    { metric: 'Proteínas', atual: Math.min((averageNutrition.proteinas || 0) / 2, 100), meta: 75 },
    { metric: 'Carboidratos', atual: Math.min((averageNutrition.carboidratos || 0) / 3, 100), meta: 70 },
    { metric: 'Gorduras', atual: Math.min((averageNutrition.gorduras || 0) / 1, 100), meta: 65 },
    { metric: 'Hidratação', atual: 85, meta: 90 }, // Mock data
    { metric: 'Exercícios', atual: 70, meta: 80 }, // Mock data
  ];

  // Comparison data
  const comparison = report.comparacao_semanal || {};

  // Weekly trend data
  const weeklyTrend = enhancedNutritionData.map((day, index) => ({
    dia: day.dia,
    calorias: day.calorias || 0,
    proteinas: day.proteinas || 0,
    peso_estimado: 70 - (index * 0.1), // Mock weight progression
  }));

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Relatório Nutricional</CardTitle>
              <p className="text-muted-foreground mt-1">
                Período: {formatDate(report.data_inicio)} - {formatDate(report.data_fim)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={getStatusVariant(report.status_envio)}>
                {getStatusText(report.status_envio)}
              </Badge>
              <Button onClick={onExport} variant="outline" className="border-ethra text-ethra hover:bg-ethra hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Gerado em: {formatDateTime(report.criado_em)}
            {report.enviado_em && ` • Enviado em: ${formatDateTime(report.enviado_em)}`}
          </div>
        </CardHeader>
      </Card>

      {/* Insights */}
      {report.insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Insights e Análises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {report.insights}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-ethra/10 to-ethra/5 border-ethra/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ethra/20 rounded-lg">
                  <Flame className="h-5 w-5 text-ethra" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Calorias Diárias</p>
                  <p className="text-2xl font-bold text-ethra">
                    {Math.round(averageNutrition.calorias || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Meta: 2000 kcal</span>
                <span>{Math.round(((averageNutrition.calorias || 0) / 2000) * 100)}%</span>
              </div>
              <Progress value={Math.min(((averageNutrition.calorias || 0) / 2000) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-ethra-secondary/10 to-ethra-secondary/5 border-ethra-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ethra-secondary/20 rounded-lg">
                  <Target className="h-5 w-5 text-ethra-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proteínas Diárias</p>
                  <p className="text-2xl font-bold text-ethra-secondary">
                    {Math.round(averageNutrition.proteinas || 0)}g
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Meta: 150g</span>
                <span>{Math.round(((averageNutrition.proteinas || 0) / 150) * 100)}%</span>
              </div>
              <Progress value={Math.min(((averageNutrition.proteinas || 0) / 150) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-ethra-accent/10 to-ethra-accent/5 border-ethra-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ethra-accent/20 rounded-lg">
                  <Activity className="h-5 w-5 text-ethra-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carboidratos</p>
                  <p className="text-2xl font-bold text-ethra-accent">
                    {Math.round(averageNutrition.carboidratos || 0)}g
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Meta: 250g</span>
                <span>{Math.round(((averageNutrition.carboidratos || 0) / 250) * 100)}%</span>
              </div>
              <Progress value={Math.min(((averageNutrition.carboidratos || 0) / 250) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-ethra-coral/10 to-ethra-coral/5 border-ethra-coral/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ethra-coral/20 rounded-lg">
                  <Droplets className="h-5 w-5 text-ethra-coral" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gorduras Diárias</p>
                  <p className="text-2xl font-bold text-ethra-coral">
                    {Math.round(averageNutrition.gorduras || 0)}g
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Meta: 67g</span>
                <span>{Math.round(((averageNutrition.gorduras || 0) / 67) * 100)}%</span>
              </div>
              <Progress value={Math.min(((averageNutrition.gorduras || 0) / 67) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Nutrition Trend */}
        {enhancedNutritionData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Evolução Nutricional Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  calorias: { label: "Calorias", color: "hsl(var(--ethra-primary))" },
                  proteinas: { label: "Proteínas", color: "hsl(var(--ethra-secondary))" },
                  meta_calorias: { label: "Meta", color: "hsl(var(--muted-foreground))" },
                }}
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enhancedNutritionData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) => `${value}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="meta_calorias"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                    <Area
                      type="monotone"
                      dataKey="calorias"
                      stroke="hsl(var(--ethra-primary))"
                      fill="hsl(var(--ethra-primary))"
                      fillOpacity={0.3}
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="proteinas"
                      stroke="hsl(var(--ethra-secondary))"
                      fill="hsl(var(--ethra-secondary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Nutritional Balance Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Equilíbrio Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                atual: { label: "Atual", color: "hsl(var(--ethra-primary))" },
                meta: { label: "Meta", color: "hsl(var(--ethra-secondary))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                  <Radar
                    name="Meta"
                    dataKey="meta"
                    stroke="hsl(var(--ethra-secondary))"
                    fill="hsl(var(--ethra-secondary))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Atual"
                    dataKey="atual"
                    stroke="hsl(var(--ethra-primary))"
                    fill="hsl(var(--ethra-primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macronutrients Distribution */}
        {macroData.some(item => item.value > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Distribuição de Macronutrientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  proteinas: { label: "Proteínas", color: "hsl(var(--ethra-primary))" },
                  carboidratos: { label: "Carboidratos", color: "hsl(var(--ethra-secondary))" },
                  gorduras: { label: "Gorduras", color: "hsl(var(--ethra-accent))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => [`${value}g`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Weekly Performance */}
        {weeklyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Performance Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  calorias: { label: "Calorias", color: "hsl(var(--ethra-primary))" },
                  proteinas: { label: "Proteínas (×10)", color: "hsl(var(--ethra-secondary))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="calorias" 
                      fill="hsl(var(--ethra-primary))" 
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.8}
                    />
                    <Bar 
                      dataKey="proteinas" 
                      fill="hsl(var(--ethra-secondary))" 
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.6}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparison with Previous Period */}
      {comparison && Object.keys(comparison).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação com Período Anterior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparison.calorias && (
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  {comparison.calorias.percentual > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Calorias</p>
                    <p className="text-sm text-muted-foreground">
                      {comparison.calorias.percentual > 0 ? '+' : ''}{comparison.calorias.percentual.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {comparison.proteinas && (
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  {comparison.proteinas.percentual > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Proteínas</p>
                    <p className="text-sm text-muted-foreground">
                      {comparison.proteinas.percentual > 0 ? '+' : ''}{comparison.proteinas.percentual.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {comparison.peso && (
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  {comparison.peso.percentual > 0 ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium">Peso</p>
                    <p className="text-sm text-muted-foreground">
                      {comparison.peso.percentual > 0 ? '+' : ''}{comparison.peso.percentual.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data */}
      {totalNutrition && Object.keys(totalNutrition).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Totais do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-ethra">{Math.round(totalNutrition.calorias || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Calorias</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ethra-secondary">{Math.round(totalNutrition.proteinas || 0)}g</p>
                <p className="text-sm text-muted-foreground">Total Proteínas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ethra-accent">{Math.round(totalNutrition.carboidratos || 0)}g</p>
                <p className="text-sm text-muted-foreground">Total Carboidratos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ethra-coral">{Math.round(totalNutrition.gorduras || 0)}g</p>
                <p className="text-sm text-muted-foreground">Total Gorduras</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}