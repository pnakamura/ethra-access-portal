import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Download, TrendingUp, TrendingDown, Activity, Droplets, Target } from "lucide-react";
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

  // Comparison data
  const comparison = report.comparacao_semanal || {};

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
              <Button onClick={onExport} className="bg-ethra hover:bg-ethra/90">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-ethra" />
              <span className="text-sm font-medium">Calorias Média</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {Math.round(averageNutrition.calorias || 0)}
            </p>
            <p className="text-xs text-muted-foreground">kcal/dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-ethra-secondary" />
              <span className="text-sm font-medium">Proteínas Média</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {Math.round(averageNutrition.proteinas || 0)}g
            </p>
            <p className="text-xs text-muted-foreground">por dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-ethra-accent" />
              <span className="text-sm font-medium">Carboidratos Média</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {Math.round(averageNutrition.carboidratos || 0)}g
            </p>
            <p className="text-xs text-muted-foreground">por dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-ethra-coral" />
              <span className="text-sm font-medium">Gorduras Média</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {Math.round(averageNutrition.gorduras || 0)}g
            </p>
            <p className="text-xs text-muted-foreground">por dia</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Nutrition Chart */}
        {nutritionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução Diária - Calorias</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  calorias: {
                    label: "Calorias",
                    color: "hsl(var(--ethra-primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nutritionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="calorias" 
                      stroke="hsl(var(--ethra-primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Macronutrients Distribution */}
        {macroData.some(item => item.value > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Macronutrientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  proteinas: {
                    label: "Proteínas",
                    color: "hsl(var(--ethra-primary))",
                  },
                  carboidratos: {
                    label: "Carboidratos", 
                    color: "hsl(var(--ethra-secondary))",
                  },
                  gorduras: {
                    label: "Gorduras",
                    color: "hsl(var(--ethra-accent))",
                  },
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
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