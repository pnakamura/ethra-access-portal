// Ethra Edge Function: update-user-password
// Allows authorized users to update user passwords

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdatePasswordPayload {
  userId: string;
  newPassword: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader ?? '' } },
  });
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1) Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2) Load requester profile
    const { data: requester, error: profileError } = await supabase
      .from('usuarios')
      .select('id, tipo_usuario')
      .eq('id', user.id)
      .single();

    if (profileError || !requester) {
      console.error('Erro ao carregar perfil do solicitante:', profileError);
      return new Response(
        JSON.stringify({ error: 'Falha ao verificar permissões' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 3) Parse payload
    const payload = await req.json() as Partial<UpdatePasswordPayload>;
    const userId = (payload.userId || '').trim();
    const newPassword = payload.newPassword || '';

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: userId, newPassword' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 4) Check permissions
    const isSocio = requester.tipo_usuario === 'socio';
    const isGestor = requester.tipo_usuario === 'gestor';
    const isOwnPassword = userId === user.id;

    // Load target user
    const { data: targetUser, error: targetError } = await supabase
      .from('usuarios')
      .select('tipo_usuario')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Permission logic:
    // - Sócio can update anyone's password
    // - Gestor can update dependents' passwords
    // - Anyone can update their own password
    const canUpdate = 
      isSocio || 
      isOwnPassword || 
      (isGestor && targetUser.tipo_usuario === 'dependente');

    if (!canUpdate) {
      return new Response(
        JSON.stringify({ error: 'Permissão negada para alterar esta senha' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 5) Update password using service role
    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message || 'Erro ao atualizar senha' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 6) Success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('Erro inesperado update-user-password:', e);
    return new Response(
      JSON.stringify({ error: 'Erro inesperado' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
