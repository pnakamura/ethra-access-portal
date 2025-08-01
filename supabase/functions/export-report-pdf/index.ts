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

    console.log(`📄 Exporting report ${report_id} to PDF`);

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

    // For now, return the HTML as text since we don't have PDF generation library
    // In a real implementation, you would use puppeteer or similar to generate PDF
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
    console.error('Error in export-report-pdf:', error);
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

  const nutritionData = report.dados_nutricionais || {};
  const averageNutrition = nutritionData.media || {};
  const totalNutrition = nutritionData.total || {};
  const dailyData = nutritionData.diarios || [];
  const comparison = report.comparacao_semanal || {};

  // Generate chart data for visualization
  const generateChartData = () => {
    return dailyData.map((day: any, index: number) => ({
      dia: `Dia ${index + 1}`,
      calorias: day.calorias || 0,
      proteinas: day.proteinas || 0,
      carboidratos: day.carboidratos || 0,
      gorduras: day.gorduras || 0,
      meta_calorias: 2000,
    }));
  };

  const chartData = generateChartData();

  // Generate macronutrients data
  const macroData = [
    { name: 'Proteínas', value: averageNutrition.proteinas || 0, color: '#10b981' },
    { name: 'Carboidratos', value: averageNutrition.carboidratos || 0, color: '#f59e0b' },
    { name: 'Gorduras', value: averageNutrition.gorduras || 0, color: '#ef4444' },
  ];

  const macroTotal = macroData.reduce((sum, item) => sum + item.value, 0);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Nutricional - ${user?.nome_completo || user?.email}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            font-weight: 500;
        }
        
        .header .period {
            font-size: 1rem;
            opacity: 0.8;
            margin-top: 5px;
        }
        
        .badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            margin: 10px 0;
        }
        
        .badge.enviado {
            background: rgba(16, 185, 129, 0.2);
            color: #065f46;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .badge.pendente {
            background: rgba(245, 158, 11, 0.2);
            color: #92400e;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .card {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 25px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid rgba(229, 231, 235, 0.8);
        }
        
        .card h2 {
            color: #10b981;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border-left: 5px solid #10b981;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card.primary {
            border-left-color: #10b981;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
        }
        
        .stat-card.secondary {
            border-left-color: #f59e0b;
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
        }
        
        .stat-card.accent {
            border-left-color: #8b5cf6;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
        }
        
        .stat-card.coral {
            border-left-color: #ef4444;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 15px 0 10px 0;
        }
        
        .stat-card.primary .stat-value { color: #10b981; }
        .stat-card.secondary .stat-value { color: #f59e0b; }
        .stat-card.accent .stat-value { color: #8b5cf6; }
        .stat-card.coral .stat-value { color: #ef4444; }
        
        .stat-label {
            color: #6b7280;
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 10px;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .progress-text {
            font-size: 0.8rem;
            color: #6b7280;
            margin-top: 5px;
            display: flex;
            justify-content: space-between;
        }
        
        .chart-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            height: 400px;
            position: relative;
        }
        
        .chart-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin: 30px 0;
        }
        
        .insights {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-left: 5px solid #3b82f6;
            padding: 25px;
            margin: 20px 0;
            border-radius: 0 12px 12px 0;
            position: relative;
        }
        
        .insights::before {
            content: '💡';
            font-size: 1.5rem;
            position: absolute;
            top: 20px;
            left: -15px;
            background: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .comparison {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 5px solid #f59e0b;
            padding: 25px;
            margin: 20px 0;
            border-radius: 0 12px 12px 0;
        }
        
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .comparison-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .trend-up {
            color: #10b981;
        }
        
        .trend-down {
            color: #ef4444;
        }
        
        .macro-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        
        .macro-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-radius: 8px;
            background: #f9fafb;
            width: 100%;
        }
        
        .macro-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }
        
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 40px;
            padding: 30px;
            background: white;
            border-radius: 16px;
            border-top: 4px solid #10b981;
        }
        
        .daily-chart {
            width: 100%;
            height: 300px;
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
        
        @media (max-width: 768px) {
            .chart-grid {
                grid-template-columns: 1fr;
            }
            .stats-grid {
                grid-template-columns: 1fr;
            }
            .container {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório Nutricional</h1>
            <div class="subtitle">${user?.nome_completo || user?.email}</div>
            <div class="period">📅 ${formatDate(report.data_inicio)} - ${formatDate(report.data_fim)}</div>
            <div class="badge ${report.status_envio}">
                ${report.status_envio === 'enviado' ? '✅ Enviado' : 
                  report.status_envio === 'pendente' ? '⏳ Pendente' : '❌ Falha'}
            </div>
        </div>

        <!-- Enhanced Summary Cards -->
        <div class="card">
            <h2>🎯 Resumo Nutricional Diário</h2>
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-label">🔥 Calorias Diárias</div>
                    <div class="stat-value">${Math.round(averageNutrition.calorias || 0)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(((averageNutrition.calorias || 0) / 2000) * 100, 100)}%; background: #10b981;"></div>
                    </div>
                    <div class="progress-text">
                        <span>Meta: 2000 kcal</span>
                        <span>${Math.round(((averageNutrition.calorias || 0) / 2000) * 100)}%</span>
                    </div>
                </div>
                
                <div class="stat-card secondary">
                    <div class="stat-label">🥩 Proteínas Diárias</div>
                    <div class="stat-value">${Math.round(averageNutrition.proteinas || 0)}g</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(((averageNutrition.proteinas || 0) / 150) * 100, 100)}%; background: #f59e0b;"></div>
                    </div>
                    <div class="progress-text">
                        <span>Meta: 150g</span>
                        <span>${Math.round(((averageNutrition.proteinas || 0) / 150) * 100)}%</span>
                    </div>
                </div>
                
                <div class="stat-card accent">
                    <div class="stat-label">🍞 Carboidratos</div>
                    <div class="stat-value">${Math.round(averageNutrition.carboidratos || 0)}g</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(((averageNutrition.carboidratos || 0) / 250) * 100, 100)}%; background: #8b5cf6;"></div>
                    </div>
                    <div class="progress-text">
                        <span>Meta: 250g</span>
                        <span>${Math.round(((averageNutrition.carboidratos || 0) / 250) * 100)}%</span>
                    </div>
                </div>
                
                <div class="stat-card coral">
                    <div class="stat-label">🥑 Gorduras Diárias</div>
                    <div class="stat-value">${Math.round(averageNutrition.gorduras || 0)}g</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(((averageNutrition.gorduras || 0) / 67) * 100, 100)}%; background: #ef4444;"></div>
                    </div>
                    <div class="progress-text">
                        <span>Meta: 67g</span>
                        <span>${Math.round(((averageNutrition.gorduras || 0) / 67) * 100)}%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        ${chartData.length > 0 ? `
        <div class="chart-grid">
            <div class="card">
                <h2>📈 Evolução Nutricional Semanal</h2>
                <div class="chart-container">
                    <canvas id="nutritionChart" class="daily-chart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h2>⚖️ Distribuição de Macronutrientes</h2>
                <div class="macro-chart">
                    <canvas id="macroChart" style="width: 250px; height: 250px;"></canvas>
                    <div style="width: 100%;">
                        ${macroData.map(macro => `
                            <div class="macro-item">
                                <div class="macro-color" style="background: ${macro.color};"></div>
                                <span style="flex: 1;">${macro.name}</span>
                                <span style="font-weight: 600;">${macro.value.toFixed(0)}g</span>
                                <span style="color: #6b7280;">${macroTotal > 0 ? ((macro.value / macroTotal) * 100).toFixed(0) : 0}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Insights -->
        ${report.insights ? `
        <div class="card">
            <h2>🎯 Insights e Análises Inteligentes</h2>
            <div class="insights">
                <p style="white-space: pre-wrap; margin: 0; font-size: 1.1rem; line-height: 1.7;">${report.insights}</p>
            </div>
        </div>
        ` : ''}

        <!-- Comparison -->
        ${comparison.calorias ? `
        <div class="card">
            <h2>📊 Comparação com Período Anterior</h2>
            <div class="comparison">
                <h3 style="margin-bottom: 15px; color: #92400e;">Variações Percentuais</h3>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">🔥 Calorias</div>
                        <div class="${comparison.calorias.percentual > 0 ? 'trend-up' : 'trend-down'}" style="font-size: 1.5rem; font-weight: 700;">
                            ${comparison.calorias.percentual > 0 ? '↗️ +' : '↘️ '}${Math.abs(comparison.calorias.percentual).toFixed(1)}%
                        </div>
                    </div>
                    ${comparison.proteinas ? `
                    <div class="comparison-item">
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">🥩 Proteínas</div>
                        <div class="${comparison.proteinas.percentual > 0 ? 'trend-up' : 'trend-down'}" style="font-size: 1.5rem; font-weight: 700;">
                            ${comparison.proteinas.percentual > 0 ? '↗️ +' : '↘️ '}${Math.abs(comparison.proteinas.percentual).toFixed(1)}%
                        </div>
                    </div>
                    ` : ''}
                    ${comparison.peso ? `
                    <div class="comparison-item">
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">⚖️ Peso</div>
                        <div class="${comparison.peso.percentual > 0 ? 'trend-down' : 'trend-up'}" style="font-size: 1.5rem; font-weight: 700;">
                            ${comparison.peso.percentual > 0 ? '↗️ +' : '↘️ '}${Math.abs(comparison.peso.percentual).toFixed(1)}%
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Totals -->
        <div class="card">
            <h2>📈 Totais Acumulados do Período</h2>
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-label">Total de Calorias</div>
                    <div class="stat-value">${Math.round(totalNutrition.calorias || 0).toLocaleString()}</div>
                    <div style="color: #6b7280; font-size: 0.9rem;">kcal consumidas</div>
                </div>
                <div class="stat-card secondary">
                    <div class="stat-label">Total de Proteínas</div>
                    <div class="stat-value">${Math.round(totalNutrition.proteinas || 0)}g</div>
                    <div style="color: #6b7280; font-size: 0.9rem;">proteínas consumidas</div>
                </div>
                <div class="stat-card accent">
                    <div class="stat-label">Total de Carboidratos</div>
                    <div class="stat-value">${Math.round(totalNutrition.carboidratos || 0)}g</div>
                    <div style="color: #6b7280; font-size: 0.9rem;">carboidratos consumidos</div>
                </div>
                <div class="stat-card coral">
                    <div class="stat-label">Total de Gorduras</div>
                    <div class="stat-value">${Math.round(totalNutrition.gorduras || 0)}g</div>
                    <div style="color: #6b7280; font-size: 0.9rem;">gorduras consumidas</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 10px;">
                📄 Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
            <div style="color: #10b981; font-weight: 600;">
                🌿 Sistema Ethra - Gestão Nutricional Inteligente
            </div>
            <div style="margin-top: 10px; font-size: 0.8rem;">
                ID do Relatório: ${report.id}
            </div>
        </div>
    </div>

    <script>
        // Initialize charts after page load
        window.addEventListener('load', function() {
            ${chartData.length > 0 ? `
            // Nutrition Evolution Chart
            const nutritionCtx = document.getElementById('nutritionChart');
            if (nutritionCtx) {
                new Chart(nutritionCtx, {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(chartData.map(d => d.dia))},
                        datasets: [
                            {
                                label: 'Meta Calorias',
                                data: ${JSON.stringify(chartData.map(d => d.meta_calorias))},
                                borderColor: '#9ca3af',
                                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                borderDash: [5, 5],
                                fill: true,
                                tension: 0.1
                            },
                            {
                                label: 'Calorias',
                                data: ${JSON.stringify(chartData.map(d => d.calorias))},
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.3)',
                                fill: true,
                                tension: 0.4,
                                borderWidth: 3
                            },
                            {
                                label: 'Proteínas (×10)',
                                data: ${JSON.stringify(chartData.map(d => d.proteinas * 10))},
                                borderColor: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                fill: false,
                                tension: 0.4,
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0,0,0,0.1)'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(0,0,0,0.1)'
                                }
                            }
                        }
                    }
                });
            }

            // Macronutrients Pie Chart
            const macroCtx = document.getElementById('macroChart');
            if (macroCtx) {
                new Chart(macroCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ${JSON.stringify(macroData.map(d => d.name))},
                        datasets: [{
                            data: ${JSON.stringify(macroData.map(d => d.value))},
                            backgroundColor: ${JSON.stringify(macroData.map(d => d.color))},
                            borderColor: '#ffffff',
                            borderWidth: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
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