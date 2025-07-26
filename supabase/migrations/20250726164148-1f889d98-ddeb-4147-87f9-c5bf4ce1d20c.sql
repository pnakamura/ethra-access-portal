-- Fix infinite recursion in RLS policies by recreating functions with SECURITY DEFINER
-- Use CASCADE to drop dependent objects

-- Drop existing functions and their dependent policies
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_dependents() CASCADE;
DROP FUNCTION IF EXISTS public.is_socio(uuid) CASCADE;

-- Create SECURITY DEFINER functions to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = $1 AND tipo_usuario = 'gestor'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_socio(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = $1 AND tipo_usuario = 'socio'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_dependents()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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

-- Recreate essential RLS policies for all affected tables

-- usuarios table policies
CREATE POLICY "Users can view own profile, admins and socios can view all"
ON public.usuarios
FOR SELECT
TO authenticated
USING (is_current_user(id) OR is_admin() OR is_socio());

CREATE POLICY "Users can update own profile, admins can update all"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (is_current_user(id) OR is_admin());

CREATE POLICY "Only admins can delete users"
ON public.usuarios
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Users can create their own profile"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (is_current_user(id));

-- profiles table policies
CREATE POLICY "Users can view own profile, admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_current_user(user_id) OR is_admin());

CREATE POLICY "Users can update own profile, admins can update all"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_current_user(user_id) OR is_admin());

CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin());

-- admin_audit_log policies
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (is_admin());

-- informacoes_nutricionais policies
CREATE POLICY "Usuarios podem gerenciar suas proprias informacoes nutricionais"
ON public.informacoes_nutricionais
FOR ALL
TO authenticated
USING ((auth.uid() = usuario_id) OR is_admin());

-- registro_exercicios policies
CREATE POLICY "Usuarios podem gerenciar seus proprios exercicios"
ON public.registro_exercicios
FOR ALL
TO authenticated
USING ((auth.uid() = usuario_id) OR is_admin());

-- registro_medidas policies
CREATE POLICY "Usuarios podem gerenciar suas proprias medidas"
ON public.registro_medidas
FOR ALL
TO authenticated
USING ((auth.uid() = usuario_id) OR is_admin());

-- metas_usuario policies
CREATE POLICY "Usuarios podem gerenciar suas proprias metas"
ON public.metas_usuario
FOR ALL
TO authenticated
USING ((auth.uid() = usuario_id) OR is_admin());

-- objetivos_usuario policies
CREATE POLICY "Usuarios podem gerenciar seus proprios objetivos"
ON public.objetivos_usuario
FOR ALL
TO authenticated
USING ((auth.uid() = usuario_id) OR is_admin());