import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  report_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { report_id }: RequestBody = await req.json();

    console.log(`📄 Exporting report ${report_id} as HTML`);

    // Validate user permissions
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get report data
    const { data: report, error: reportError } = await supabaseClient
      .from('relatorios_semanais')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user can access this report
    const { data: currentUser } = await supabaseClient
      .from('usuarios')
      .select('tipo_usuario')
      .eq('id', user.id)
      .single();

    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Permission check
    if (report.usuario_id !== user.id && !['gestor', 'socio'].includes(currentUser.tipo_usuario)) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user info for report header
    const { data: reportUser } = await supabaseClient
      .from('usuarios')
      .select('nome_completo, email')
      .eq('id', report.usuario_id)
      .single();

    // Generate HTML content
    const htmlContent = generateHTMLReport(report, reportUser);

    console.log(`✅ HTML report generated for ${report_id}`);

    return new Response(htmlContent, {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="relatorio-${report_id}.html"`
      },
    });

  } catch (error) {
    console.error('Error in export-report-html:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateHTMLReport(report: any, user: any): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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

  const nutritionData = report.dados_nutricionais || {};
  const averageNutrition = nutritionData.media || {};
  const totalNutrition = nutritionData.total || {};
  const dailyData = nutritionData.diarios || [];
  const comparison = report.comparacao_semanal || {};

  // Prepare chart data exactly like ReportView
  const enhancedNutritionData = dailyData.map((day: any, index: number) => ({
    ...day,
    dia: `Dia ${index + 1}`,
    data_formatada: formatDate(day.data),
    meta_calorias: 2000,
    eficiencia: ((day.calorias || 0) / 2000) * 100,
  }));

  // Radar chart data
  const radarData = [
    { metric: 'Calorias', atual: Math.min((averageNutrition.calorias || 0) / 25, 100), meta: 80 },
    { metric: 'Proteínas', atual: Math.min((averageNutrition.proteinas || 0) / 2, 100), meta: 75 },
    { metric: 'Carboidratos', atual: Math.min((averageNutrition.carboidratos || 0) / 3, 100), meta: 70 },
    { metric: 'Gorduras', atual: Math.min((averageNutrition.gorduras || 0) / 1, 100), meta: 65 },
    { metric: 'Hidratação', atual: 85, meta: 90 },
    { metric: 'Exercícios', atual: 70, meta: 80 },
  ];

  // Macro data for pie chart
  const macroData = [
    { name: 'Proteínas', value: averageNutrition.proteinas || 0, color: 'hsl(142, 76%, 36%)' },
    { name: 'Carboidratos', value: averageNutrition.carboidratos || 0, color: 'hsl(38, 92%, 50%)' },
    { name: 'Gorduras', value: averageNutrition.gorduras || 0, color: 'hsl(262, 83%, 58%)' },
  ];

  const weeklyTrend = enhancedNutritionData.map((day: any, index: number) => ({
    dia: day.dia,
    calorias: day.calorias || 0,
    proteinas: day.proteinas || 0,
    peso_estimado: 70 - (index * 0.1),
  }));

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Nutricional - ${user?.nome_completo || user?.email}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
          --ethra-primary: 142 76% 36%;
          --ethra-secondary: 38 92% 50%;
          --ethra-accent: 262 83% 58%;
          --ethra-coral: 14 83% 58%;
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --muted: 210 40% 96%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --primary: 142 76% 36%;
          --primary-foreground: 355.7 100% 97.3%;
          --secondary: 210 40% 96%;
          --secondary-foreground: 222.2 84% 4.9%;
          --accent: 210 40% 96%;
          --accent-foreground: 222.2 84% 4.9%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --ring: 142 76% 36%;
          --radius: 0.75rem;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: hsl(var(--foreground));
            background: hsl(var(--background));
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
        }
        
        .space-y-6 > * + * {
            margin-top: 24px;
        }
        
        .card {
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: calc(var(--radius) + 2px);
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
        
        .card-header {
            padding: 24px 24px 0;
        }
        
        .card-content {
            padding: 24px;
        }
        
        .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 1;
            letter-spacing: -0.025em;
        }
        
        .header-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .text-muted-foreground {
            color: hsl(var(--muted-foreground));
        }
        
        .text-sm {
            font-size: 0.875rem;
            line-height: 1.25rem;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            border-radius: calc(var(--radius) - 2px);
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        
        .badge.default {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }
        
        .badge.secondary {
            background: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
        }
        
        .badge.destructive {
            background: hsl(var(--destructive));
            color: hsl(var(--destructive-foreground));
        }
        
        .grid {
            display: grid;
        }
        
        .grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        
        .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        
        .grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        
        .grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        
        .gap-4 {
            gap: 16px;
        }
        
        .gap-6 {
            gap: 24px;
        }
        
        .gradient-card-primary {
            background: linear-gradient(135deg, hsl(var(--ethra-primary) / 0.1) 0%, hsl(var(--ethra-primary) / 0.05) 100%);
            border-color: hsl(var(--ethra-primary) / 0.2);
        }
        
        .gradient-card-secondary {
            background: linear-gradient(135deg, hsl(var(--ethra-secondary) / 0.1) 0%, hsl(var(--ethra-secondary) / 0.05) 100%);
            border-color: hsl(var(--ethra-secondary) / 0.2);
        }
        
        .gradient-card-accent {
            background: linear-gradient(135deg, hsl(var(--ethra-accent) / 0.1) 0%, hsl(var(--ethra-accent) / 0.05) 100%);
            border-color: hsl(var(--ethra-accent) / 0.2);
        }
        
        .gradient-card-coral {
            background: linear-gradient(135deg, hsl(var(--ethra-coral) / 0.1) 0%, hsl(var(--ethra-coral) / 0.05) 100%);
            border-color: hsl(var(--ethra-coral) / 0.2);
        }
        
        .metric-card {
            padding: 24px;
            position: relative;
        }
        
        .metric-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .metric-icon-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .metric-icon {
            padding: 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .icon-primary {
            background: hsl(var(--ethra-primary) / 0.2);
            color: hsl(var(--ethra-primary));
        }
        
        .icon-secondary {
            background: hsl(var(--ethra-secondary) / 0.2);
            color: hsl(var(--ethra-secondary));
        }
        
        .icon-accent {
            background: hsl(var(--ethra-accent) / 0.2);
            color: hsl(var(--ethra-accent));
        }
        
        .icon-coral {
            background: hsl(var(--ethra-coral) / 0.2);
            color: hsl(var(--ethra-coral));
        }
        
        .metric-label {
            font-size: 0.875rem;
            font-weight: 500;
            color: hsl(var(--muted-foreground));
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 700;
        }
        
        .value-primary { color: hsl(var(--ethra-primary)); }
        .value-secondary { color: hsl(var(--ethra-secondary)); }
        .value-accent { color: hsl(var(--ethra-accent)); }
        .value-coral { color: hsl(var(--ethra-coral)); }
        
        .progress-container {
            margin-top: 16px;
        }
        
        .progress-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 0.75rem;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: hsl(var(--secondary));
            border-radius: 4px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .chart-container {
            background: hsl(var(--card));
            border-radius: calc(var(--radius) + 2px);
            padding: 24px;
            height: 400px;
            position: relative;
        }
        
        .chart-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .insights-container {
            background: linear-gradient(135deg, hsl(221 83% 53% / 0.1) 0%, hsl(221 83% 53% / 0.05) 100%);
            border-left: 4px solid hsl(221 83% 53%);
            padding: 24px;
            border-radius: 0 8px 8px 0;
        }
        
        .comparison-container {
            background: linear-gradient(135deg, hsl(var(--ethra-secondary) / 0.1) 0%, hsl(var(--ethra-secondary) / 0.05) 100%);
            border-left: 4px solid hsl(var(--ethra-secondary));
            padding: 24px;
            border-radius: 0 8px 8px 0;
        }
        
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 16px;
        }
        
        .comparison-item {
            background: hsl(var(--card));
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid hsl(var(--border));
        }
        
        .trend-up { color: hsl(142 76% 36%); }
        .trend-down { color: hsl(0 84.2% 60.2%); }
        
        .footer {
            text-align: center;
            color: hsl(var(--muted-foreground));
            font-size: 0.875rem;
            margin-top: 40px;
            padding: 24px;
            background: hsl(var(--card));
            border-radius: calc(var(--radius) + 2px);
            border-top: 4px solid hsl(var(--ethra-primary));
        }
        
        @media print {
            body { 
                background: white; 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .chart-container {
                break-inside: avoid;
            }
        }
        
        @media (max-width: 1024px) {
            .grid-cols-3 {
                grid-template-columns: repeat(1, minmax(0, 1fr));
            }
        }
        
        @media (max-width: 768px) {
            .grid-cols-2, .grid-cols-4 {
                grid-template-columns: repeat(1, minmax(0, 1fr));
            }
            .container {
                padding: 16px;
            }
            .header-flex {
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="space-y-6">
            <!-- Report Header -->
            <div class="card">
                <div class="card-header">
                    <div class="header-flex">
                        <div>
                            <h1 class="card-title" style="font-size: 2rem;">Relatório Nutricional</h1>
                            <p class="text-muted-foreground" style="margin-top: 4px;">
                                Período: ${formatDate(report.data_inicio)} - ${formatDate(report.data_fim)}
                            </p>
                        </div>
                        <div>
                            <span class="badge ${report.status_envio === 'enviado' ? 'default' : report.status_envio === 'pendente' ? 'secondary' : 'destructive'}">
                                ${getStatusText(report.status_envio)}
                            </span>
                        </div>
                    </div>
                    <div class="text-sm text-muted-foreground">
                        Gerado em: ${formatDateTime(report.criado_em)}
                        ${report.enviado_em ? ` • Enviado em: ${formatDateTime(report.enviado_em)}` : ''}
                    </div>
                </div>
            </div>

            <!-- Insights -->
            ${report.insights ? `
            <div class="card">
                <div class="card-header">
                    <h2 class="chart-title">
                        <span>⚡</span>
                        Insights e Análises
                    </h2>
                </div>
                <div class="card-content">
                    <p class="text-sm" style="line-height: 1.6; white-space: pre-wrap;">
                        ${report.insights}
                    </p>
                </div>
            </div>
            ` : ''}

            <!-- Enhanced Summary Cards -->
            <div class="grid grid-cols-4 gap-4">
                <div class="card gradient-card-primary">
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-icon-container">
                                <div class="metric-icon icon-primary">
                                    <span>🔥</span>
                                </div>
                                <div>
                                    <p class="metric-label">Calorias Diárias</p>
                                    <p class="metric-value value-primary">
                                        ${Math.round(averageNutrition.calorias || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-header">
                                <span>Meta: 2000 kcal</span>
                                <span>${Math.round(((averageNutrition.calorias || 0) / 2000) * 100)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(((averageNutrition.calorias || 0) / 2000) * 100, 100)}%; background: hsl(var(--ethra-primary));"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card gradient-card-secondary">
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-icon-container">
                                <div class="metric-icon icon-secondary">
                                    <span>🎯</span>
                                </div>
                                <div>
                                    <p class="metric-label">Proteínas Diárias</p>
                                    <p class="metric-value value-secondary">
                                        ${Math.round(averageNutrition.proteinas || 0)}g
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-header">
                                <span>Meta: 150g</span>
                                <span>${Math.round(((averageNutrition.proteinas || 0) / 150) * 100)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(((averageNutrition.proteinas || 0) / 150) * 100, 100)}%; background: hsl(var(--ethra-secondary));"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card gradient-card-accent">
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-icon-container">
                                <div class="metric-icon icon-accent">
                                    <span>⚡</span>
                                </div>
                                <div>
                                    <p class="metric-label">Carboidratos</p>
                                    <p class="metric-value value-accent">
                                        ${Math.round(averageNutrition.carboidratos || 0)}g
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-header">
                                <span>Meta: 250g</span>
                                <span>${Math.round(((averageNutrition.carboidratos || 0) / 250) * 100)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(((averageNutrition.carboidratos || 0) / 250) * 100, 100)}%; background: hsl(var(--ethra-accent));"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card gradient-card-coral">
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-icon-container">
                                <div class="metric-icon icon-coral">
                                    <span>💧</span>
                                </div>
                                <div>
                                    <p class="metric-label">Gorduras Diárias</p>
                                    <p class="metric-value value-coral">
                                        ${Math.round(averageNutrition.gorduras || 0)}g
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-header">
                                <span>Meta: 67g</span>
                                <span>${Math.round(((averageNutrition.gorduras || 0) / 67) * 100)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(((averageNutrition.gorduras || 0) / 67) * 100, 100)}%; background: hsl(var(--ethra-coral));"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-3 gap-6">
                <!-- Daily Nutrition Trend -->
                ${enhancedNutritionData.length > 0 ? `
                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h2 class="chart-title">
                            <span>⚡</span>
                            Evolução Nutricional Semanal
                        </h2>
                    </div>
                    <div class="card-content">
                        <canvas id="nutritionChart" width="800" height="350"></canvas>
                    </div>
                </div>
                ` : ''}

                <!-- Nutritional Balance Radar -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="chart-title">
                            <span>🎯</span>
                            Equilíbrio Nutricional
                        </h2>
                    </div>
                    <div class="card-content">
                        <canvas id="radarChart" width="300" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Secondary Charts Row -->
            <div class="grid grid-cols-2 gap-6">
                <!-- Macronutrients Distribution -->
                ${macroData.some(item => item.value > 0) ? `
                <div class="card">
                    <div class="card-header">
                        <h2 class="chart-title">
                            <span>⚖️</span>
                            Distribuição de Macronutrientes
                        </h2>
                    </div>
                    <div class="card-content">
                        <canvas id="pieChart" width="300" height="300"></canvas>
                    </div>
                </div>
                ` : ''}

                <!-- Weekly Performance -->
                ${weeklyTrend.length > 0 ? `
                <div class="card">
                    <div class="card-header">
                        <h2 class="chart-title">
                            <span>📅</span>
                            Performance Semanal
                        </h2>
                    </div>
                    <div class="card-content">
                        <canvas id="weeklyChart" width="300" height="300"></canvas>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Comparison Section -->
            ${Object.keys(comparison).length > 0 ? `
            <div class="card">
                <div class="card-header">
                    <h2 class="chart-title">
                        <span>📊</span>
                        Comparação com Período Anterior
                    </h2>
                </div>
                <div class="card-content">
                    <div class="comparison-grid">
                        ${Object.entries(comparison).map(([key, value]) => `
                        <div class="comparison-item">
                            <div style="font-weight: 600; margin-bottom: 8px;">${key}</div>
                            <div class="${typeof value === 'number' && value > 0 ? 'trend-up' : 'trend-down'}" style="font-size: 1.25rem; font-weight: 700;">
                                ${typeof value === 'number' ? (value > 0 ? '+' : '') + value.toFixed(1) + '%' : value}
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Total Values -->
            <div class="card">
                <div class="card-header">
                    <h2 class="chart-title">
                        <span>📈</span>
                        Totais do Período
                    </h2>
                </div>
                <div class="card-content">
                    <div class="grid grid-cols-4 gap-4">
                        <div class="comparison-item">
                            <div style="font-weight: 600; margin-bottom: 8px;">Calorias Totais</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: hsl(var(--ethra-primary));">
                                ${Math.round(totalNutrition.calorias || 0)}
                            </div>
                        </div>
                        <div class="comparison-item">
                            <div style="font-weight: 600; margin-bottom: 8px;">Proteínas Totais</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: hsl(var(--ethra-secondary));">
                                ${Math.round(totalNutrition.proteinas || 0)}g
                            </div>
                        </div>
                        <div class="comparison-item">
                            <div style="font-weight: 600; margin-bottom: 8px;">Carboidratos Totais</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: hsl(var(--ethra-accent));">
                                ${Math.round(totalNutrition.carboidratos || 0)}g
                            </div>
                        </div>
                        <div class="comparison-item">
                            <div style="font-weight: 600; margin-bottom: 8px;">Gorduras Totais</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: hsl(var(--ethra-coral));">
                                ${Math.round(totalNutrition.gorduras || 0)}g
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p><strong>Relatório gerado em:</strong> ${formatDateTime(new Date().toISOString())}</p>
                <p style="margin-top: 8px;">Este é um relatório automatizado do sistema de nutrição ETHRA</p>
            </div>
        </div>
    </div>

    <script>
        // Initialize charts after DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            ${enhancedNutritionData.length > 0 ? `
            // Area Chart for Nutrition Evolution
            const nutritionCtx = document.getElementById('nutritionChart')?.getContext('2d');
            if (nutritionCtx) {
                new Chart(nutritionCtx, {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(enhancedNutritionData.map(d => d.dia))},
                        datasets: [
                            {
                                label: 'Meta Calorias',
                                data: ${JSON.stringify(enhancedNutritionData.map(d => d.meta_calorias))},
                                borderColor: 'hsl(215.4, 16.3%, 46.9%)',
                                backgroundColor: 'hsla(215.4, 16.3%, 46.9%, 0.1)',
                                borderDash: [5, 5],
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Calorias',
                                data: ${JSON.stringify(enhancedNutritionData.map(d => d.calorias))},
                                borderColor: 'hsl(142, 76%, 36%)',
                                backgroundColor: 'hsla(142, 76%, 36%, 0.3)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Proteínas (×10)',
                                data: ${JSON.stringify(enhancedNutritionData.map(d => (d.proteinas || 0) * 10))},
                                borderColor: 'hsl(38, 92%, 50%)',
                                backgroundColor: 'hsla(38, 92%, 50%, 0.2)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top'
                            }
                        }
                    }
                });
            }
            ` : ''}

            // Radar Chart for Nutritional Balance
            const radarCtx = document.getElementById('radarChart')?.getContext('2d');
            if (radarCtx) {
                new Chart(radarCtx, {
                    type: 'radar',
                    data: {
                        labels: ${JSON.stringify(radarData.map(d => d.metric))},
                        datasets: [
                            {
                                label: 'Meta',
                                data: ${JSON.stringify(radarData.map(d => d.meta))},
                                borderColor: 'hsl(38, 92%, 50%)',
                                backgroundColor: 'hsla(38, 92%, 50%, 0.1)',
                                borderWidth: 2
                            },
                            {
                                label: 'Atual',
                                data: ${JSON.stringify(radarData.map(d => d.atual))},
                                borderColor: 'hsl(142, 76%, 36%)',
                                backgroundColor: 'hsla(142, 76%, 36%, 0.3)',
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100
                            }
                        }
                    }
                });
            }

            ${macroData.some(item => item.value > 0) ? `
            // Pie Chart for Macronutrients
            const pieCtx = document.getElementById('pieChart')?.getContext('2d');
            if (pieCtx) {
                new Chart(pieCtx, {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(macroData.map(d => d.name))},
                        datasets: [{
                            data: ${JSON.stringify(macroData.map(d => d.value))},
                            backgroundColor: ${JSON.stringify(macroData.map(d => d.color))},
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
            ` : ''}

            ${weeklyTrend.length > 0 ? `
            // Bar Chart for Weekly Performance
            const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
            if (weeklyCtx) {
                new Chart(weeklyCtx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(weeklyTrend.map(d => d.dia))},
                        datasets: [
                            {
                                label: 'Calorias',
                                data: ${JSON.stringify(weeklyTrend.map(d => d.calorias))},
                                backgroundColor: 'hsl(142, 76%, 36%)',
                                borderRadius: 4
                            },
                            {
                                label: 'Proteínas (×10)',
                                data: ${JSON.stringify(weeklyTrend.map(d => d.proteinas * 10))},
                                backgroundColor: 'hsl(38, 92%, 50%)',
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            ` : ''}
        });
    </script>
</body>
</html>
  `;
}