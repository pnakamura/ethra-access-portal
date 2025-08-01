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
  const comparison = report.comparacao_semanal || {};

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Nutricional - ${user?.nome_completo || user?.email}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background: linear-gradient(135deg, #4ade80, #22c55e);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #22c55e;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-top: 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #22c55e;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #22c55e;
            margin: 10px 0;
        }
        .stat-label {
            color: #6b7280;
            font-size: 0.9em;
        }
        .insights {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .comparison {
            background: #fefce8;
            border-left: 4px solid #eab308;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        @media print {
            body { background: white; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório Nutricional</h1>
        <p><strong>${user?.nome_completo || user?.email}</strong></p>
        <p>Período: ${formatDate(report.data_inicio)} - ${formatDate(report.data_fim)}</p>
    </div>

    <div class="card">
        <h2>📊 Resumo Nutricional</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${Math.round(averageNutrition.calorias || 0)}</div>
                <div class="stat-label">Calorias Médias/Dia</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(averageNutrition.proteinas || 0)}g</div>
                <div class="stat-label">Proteínas Médias/Dia</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(averageNutrition.carboidratos || 0)}g</div>
                <div class="stat-label">Carboidratos Médios/Dia</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(averageNutrition.gorduras || 0)}g</div>
                <div class="stat-label">Gorduras Médias/Dia</div>
            </div>
        </div>
    </div>

    <div class="card">
        <h2>📈 Totais do Período</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${Math.round(totalNutrition.calorias || 0)}</div>
                <div class="stat-label">Total Calorias</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(totalNutrition.proteinas || 0)}g</div>
                <div class="stat-label">Total Proteínas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(totalNutrition.carboidratos || 0)}g</div>
                <div class="stat-label">Total Carboidratos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(totalNutrition.gorduras || 0)}g</div>
                <div class="stat-label">Total Gorduras</div>
            </div>
        </div>
    </div>

    ${report.insights ? `
    <div class="card">
        <h2>🎯 Insights e Análises</h2>
        <div class="insights">
            <p style="white-space: pre-wrap; margin: 0;">${report.insights}</p>
        </div>
    </div>
    ` : ''}

    ${comparison.calorias ? `
    <div class="card">
        <h2>📊 Comparação com Período Anterior</h2>
        <div class="comparison">
            <p><strong>Calorias:</strong> ${comparison.calorias.percentual > 0 ? '+' : ''}${comparison.calorias.percentual.toFixed(1)}% em relação ao período anterior</p>
            ${comparison.proteinas ? `<p><strong>Proteínas:</strong> ${comparison.proteinas.percentual > 0 ? '+' : ''}${comparison.proteinas.percentual.toFixed(1)}% em relação ao período anterior</p>` : ''}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>Sistema Ethra - Gestão Nutricional</p>
    </div>
</body>
</html>
  `;
}