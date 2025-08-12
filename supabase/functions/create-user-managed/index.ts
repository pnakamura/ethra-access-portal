// Ethra Edge Function: create-user-managed
// Allows Sócios to create new users (cliente or gestor) via the admin panel.
// Gestores should add dependents using the existing create-dependent flow.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserPayload {
  nomeCompleto: string;
  email: string;
  celular?: string;
  password: string;
  tipoUsuario: 'cliente' | 'gestor';
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
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 2) Load requester role (via RLS – can view own profile)
    const { data: requester, error: profileError } = await supabase
      .from('usuarios')
      .select('id, tipo_usuario')
      .eq('id', user.id)
      .single();

    if (profileError || !requester) {
      console.error('Erro ao carregar perfil do solicitante:', profileError);
      return new Response(JSON.stringify({ error: 'Falha ao verificar permissões' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (requester.tipo_usuario !== 'socio') {
      return new Response(JSON.stringify({ error: 'Permissão negada: apenas Sócios podem criar usuários.' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 3) Parse and validate payload
    const payload = await req.json() as Partial<CreateUserPayload>;
    const nomeCompleto = (payload.nomeCompleto || '').trim();
    const email = (payload.email || '').trim().toLowerCase();
    const celular = (payload.celular || '').trim();
    const password = payload.password || '';
    const tipoUsuario = payload.tipoUsuario as 'cliente' | 'gestor';

    if (!nomeCompleto || !email || !password || !tipoUsuario) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: nomeCompleto, email, password, tipoUsuario' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (!['cliente', 'gestor'].includes(tipoUsuario)) {
      return new Response(JSON.stringify({ error: 'tipoUsuario inválido. Use: cliente ou gestor.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 4) Create Auth user (service role)
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nomeCompleto, phone: celular },
    });
    if (createError || !created?.user) {
      console.error('Erro ao criar usuário auth:', createError);
      return new Response(JSON.stringify({ error: createError?.message || 'Erro ao criar usuário.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const newUserId = created.user.id;

    // 5) Insert into public.usuarios (service role bypasses RLS)
    const { error: upsertError } = await admin
      .from('usuarios')
      .insert({
        id: newUserId,
        nome_completo: nomeCompleto,
        email,
        celular: celular || null,
        tipo_usuario: tipoUsuario,
        atualizado_em: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('Erro ao inserir na tabela usuarios:', upsertError);
      return new Response(JSON.stringify({ error: 'Usuário criado no Auth, mas falhou ao salvar perfil.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 6) Success
    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('Erro inesperado create-user-managed:', e);
    return new Response(JSON.stringify({ error: 'Erro inesperado' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
