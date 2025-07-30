-- Create role-based user statistics function
CREATE OR REPLACE FUNCTION public.get_user_stats_by_role()
RETURNS TABLE(
  total_usuarios integer, 
  total_clientes integer, 
  total_socios integer, 
  total_gestores integer, 
  total_dependentes integer, 
  usuarios_ativos_30_dias integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_type text;
BEGIN
  -- Get current user type
  SELECT tipo_usuario::text INTO current_user_type 
  FROM public.usuarios 
  WHERE id = auth.uid();
  
  -- If user is socio, return all stats (same as before)
  IF current_user_type = 'socio' THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::INTEGER as total_usuarios,
      COUNT(CASE WHEN tipo_usuario = 'cliente' THEN 1 END)::INTEGER as total_clientes,
      COUNT(CASE WHEN tipo_usuario = 'socio' THEN 1 END)::INTEGER as total_socios,
      COUNT(CASE WHEN tipo_usuario = 'gestor' THEN 1 END)::INTEGER as total_gestores,
      COUNT(CASE WHEN tipo_usuario = 'dependente' THEN 1 END)::INTEGER as total_dependentes,
      COUNT(CASE WHEN atualizado_em >= NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as usuarios_ativos_30_dias
    FROM public.usuarios;
    
  -- If user is gestor, return stats only for themselves and their dependents
  ELSIF current_user_type = 'gestor' THEN
    RETURN QUERY
    WITH user_scope AS (
      -- Get the gestor themselves
      SELECT u.* FROM public.usuarios u WHERE u.id = auth.uid()
      UNION
      -- Get their dependents through vinculos_usuarios
      SELECT u.* FROM public.usuarios u
      INNER JOIN public.vinculos_usuarios vu ON u.id = vu.usuario_id
      WHERE vu.usuario_principal_id = auth.uid() AND vu.ativo = true
    )
    SELECT 
      COUNT(*)::INTEGER as total_usuarios,
      COUNT(CASE WHEN tipo_usuario = 'cliente' THEN 1 END)::INTEGER as total_clientes,
      0::INTEGER as total_socios, -- Gestores don't see socios count
      COUNT(CASE WHEN tipo_usuario = 'gestor' THEN 1 END)::INTEGER as total_gestores,
      COUNT(CASE WHEN tipo_usuario = 'dependente' THEN 1 END)::INTEGER as total_dependentes,
      COUNT(CASE WHEN atualizado_em >= NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as usuarios_ativos_30_dias
    FROM user_scope;
    
  -- For other user types (cliente, dependente), return minimal stats
  ELSE
    RETURN QUERY
    SELECT 
      1::INTEGER as total_usuarios, -- Just themselves
      0::INTEGER as total_clientes,
      0::INTEGER as total_socios,
      0::INTEGER as total_gestores,
      0::INTEGER as total_dependentes,
      1::INTEGER as usuarios_ativos_30_dias -- Consider themselves as active
    FROM public.usuarios 
    WHERE id = auth.uid();
  END IF;
END;
$function$