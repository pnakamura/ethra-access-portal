import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  usuario_id: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
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

    const { usuario_id, tipo, data_inicio, data_fim }: RequestBody = await req.json();

    console.log(`🔄 Generating ${tipo} report for user ${usuario_id} from ${data_inicio} to ${data_fim}`);

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

    // Check if user can access the target user data
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

    // Permission check: only allow access to own data unless user is gestor/socio
    if (usuario_id !== user.id && !['gestor', 'socio'].includes(currentUser.tipo_usuario)) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Additional permission check for gestores (can only access their dependents)
    if (currentUser.tipo_usuario === 'gestor' && usuario_id !== user.id) {
      const { data: vinculos } = await supabaseClient
        .from('vinculos_usuarios')
        .select('usuario_id')
        .eq('usuario_principal_id', user.id)
        .eq('usuario_id', usuario_id)
        .eq('ativo', true);

      if (!vinculos || vinculos.length === 0) {
        return new Response(JSON.stringify({ error: 'Access denied - user not linked' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Collect data based on report type
    let nutritionData = [];
    let weightData = [];
    let hydrationData = [];

    if (tipo === 'completo' || tipo === 'nutricional') {
      const { data } = await supabaseClient
        .from('informacoes_nutricionais')
        .select('data_registro, calorias, proteinas, carboidratos, gorduras')
        .eq('usuario_id', usuario_id)
        .gte('data_registro', data_inicio)
        .lte('data_registro', data_fim)
        .is('deletado_em', null)
        .order('data_registro', { ascending: true });
      
      nutritionData = data || [];
    }

    if (tipo === 'completo' || tipo === 'peso') {
      const { data } = await supabaseClient
        .from('registro_peso')
        .select('data_registro, peso_kg')
        .eq('usuario_id', usuario_id)
        .gte('data_registro', data_inicio)
        .lte('data_registro', data_fim)
        .is('deletado_em', null)
        .order('data_registro', { ascending: true });
      
      weightData = data || [];
    }

    if (tipo === 'completo' || tipo === 'hidratacao') {
      const { data } = await supabaseClient
        .from('registro_hidratacao')
        .select('horario, quantidade_ml')
        .eq('usuario_id', usuario_id)
        .gte('horario', data_inicio)
        .lte('horario', data_fim)
        .is('deletado_em', null)
        .order('horario', { ascending: true });
      
      hydrationData = data || [];
    }

    // Process nutrition data
    const nutritionByDay = nutritionData.reduce((acc, item) => {
      const dateStr = item.data_registro.split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { data: dateStr, calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
      }
      acc[dateStr].calorias += Number(item.calorias) || 0;
      acc[dateStr].proteinas += Number(item.proteinas) || 0;
      acc[dateStr].carboidratos += Number(item.carboidratos) || 0;
      acc[dateStr].gorduras += Number(item.gorduras) || 0;
      return acc;
    }, {} as Record<string, any>);

    const dailyNutrition = Object.values(nutritionByDay);
    
    // Calculate totals and averages
    const totalNutrition = dailyNutrition.reduce((acc, day: any) => {
      acc.calorias += day.calorias;
      acc.proteinas += day.proteinas;
      acc.carboidratos += day.carboidratos;
      acc.gorduras += day.gorduras;
      return acc;
    }, { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 });

    const daysCount = dailyNutrition.length || 1;
    const averageNutrition = {
      calorias: totalNutrition.calorias / daysCount,
      proteinas: totalNutrition.proteinas / daysCount,
      carboidratos: totalNutrition.carboidratos / daysCount,
      gorduras: totalNutrition.gorduras / daysCount,
    };

    // Generate insights using OpenAI (if available)
    let insights = null;
    try {
      if (Deno.env.get('OPENAI_API_KEY')) {
        const insightsPrompt = `
Análise dos dados nutricionais do período de ${data_inicio} a ${data_fim}:

Dados médios diários:
- Calorias: ${averageNutrition.calorias.toFixed(0)}
- Proteínas: ${averageNutrition.proteinas.toFixed(1)}g
- Carboidratos: ${averageNutrition.carboidratos.toFixed(1)}g
- Gorduras: ${averageNutrition.gorduras.toFixed(1)}g

Registros de peso: ${weightData.length} medições
Registros de hidratação: ${hydrationData.length} registros

Forneça insights sobre:
1. Qualidade nutricional geral
2. Equilibrio de macronutrientes
3. Consistência dos registros
4. Recomendações específicas
5. Tendências identificadas

Responda em português, de forma clara e objetiva, como um nutricionista profissional.
        `;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Você é um nutricionista experiente que analisa dados nutricionais e fornece insights personalizados.' },
              { role: 'user', content: insightsPrompt }
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          insights = openaiData.choices[0]?.message?.content || null;
        }
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    }

    // Compare with previous period (if applicable)
    const startDate = new Date(data_inicio);
    const endDate = new Date(data_fim);
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    let comparison = null;
    try {
      const { data: previousNutrition } = await supabaseClient
        .from('informacoes_nutricionais')
        .select('calorias, proteinas, carboidratos, gorduras')
        .eq('usuario_id', usuario_id)
        .gte('data_registro', previousStartDate.toISOString().split('T')[0])
        .lte('data_registro', previousEndDate.toISOString().split('T')[0])
        .is('deletado_em', null);

      if (previousNutrition && previousNutrition.length > 0) {
        const previousTotal = previousNutrition.reduce((acc, item) => {
          acc.calorias += Number(item.calorias) || 0;
          acc.proteinas += Number(item.proteinas) || 0;
          return acc;
        }, { calorias: 0, proteinas: 0 });

        const previousAverage = {
          calorias: previousTotal.calorias / previousNutrition.length,
          proteinas: previousTotal.proteinas / previousNutrition.length,
        };

        comparison = {
          calorias: {
            anterior: previousAverage.calorias,
            atual: averageNutrition.calorias,
            percentual: ((averageNutrition.calorias - previousAverage.calorias) / previousAverage.calorias) * 100,
          },
          proteinas: {
            anterior: previousAverage.proteinas,
            atual: averageNutrition.proteinas,
            percentual: ((averageNutrition.proteinas - previousAverage.proteinas) / previousAverage.proteinas) * 100,
          },
        };
      }
    } catch (error) {
      console.error('Error calculating comparison:', error);
    }

    // Create report record
    const reportData = {
      usuario_id,
      data_inicio,
      data_fim,
      dados_nutricionais: {
        diarios: dailyNutrition,
        total: totalNutrition,
        media: averageNutrition,
        peso: weightData,
        hidratacao: hydrationData,
      },
      insights,
      comparacao_semanal: comparison,
      status_envio: 'pendente',
    };

    const { data: newReport, error: insertError } = await supabaseClient
      .from('relatorios_semanais')
      .insert([reportData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting report:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create report' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Report generated successfully: ${newReport.id}`);

    return new Response(JSON.stringify({ 
      message: 'Report generated successfully', 
      report_id: newReport.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-report-on-demand:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});