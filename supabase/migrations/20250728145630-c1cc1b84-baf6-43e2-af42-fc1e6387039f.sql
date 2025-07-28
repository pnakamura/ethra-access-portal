-- Fix get_user_stats function by removing reference to non-existent deletado_em column
CREATE OR REPLACE FUNCTION public.get_user_stats()
 RETURNS TABLE(total_usuarios integer, total_clientes integer, total_socios integer, total_gestores integer, total_dependentes integer, usuarios_ativos_30_dias integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
  FROM public.usuarios;
END;
$function$