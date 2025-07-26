-- PHASE 2: Fix missing RLS policies on RLS-enabled tables and remaining security issues

-- Fix missing policies on RLS-enabled tables
CREATE POLICY "Admins can manage audit logs" 
ON public.admin_audit_log 
FOR ALL 
USING (is_admin());

CREATE POLICY "Users can view audit logs related to them" 
ON public.admin_audit_log 
FOR SELECT 
USING (auth.uid() = target_user_id OR is_admin());

-- METAS_USUARIO policies
CREATE POLICY "Users can manage their own goals" 
ON public.metas_usuario 
FOR ALL 
USING (auth.uid() = usuario_id);

-- OBJETIVOS_USUARIO policies  
CREATE POLICY "Users can manage their own objectives" 
ON public.objetivos_usuario 
FOR ALL 
USING (auth.uid() = usuario_id);

-- REGISTRO_EXERCICIOS policies
CREATE POLICY "Users can manage their own exercise records" 
ON public.registro_exercicios 
FOR ALL 
USING (auth.uid() = usuario_id);

-- REGISTRO_MEDIDAS policies
CREATE POLICY "Users can manage their own measurement records" 
ON public.registro_medidas 
FOR ALL 
USING (auth.uid() = usuario_id);

-- Enable RLS on CATEGORIAS_REFEICAO (was missing)
ALTER TABLE public.categorias_refeicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meal categories" 
ON public.categorias_refeicao 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage meal categories" 
ON public.categorias_refeicao 
FOR ALL 
USING (is_admin());

-- PHASE 3: Fix database function security - Add SET search_path = '' to all SECURITY DEFINER functions

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = $1 AND tipo_usuario = 'gestor'
  );
END;
$function$;

-- Fix is_socio function
CREATE OR REPLACE FUNCTION public.is_socio(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = $1 AND tipo_usuario = 'socio'
  );
END;
$function$;

-- Fix get_user_stats function
CREATE OR REPLACE FUNCTION public.get_user_stats()
 RETURNS TABLE(total_usuarios integer, total_clientes integer, total_socios integer, total_gestores integer, total_dependentes integer, usuarios_ativos_30_dias integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_usuarios,
    COUNT(CASE WHEN tipo_usuario = 'cliente' THEN 1 END)::INTEGER as total_clientes,
    COUNT(CASE WHEN tipo_usuario = 'socio' THEN 1 END)::INTEGER as total_socios,
    COUNT(CASE WHEN tipo_usuario = 'gestor' THEN 1 END)::INTEGER as total_gestores,
    COUNT(CASE WHEN tipo_usuario = 'dependente' THEN 1 END)::INTEGER as total_dependentes,
    COUNT(CASE WHEN atualizado_em >= NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as usuarios_ativos_30_dias
  FROM public.usuarios
  WHERE deletado_em IS NULL;
END;
$function$;

-- Fix can_manage_dependents function
CREATE OR REPLACE FUNCTION public.can_manage_dependents()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo_usuario::text INTO user_tipo 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  RETURN user_tipo IN ('gestor', 'socio');
END;
$function$;

-- Fix get_user_dashboard_data function
CREATE OR REPLACE FUNCTION public.get_user_dashboard_data(user_id uuid)
 RETURNS TABLE(peso_atual numeric, ultimo_peso numeric, meta_peso numeric, meta_calorias integer, meta_agua integer, calorias_hoje numeric, agua_hoje integer, registros_peso_30_dias integer, registros_nutricao_30_dias integer, registros_agua_30_dias integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.peso_atual_kg,
    (SELECT rp.peso_kg FROM public.registro_peso rp WHERE rp.usuario_id = user_id AND rp.deletado_em IS NULL ORDER BY rp.data_registro DESC LIMIT 1),
    m.peso_objetivo,
    m.calorias_diarias,
    m.agua_diaria_ml,
    COALESCE((SELECT SUM(inf.calorias) FROM public.informacoes_nutricionais inf WHERE inf.usuario_id = user_id AND inf.data_registro::date = CURRENT_DATE AND inf.deletado_em IS NULL), 0),
    COALESCE((SELECT SUM(rh.quantidade_ml) FROM public.registro_hidratacao rh WHERE rh.usuario_id = user_id AND rh.horario::date = CURRENT_DATE AND rh.deletado_em IS NULL), 0)::INTEGER,
    (SELECT COUNT(*) FROM public.registro_peso rp WHERE rp.usuario_id = user_id AND rp.data_registro >= CURRENT_DATE - INTERVAL '30 days' AND rp.deletado_em IS NULL)::INTEGER,
    (SELECT COUNT(*) FROM public.informacoes_nutricionais inf WHERE inf.usuario_id = user_id AND inf.data_registro >= CURRENT_DATE - INTERVAL '30 days' AND inf.deletado_em IS NULL)::INTEGER,
    (SELECT COUNT(DISTINCT rh.horario::date) FROM public.registro_hidratacao rh WHERE rh.usuario_id = user_id AND rh.horario >= CURRENT_DATE - INTERVAL '30 days' AND rh.deletado_em IS NULL)::INTEGER
  FROM public.usuarios u
  LEFT JOIN public.metas_usuario m ON m.usuario_id = u.id
  WHERE u.id = user_id;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.usuarios (id, nome_completo, email, celular, tipo_usuario, atualizado_em)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        'cliente',
        now()
    );
    RETURN new;
END;
$function$;

-- Fix make_user_admin function
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  UPDATE public.usuarios 
  SET tipo_usuario = 'gestor'
  WHERE email = user_email;
END;
$function$;

-- Fix log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action(action_type text, target_user_id uuid DEFAULT NULL::uuid, target_email text DEFAULT NULL::text, action_details jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, target_email, details)
  VALUES (auth.uid(), action_type, target_user_id, target_email, action_details);
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$function$;

-- Fix is_current_user function
CREATE OR REPLACE FUNCTION public.is_current_user(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN auth.uid() = user_id;
END;
$function$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  user_tipo text;
BEGIN
  SELECT tipo_usuario::text INTO user_tipo 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  RETURN user_tipo;
END;
$function$;