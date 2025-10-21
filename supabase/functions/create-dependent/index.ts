import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateDependentRequest {
  nomeCompleto: string;
  email: string;
  celular?: string;
  password: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get current user from the authorization header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('Auth error:', userError)
      throw new Error('Unauthorized')
    }

    console.log('Current user:', user.id)

    // Check if user can manage dependents
    const { data: userData, error: userDataError } = await supabaseClient
      .from('usuarios')
      .select('tipo_usuario')
      .eq('id', user.id)
      .single()

    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
      throw new Error('Error checking user permissions')
    }

    const canManage = userData?.tipo_usuario === 'gestor' || userData?.tipo_usuario === 'socio'
    if (!canManage) {
      throw new Error('User not allowed to create dependents')
    }

    console.log('User authorized to create dependents')

    // Check dependent limit based on user's plan
    const { data: userWithPlan, error: planError } = await supabaseClient
      .from('usuarios')
      .select(`
        plano_id,
        planos:plano_id (
          max_dependentes
        )
      `)
      .eq('id', user.id)
      .single()

    if (planError) {
      console.error('Error fetching user plan:', planError)
      throw new Error('Error checking plan limits')
    }

    // Count current dependents
    const { count: currentDependents, error: countError } = await supabaseClient
      .from('vinculos_usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_principal_id', user.id)
      .eq('ativo', true)

    if (countError) {
      console.error('Error counting dependents:', countError)
      throw new Error('Error checking current dependents')
    }

    // Check if limit is reached (null means unlimited)
    const maxDependentes = userWithPlan.planos?.max_dependentes
    if (maxDependentes !== null && maxDependentes !== undefined) {
      if (currentDependents >= maxDependentes) {
        throw new Error(`Limite de dependentes atingido. Seu plano permite ${maxDependentes} dependente(s).`)
      }
    }

    console.log(`Current dependents: ${currentDependents}, Max allowed: ${maxDependentes || 'unlimited'}`)

    // Parse request body
    const { nomeCompleto, email, celular, password }: CreateDependentRequest = await req.json()

    if (!nomeCompleto || !email || !password) {
      throw new Error('Missing required fields')
    }

    console.log('Creating new user:', email)

    // Create user in auth using service role
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: nomeCompleto
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Failed to create user - no user data returned')
    }

    console.log('User created in auth:', authData.user.id)

    // Update user profile as dependent
    const { error: updateError } = await supabaseClient
      .from('usuarios')
      .update({
        nome_completo: nomeCompleto,
        email: email,
        celular: celular || null,
        tipo_usuario: 'dependente',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      throw new Error('User created but failed to update profile')
    }

    console.log('User profile updated')

    // Create link in vinculos_usuarios table
    const { error: linkError } = await supabaseClient
      .from('vinculos_usuarios')
      .insert({
        usuario_id: authData.user.id,
        usuario_principal_id: user.id,
        tipo_vinculo: 'dependente',
        ativo: true
      })

    if (linkError) {
      console.error('Link creation error:', linkError)
      // Don't throw here, as the user was created successfully
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Dependent created but failed to create link',
          user_id: authData.user.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Link created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dependent created successfully',
        user_id: authData.user.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in create-dependent function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})